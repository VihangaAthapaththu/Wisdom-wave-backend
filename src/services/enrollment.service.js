const Student = require("../models/Student.model");
const Course = require("../models/Course.model");
const AppError = require("../utils/AppError");
const StudentRepository = require("../repositories/student.repository");

const studentRepository = new StudentRepository();

class EnrollmentService {
  /**
   * Enroll a student in a course.
   * Free courses are enrolled immediately.
   * Paid courses require a confirmed payment (handled by PaymentService.confirmPayment).
   * @param {string} courseId
   * @param {string} userId  - the logged-in user's _id
   * @returns {Promise<Object>} updated student
   */
  async enrollStudent(courseId, userId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);
    if (!course.isPublished) throw new AppError("This course is not available for enrollment.", 403);

    const student = await studentRepository.findOrCreateByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    // Check already enrolled
    const alreadyEnrolled = student.enrolledCourses.some(
      (id) => id.toString() === courseId.toString()
    );
    if (alreadyEnrolled) throw new AppError("Already enrolled in this course.", 409);

    // Block paid courses — payment must be confirmed via PaymentService
    if (course.fee > 0) {
      throw new AppError(
        "This is a paid course. Please complete payment before enrolling.",
        402
      );
    }

    await Student.findByIdAndUpdate(student._id, {
      $addToSet: { enrolledCourses: courseId },
    });

    return await studentRepository.findById(student._id);
  }

  /**
   * Unenroll a student from a course.
   * @param {string} courseId
   * @param {string} userId
   * @returns {Promise<Object>} updated student
   */
  async unenrollStudent(courseId, userId) {
    const student = await studentRepository.findOrCreateByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    await Student.findByIdAndUpdate(student._id, {
      $pull: { enrolledCourses: courseId },
    });

    return await studentRepository.findById(student._id);
  }

  /**
   * Get all enrolled students for a specific course (admin/lecturer view).
   * @param {string} courseId
   * @returns {Promise<Array>}
   */
  async getCourseEnrollments(courseId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);

    const students = await Student.find({ enrolledCourses: courseId }).populate(
      "user",
      "name email isActive createdAt"
    );

    return students;
  }

  /**
   * Get all enrolled courses for the current student.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getStudentEnrollments(userId) {
    const student = await studentRepository.findOrCreateByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    return student.enrolledCourses || [];
  }

  /**
   * Internal: enroll a student after payment confirmation. Skips fee check.
   * @param {string} courseId
   * @param {string} studentId  - Student._id (not user _id)
   */
  async enrollAfterPayment(courseId, studentId) {
    await Student.findByIdAndUpdate(studentId, {
      $addToSet: { enrolledCourses: courseId },
    });
  }

  /**
   * Admin direct-enroll: add any student to a course without payment.
   * @param {string} courseId
   * @param {string} studentId  - Student._id
   */
  async adminEnrollStudent(courseId, studentId) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);

    const student = await studentRepository.findById(studentId);
    if (!student) throw new AppError("Student not found.", 404);

    const alreadyEnrolled = student.enrolledCourses.some(
      (id) => id.toString() === courseId.toString()
    );
    if (alreadyEnrolled) throw new AppError("Student is already enrolled in this course.", 409);

    await Student.findByIdAndUpdate(studentId, {
      $addToSet: { enrolledCourses: courseId },
    });
  }
}

module.exports = new EnrollmentService();
