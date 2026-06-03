const AssignmentRepository = require("../repositories/assignment.repository");
const StudentRepository = require("../repositories/student.repository");
const LecturerRepository = require("../repositories/lecturer.repository");
const Course = require("../models/Course.model");
const AppError = require("../utils/AppError");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const assignmentRepository = new AssignmentRepository();
const studentRepository = new StudentRepository();
const lecturerRepository = new LecturerRepository();

class AssignmentService {
  /**
   * Verify the requesting user may manage assignments for this course.
   * ADMIN: always allowed. LECTURER: must own the course.
   */
  async _assertManageAccess(courseId, user) {
    if (user.role === "ADMIN") return;
    if (user.role === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(user._id);
      if (!lecturer) throw new AppError("Lecturer profile not found.", 404);
      const owns = lecturer.courses.some((id) => id.toString() === courseId.toString());
      if (!owns) throw new AppError("You are not assigned to this course.", 403);
      return;
    }
    throw new AppError("Forbidden.", 403);
  }

  /**
   * Create an assignment for a course.
   */
  async createAssignment(courseId, { title, description, dueDate }, user) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);

    await this._assertManageAccess(courseId, user);

    return await assignmentRepository.create({ course: courseId, title, description, dueDate });
  }

  /**
   * Get all assignments for a course.
   * Accessible by enrolled students, the assigned lecturer, or admin.
   */
  async getAssignmentsForCourse(courseId, user) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);

    if (user.role === "STUDENT") {
      const student = await studentRepository.findByUserId(user._id);
      const enrolled = student?.enrolledCourses.some(
        (c) => (c._id || c).toString() === courseId.toString()
      );
      if (!enrolled) throw new AppError("You are not enrolled in this course.", 403);
    } else if (user.role === "LECTURER") {
      await this._assertManageAccess(courseId, user);
    }

    return await assignmentRepository.findByCourse(courseId);
  }

  /**
   * Get a single assignment by ID.
   */
  async getAssignmentById(assignmentId) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found.", 404);
    return assignment;
  }

  /**
   * Update an assignment.
   */
  async updateAssignment(assignmentId, data, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found.", 404);

    await this._assertManageAccess(assignment.course._id || assignment.course, user);

    return await assignmentRepository.update(assignmentId, data);
  }

  /**
   * Delete an assignment.
   */
  async deleteAssignment(assignmentId, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found.", 404);

    await this._assertManageAccess(assignment.course._id || assignment.course, user);

    await assignmentRepository.delete(assignmentId);
  }

  /**
   * Student submits an assignment (with optional file upload to Cloudinary).
   */
  async submitAssignment(assignmentId, userId, body, file) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found.", 404);

    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    const courseId = assignment.course._id || assignment.course;
    const enrolled = student.enrolledCourses.some(
      (c) => (c._id || c).toString() === courseId.toString()
    );
    if (!enrolled) throw new AppError("You are not enrolled in this course.", 403);

    let submissionFileUrl = body?.submissionFileUrl || null;
    let submissionFileExt = '';

    if (file) {
      const rawExt = file.originalname ? file.originalname.split('.').pop() : '';
      submissionFileExt = rawExt ? '.' + rawExt.toLowerCase() : '';

      submissionFileUrl = await new Promise((resolve, reject) => {
        const publicId = `assignment_submissions/${assignmentId}/${student._id}-${Date.now()}`;
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "raw", public_id: publicId },
          (err, result) => {
            if (err) return reject(new AppError("File upload failed.", 500));
            resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    }

    if (!submissionFileUrl) throw new AppError("A submission file is required.", 400);

    return await assignmentRepository.upsertSubmission(assignmentId, student._id, {
      submissionFileUrl,
      submissionFileExt,
      submittedAt: new Date(),
    });
  }

  /**
   * Get all submissions for an assignment (admin/lecturer).
   */
  async getSubmissions(assignmentId, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found.", 404);

    if (user.role === "LECTURER") {
      await this._assertManageAccess(assignment.course._id || assignment.course, user);
    }

    return await assignmentRepository.findSubmissions(assignmentId);
  }

  /**
   * Grade a student's submission.
   */
  async gradeSubmission(assignmentId, studentId, { marks, feedback }, user) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found.", 404);

    if (user.role === "LECTURER") {
      await this._assertManageAccess(assignment.course._id || assignment.course, user);
    }

    const updated = await assignmentRepository.gradeSubmission(assignmentId, studentId, {
      marks,
      feedback,
    });
    if (!updated) throw new AppError("Submission not found.", 404);

    return updated;
  }

  /**
   * Get all assignments for the current student (across all enrolled courses).
   */
  async getStudentAssignments(userId) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    return await assignmentRepository.findStudentAssignments(student._id);
  }

  /**
   * Get the current student's own submissions for all assignments in a course.
   */
  async getMySubmissionsForCourse(courseId, userId) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    return await assignmentRepository.findMySubmissionsForCourse(courseId, student._id);
  }

  /**
   * Delete the current student's own submission for an assignment.
   */
  async deleteMySubmission(assignmentId, userId) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found.", 404);

    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    const courseId = assignment.course._id || assignment.course;
    const enrolled = student.enrolledCourses.some(
      (c) => (c._id || c).toString() === courseId.toString()
    );
    if (!enrolled) throw new AppError("You are not enrolled in this course.", 403);

    await assignmentRepository.deleteSubmission(assignmentId, student._id);
  }
}

module.exports = new AssignmentService();
