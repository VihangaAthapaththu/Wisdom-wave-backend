const cron = require("node-cron");
const Assignment = require("../models/Assignment.model");
const Student = require("../models/Student.model");
const Notification = require("../models/Notification.model");
const notificationService = require("./notification.service");
const { deadlineReminderEmail } = require("../utils/emailTemplates");

const THRESHOLDS_DAYS = [7, 3, 1];

async function runDeadlineCheck() {
  try {
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60000);

    const assignments = await Assignment.find({
      dueDate: { $gte: now, $lte: sevenDaysOut },
    }).populate({
      path: "course",
      select: "title",
      populate: { path: "lecturer", populate: { path: "user", select: "name email" } },
    });

    for (const assignment of assignments) {
      const msLeft = new Date(assignment.dueDate) - now;
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      const matchedThreshold = THRESHOLDS_DAYS.find(
        (t) => daysLeft <= t && daysLeft > (THRESHOLDS_DAYS[THRESHOLDS_DAYS.indexOf(t) + 1] ?? 0)
      );
      if (!matchedThreshold) continue;

      // Find enrolled students in this course
      const students = await Student.find({
        enrolledCourses: assignment.course._id,
      }).populate("user", "name email");

      for (const student of students) {
        if (!student.user) continue;

        // Idempotency: skip if this threshold reminder was already sent today
        const alreadySent = await Notification.exists({
          recipient: student.user._id,
          "data.assignmentId": assignment._id,
          type: "DEADLINE_APPROACHING",
          "data.daysThreshold": matchedThreshold,
        });
        if (alreadySent) continue;

        const title = `Deadline Reminder: ${assignment.title}`;
        const message = `Your assignment "${assignment.title}" in ${assignment.course.title} is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`;

        const emailTemplate = deadlineReminderEmail({
          studentName:     student.user.name,
          courseName:      assignment.course.title,
          assignmentTitle: assignment.title,
          dueDate:         assignment.dueDate,
          daysLeft,
          ctaUrl:          `${process.env.CLIENT_URL || "http://localhost:5173"}/student-dashboard`,
        });

        await notificationService.createAndEmit(student.user._id, "DEADLINE_APPROACHING", {
          title,
          message,
          data: {
            assignmentId:   assignment._id,
            courseId:       assignment.course._id,
            courseName:     assignment.course.title,
            dueDate:        assignment.dueDate,
            daysThreshold:  matchedThreshold,
          },
          emailPayload: { to: student.user.email, ...emailTemplate },
        });
      }
    }
  } catch (err) {
    console.error("[DeadlineScheduler] Error:", err.message);
  }
}

function startDeadlineScheduler() {
  // Run every day at 08:00 server time
  cron.schedule("0 8 * * *", runDeadlineCheck, { timezone: "UTC" });
  console.log("[DeadlineScheduler] Deadline reminder scheduler started (daily at 08:00 UTC).");
}

module.exports = { startDeadlineScheduler, runDeadlineCheck };
