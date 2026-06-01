const paymentService = require("../services/payment.service");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * @desc    Create a payment for a paid course
 * @route   POST /api/payments
 * @access  Student only
 */
const createPayment = asyncHandler(async (req, res) => {
  const { courseId, method } = req.body;

  const payment = await paymentService.createPayment(courseId, req.user._id, method);

  res.status(201).json({
    status: "success",
    message: "Payment submitted successfully. Awaiting confirmation.",
    data: { payment },
  });
});

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Admin only
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getAllPayments();

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: { payments },
  });
});

/**
 * @desc    Get current student's payments
 * @route   GET /api/payments/mine
 * @access  Student only
 */
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getStudentPayments(req.user._id);

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: { payments },
  });
});

/**
 * @desc    Confirm a payment (triggers enrollment)
 * @route   PUT /api/payments/:id/confirm
 * @access  Admin only
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.confirmPayment(req.params.id);

  res.status(200).json({
    status: "success",
    message: "Payment confirmed and student enrolled.",
    data: { payment },
  });
});

/**
 * @desc    Mark a payment as failed
 * @route   PUT /api/payments/:id/fail
 * @access  Admin only
 */
const failPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.failPayment(req.params.id);

  res.status(200).json({
    status: "success",
    message: "Payment marked as failed.",
    data: { payment },
  });
});

module.exports = {
  createPayment,
  getAllPayments,
  getMyPayments,
  confirmPayment,
  failPayment,
};
