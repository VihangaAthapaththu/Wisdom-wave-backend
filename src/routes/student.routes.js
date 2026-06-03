const express = require("express");
const router = express.Router();

const {
  registerStudent,
  getAllStudents,
  getMyProfile,
  getMyKpis,
  updateMyProfile,
  deactivateStudent,
} = require("../controllers/student.controller");
const { getMyAssignments } = require("../controllers/assignment.controller");
const { protect, authorize } = require("../middlewares/authMiddleware");
const enrollmentService = require("../services/enrollment.service");
const asyncHandler = require("../middlewares/asyncHandler");

router.use(protect);

// Admin-facing
router.post("/", authorize("ADMIN"), registerStudent);
router.get("/", authorize("ADMIN"), getAllStudents);
router.delete("/:id", authorize("ADMIN"), deactivateStudent);

// Student profile — all /me/* routes must come before /:id
router.get("/me", authorize("STUDENT"), getMyProfile);
router.put("/me", authorize("STUDENT"), updateMyProfile);
router.get("/me/kpis", authorize("STUDENT"), getMyKpis);

// Student's enrolled courses
router.get(
  "/me/enrollments",
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const courses = await enrollmentService.getStudentEnrollments(req.user._id);
    res.status(200).json({ status: "success", results: courses.length, data: { courses } });
  })
);

// Student's assignments (across all enrolled courses)
router.get("/me/assignments", authorize("STUDENT"), getMyAssignments);

module.exports = router;
