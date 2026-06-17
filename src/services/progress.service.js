const StudentRepository = require("../repositories/student.repository");
const ProgressRepository = require("../repositories/progress.repository");
const AppError = require("../utils/AppError");
const Course = require("../models/Course.model");
const CourseMaterial = require("../models/CourseMaterial.model");
const Assignment = require("../models/Assignment.model");
const StudentAssignment = require("../models/StudentAssignment.model");

const studentRepository = new StudentRepository();
const progressRepository = new ProgressRepository();

class ProgressService {
  // ─── Internal helpers ────────────────────────────────────────────────────

  _computeProgressPercentage(completedMaterials, totalMaterials, submittedAssignments, totalAssignments) {
    const denominator = totalMaterials + totalAssignments;
    if (denominator === 0) return 0;
    return Math.round(((completedMaterials + submittedAssignments) / denominator) * 100 * 10) / 10;
  }

  _computeStatus(pct) {
    if (pct <= 0) return "NOT_STARTED";
    if (pct >= 100) return "COMPLETED";
    return "IN_PROGRESS";
  }

  _computeStreak(allCompletions) {
    if (!allCompletions.length) {
      return { current: 0, longest: 0, daysActiveThisWeek: 0, daysActiveThisMonth: 0, consistencyScore: 0 };
    }

    // Unique calendar dates (YYYY-MM-DD) with activity
    const toDateStr = (d) => new Date(d).toISOString().slice(0, 10);
    const uniqueDates = [...new Set(allCompletions.map((c) => toDateStr(c.completedAt)))].sort();

    const today = toDateStr(new Date());

    // Current streak — count back from today
    let currentStreak = 0;
    const d = new Date();
    while (true) {
      const ds = toDateStr(d);
      if (uniqueDates.includes(ds)) {
        currentStreak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak
    let longest = 0;
    let run = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        run = 1;
      } else {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        run = diffDays === 1 ? run + 1 : 1;
      }
      longest = Math.max(longest, run);
    }

    // Days active this week (Mon–Sun of current week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const daysActiveThisWeek = uniqueDates.filter((ds) => {
      const d = new Date(ds);
      return d >= monday && d <= sunday;
    }).length;

    // Days active this month
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysActiveThisMonth = uniqueDates.filter((ds) => {
      const d = new Date(ds);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;

    const consistencyScore = Math.round((daysActiveThisMonth / daysInMonth) * 100);

    return { current: currentStreak, longest, daysActiveThisWeek, daysActiveThisMonth, consistencyScore };
  }

  _computeWeeklyActivity(allCompletions) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    allCompletions.forEach(({ completedAt }) => {
      const d = new Date(completedAt);
      if (d >= monday && d <= sunday) {
        counts[days[d.getDay()]]++;
      }
    });

    // Return Mon–Sun order
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      completions: counts[day],
    }));
  }

  _computeMostActiveDayOfWeek(allCompletions) {
    if (!allCompletions.length) return null;
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    allCompletions.forEach(({ completedAt }) => {
      counts[new Date(completedAt).getDay()]++;
    });
    const maxIdx = counts.indexOf(Math.max(...counts));
    return dayNames[maxIdx];
  }

  async _buildProgressForCourse(studentId, course, progressRecord, submittedAssignmentIds) {
    const courseId = course._id;

    const [materials, assignments] = await Promise.all([
      CourseMaterial.find({ course: courseId }).select("_id title mimeType").lean(),
      Assignment.find({ course: courseId }).select("_id title dueDate").lean(),
    ]);

    const completedMaterialIds = new Set(
      (progressRecord?.materialCompletions || []).map((mc) => mc.material.toString())
    );
    const submittedSet = new Set(submittedAssignmentIds.map((id) => id.toString()));

    const completedMaterials = completedMaterialIds.size;
    const totalMaterials = materials.length;
    const totalAssignments = assignments.length;
    const submittedAssignments = assignments.filter((a) => submittedSet.has(a._id.toString())).length;

    const progressPercentage = this._computeProgressPercentage(
      completedMaterials, totalMaterials, submittedAssignments, totalAssignments
    );
    const status = this._computeStatus(progressPercentage);

    const duration = course.duration || 0;
    const estimatedHoursSpent = Math.round((duration * progressPercentage) / 100 * 10) / 10;
    const estimatedHoursRemaining = Math.round((duration * (100 - progressPercentage)) / 100 * 10) / 10;

    return {
      courseId: courseId.toString(),
      title: course.title,
      lecturerName: course.lecturer?.user?.name || null,
      duration,
      progressPercentage,
      completedMaterials,
      totalMaterials,
      completedAssignments: submittedAssignments,
      totalAssignments,
      status,
      lastAccessedAt: progressRecord?.lastAccessedAt || null,
      estimatedHoursSpent,
      estimatedHoursRemaining,
      materials: materials.map((m) => ({
        materialId: m._id.toString(),
        title: m.title,
        mimeType: m.mimeType,
        completed: completedMaterialIds.has(m._id.toString()),
        completedAt: progressRecord?.materialCompletions?.find(
          (mc) => mc.material.toString() === m._id.toString()
        )?.completedAt || null,
      })),
      assignments: assignments.map((a) => ({
        assignmentId: a._id.toString(),
        title: a.title,
        dueDate: a.dueDate,
        submitted: submittedSet.has(a._id.toString()),
      })),
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async markMaterialComplete(courseId, materialId, userId) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    const enrolled = (student.enrolledCourses || []).some(
      (c) => (c._id || c).toString() === courseId.toString()
    );
    if (!enrolled) throw new AppError("You are not enrolled in this course.", 403);

    const material = await CourseMaterial.findOne({ _id: materialId, course: courseId });
    if (!material) throw new AppError("Material not found in this course.", 404);

    await progressRepository.upsertMaterialCompletion(student._id, courseId, materialId);
    return { message: "Material marked as complete." };
  }

  async unmarkMaterialComplete(courseId, materialId, userId) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    const enrolled = (student.enrolledCourses || []).some(
      (c) => (c._id || c).toString() === courseId.toString()
    );
    if (!enrolled) throw new AppError("You are not enrolled in this course.", 403);

    await progressRepository.removeMaterialCompletion(student._id, courseId, materialId);
    return { message: "Material marked as incomplete." };
  }

  async getCourseProgress(courseId, userId) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    const enrolled = (student.enrolledCourses || []).some(
      (c) => (c._id || c).toString() === courseId.toString()
    );
    if (!enrolled) throw new AppError("You are not enrolled in this course.", 403);

    const course = await Course.findById(courseId)
      .populate({ path: "lecturer", populate: { path: "user", select: "name" } })
      .lean();
    if (!course) throw new AppError("Course not found.", 404);

    const [progressRecord, allAssignmentIds] = await Promise.all([
      progressRepository.findByStudentAndCourse(student._id, courseId),
      Assignment.distinct("_id", { course: courseId }),
    ]);

    const submittedIds = allAssignmentIds.length
      ? await StudentAssignment.distinct("assignment", {
          student: student._id,
          assignment: { $in: allAssignmentIds },
          status: { $in: ["SUBMITTED", "LATE_SUBMISSION"] },
        })
      : [];

    return await this._buildProgressForCourse(student._id, course, progressRecord, submittedIds);
  }

  async getProgressOverview(userId) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    const courseIds = (student.enrolledCourses || []).map((c) => c._id || c);

    if (!courseIds.length) {
      return {
        summary: {
          overallProgress: 0,
          totalEnrolled: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          totalEstimatedHours: 0,
          estimatedHoursSpent: 0,
        },
        courses: [],
        learningTime: { totalEstimatedHours: 0, note: "Estimated from course duration × progress" },
        streak: { current: 0, longest: 0, daysActiveThisWeek: 0, daysActiveThisMonth: 0, consistencyScore: 0 },
        insights: {
          mostStudiedCourse: null,
          closestToCompletion: null,
          coursesRequiringAttention: [],
          mostActiveDayOfWeek: null,
          weeklyActivityData: [],
        },
      };
    }

    const [courses, progressRecords, allAssignmentIds] = await Promise.all([
      Course.find({ _id: { $in: courseIds } })
        .populate({ path: "lecturer", populate: { path: "user", select: "name" } })
        .lean(),
      progressRepository.findAllByStudent(student._id),
      Assignment.distinct("_id", { course: { $in: courseIds } }),
    ]);

    const submittedIds = allAssignmentIds.length
      ? await StudentAssignment.distinct("assignment", {
          student: student._id,
          assignment: { $in: allAssignmentIds },
          status: { $in: ["SUBMITTED", "LATE_SUBMISSION"] },
        })
      : [];

    const progressMap = {};
    progressRecords.forEach((pr) => {
      progressMap[pr.course.toString()] = pr;
    });

    const courseProgressList = await Promise.all(
      courses.map((course) =>
        this._buildProgressForCourse(
          student._id,
          course,
          progressMap[course._id.toString()] || null,
          submittedIds
        )
      )
    );

    // Summary
    let totalProgress = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let totalEstimatedHours = 0;
    let estimatedHoursSpent = 0;

    courseProgressList.forEach((cp) => {
      totalProgress += cp.progressPercentage;
      totalEstimatedHours += cp.duration || 0;
      estimatedHoursSpent += cp.estimatedHoursSpent || 0;
      if (cp.status === "COMPLETED") completed++;
      else if (cp.status === "IN_PROGRESS") inProgress++;
      else notStarted++;
    });

    const overallProgress =
      courseProgressList.length > 0
        ? Math.round((totalProgress / courseProgressList.length) * 10) / 10
        : 0;

    // Streak — flatten all materialCompletions across all progress records
    const allCompletions = progressRecords.flatMap((pr) => pr.materialCompletions || []);
    const streak = this._computeStreak(allCompletions);
    const weeklyActivityData = this._computeWeeklyActivity(allCompletions);
    const mostActiveDayOfWeek = this._computeMostActiveDayOfWeek(allCompletions);

    // Insights
    let mostStudiedCourse = null;
    let closestToCompletion = null;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let maxCompletions = -1;
    let maxPct = -1;
    const requiresAttention = [];

    courseProgressList.forEach((cp) => {
      if (cp.completedMaterials > maxCompletions) {
        maxCompletions = cp.completedMaterials;
        mostStudiedCourse = { courseId: cp.courseId, title: cp.title };
      }
      if (cp.status === "IN_PROGRESS" && cp.progressPercentage > maxPct) {
        maxPct = cp.progressPercentage;
        closestToCompletion = { courseId: cp.courseId, title: cp.title, progressPercentage: cp.progressPercentage };
      }
      if (
        cp.status === "IN_PROGRESS" &&
        cp.lastAccessedAt &&
        new Date(cp.lastAccessedAt) < sevenDaysAgo
      ) {
        requiresAttention.push({ courseId: cp.courseId, title: cp.title, lastAccessedAt: cp.lastAccessedAt });
      }
    });

    return {
      summary: {
        overallProgress,
        totalEnrolled: courseIds.length,
        completed,
        inProgress,
        notStarted,
        totalEstimatedHours: Math.round(totalEstimatedHours * 10) / 10,
        estimatedHoursSpent: Math.round(estimatedHoursSpent * 10) / 10,
      },
      courses: courseProgressList,
      learningTime: {
        totalEstimatedHours: Math.round(estimatedHoursSpent * 10) / 10,
        note: "Estimated from course duration × progress",
      },
      streak,
      insights: {
        mostStudiedCourse,
        closestToCompletion,
        coursesRequiringAttention: requiresAttention,
        mostActiveDayOfWeek,
        weeklyActivityData,
      },
    };
  }
}

module.exports = new ProgressService();
