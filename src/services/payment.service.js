const PaymentRepository = require("../repositories/payment.repository");
const StudentRepository = require("../repositories/student.repository");
const Course = require("../models/Course.model");
const AppError = require("../utils/AppError");
const PAYMENT_STATUS = require("../enums/paymentStatus");
const enrollmentService = require("./enrollment.service");

const paymentRepository = new PaymentRepository();
const studentRepository = new StudentRepository();

class PaymentService {
  /**
   * Create a PENDING payment for a paid course.
   * @param {string} courseId
   * @param {string} userId  - logged-in user _id
   * @param {string} method  - PAYMENT_METHODS enum value
   * @returns {Promise<Object>} payment record
   */
  async createPayment(courseId, userId, method) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError("Course not found.", 404);
    if (!course.isPublished) throw new AppError("This course is not available.", 403);
    if (course.fee <= 0) throw new AppError("This course is free. Use the enroll endpoint directly.", 400);

    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);

    // Check already enrolled
    const alreadyEnrolled = student.enrolledCourses.some(
      (id) => id.toString() === courseId.toString()
    );
    if (alreadyEnrolled) throw new AppError("Already enrolled in this course.", 409);

    // Check if there's already a PENDING payment for this course
    const Payment = require("../models/Payment.model");
    const existingPending = await Payment.findOne({
      student: student._id,
      course: courseId,
      status: PAYMENT_STATUS.PENDING,
    });
    if (existingPending) throw new AppError("A pending payment already exists for this course.", 409);

    const payment = await paymentRepository.create({
      student: student._id,
      course: courseId,
      amount: course.fee,
      method,
      status: PAYMENT_STATUS.PENDING,
    });

    return await paymentRepository.findById(payment._id);
  }

  /**
   * Confirm a payment (admin only). Sets status to PAID and triggers enrollment.
   * @param {string} paymentId
   * @returns {Promise<Object>} updated payment
   */
  async confirmPayment(paymentId) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw new AppError("Payment not found.", 404);
    if (payment.status === PAYMENT_STATUS.PAID) throw new AppError("Payment is already confirmed.", 400);
    if (payment.status === PAYMENT_STATUS.FAILED) throw new AppError("Cannot confirm a failed payment.", 400);

    const updated = await paymentRepository.update(paymentId, {
      status: PAYMENT_STATUS.PAID,
    });

    // Trigger enrollment
    await enrollmentService.enrollAfterPayment(
      payment.course._id || payment.course,
      payment.student._id || payment.student
    );

    return updated;
  }

  /**
   * Mark a payment as failed (admin only).
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async failPayment(paymentId) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw new AppError("Payment not found.", 404);
    if (payment.status !== PAYMENT_STATUS.PENDING) throw new AppError("Only pending payments can be marked as failed.", 400);

    return await paymentRepository.update(paymentId, { status: PAYMENT_STATUS.FAILED });
  }

  /**
   * Get all payments (admin).
   * @returns {Promise<Array>}
   */
  async getAllPayments() {
    return await paymentRepository.findAll();
  }

  /**
   * Get payments for the current student.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getStudentPayments(userId) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new AppError("Student profile not found.", 404);
    return await paymentRepository.findByStudent(student._id);
  }
}

module.exports = new PaymentService();
