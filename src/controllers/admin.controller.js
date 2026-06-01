const asyncHandler = require("../middlewares/asyncHandler");
const Student = require("../models/Student.model");
const Course = require("../models/Course.model");
const Lecturer = require("../models/Lecturer.model");
const Payment = require("../models/Payment.model");
const PAYMENT_STATUS = require("../enums/paymentStatus");

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/stats
 * @access  Admin only
 */
const getStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalLecturers,
    publishedCourses,
    enrollmentAgg,
    revenueAgg,
  ] = await Promise.all([
    Student.countDocuments(),
    Lecturer.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    Student.aggregate([
      { $project: { count: { $size: "$enrolledCourses" } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalStudents,
      totalLecturers,
      publishedCourses,
      totalEnrollments: enrollmentAgg[0]?.total ?? 0,
      totalRevenue: revenueAgg[0]?.total ?? 0,
    },
  });
});

module.exports = { getStats };
