const express = require("express");
const router = express.Router();

const {
  createCourse,
  getAllCourses,
  getAllPublishedCourses,
  getCourseById,
  getMyCourses,
  updateCourse,
  deleteCourse,
} = require("../controllers/course.controller");

const { validateCourseCreate, validateCourseUpdate } = require("../validators/course.validator");
const { protect, authorize } = require("../middlewares/authMiddleware");

const enrollmentService = require("../services/enrollment.service");
const asyncHandler = require("../middlewares/asyncHandler");
const { createAssignment, getAssignmentsForCourse, getMySubmissionsForCourse } = require("../controllers/assignment.controller");
const { getMaterials, addMaterial, deleteMaterial } = require("../controllers/material.controller");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ── Public routes (no auth required) ─────────────────────────────────────────
router.get("/", getAllPublishedCourses);

// ── Specific named routes MUST come before /:id ─────────────────────────────
router.get("/all", protect, authorize("ADMIN"), getAllCourses);
router.get("/me", protect, authorize("LECTURER"), getMyCourses);

// ── Single course (public) ──────────────────────────────────────────────────
router.get("/:id", getCourseById);

router.post("/", protect, authorize("ADMIN"), validateCourseCreate, createCourse);
router.put("/:id", protect, authorize("ADMIN", "LECTURER"), validateCourseUpdate, updateCourse);
router.delete("/:id", protect, authorize("ADMIN", "LECTURER"), deleteCourse);

// ── Enrollment sub-routes ─────────────────────────────────────────────────────
router.post(
  "/:id/enroll",
  protect,
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const student = await enrollmentService.enrollStudent(req.params.id, req.user._id);
    res.status(200).json({ status: "success", message: "Enrolled successfully.", data: { student } });
  })
);

router.delete(
  "/:id/unenroll",
  protect,
  authorize("STUDENT"),
  asyncHandler(async (req, res) => {
    const student = await enrollmentService.unenrollStudent(req.params.id, req.user._id);
    res.status(200).json({ status: "success", message: "Unenrolled successfully.", data: { student } });
  })
);

router.get(
  "/:id/enrollments",
  protect,
  authorize("ADMIN", "LECTURER"),
  asyncHandler(async (req, res) => {
    const students = await enrollmentService.getCourseEnrollments(req.params.id);
    res.status(200).json({ status: "success", results: students.length, data: { students } });
  })
);

// Admin direct-enroll: enroll any student without payment
router.post(
  "/:id/admin-enroll",
  protect,
  authorize("ADMIN"),
  asyncHandler(async (req, res) => {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ status: "fail", message: "studentId is required." });
    await enrollmentService.adminEnrollStudent(req.params.id, studentId);
    res.status(200).json({ status: "success", message: "Student enrolled successfully." });
  })
);

// ── Assignment sub-routes ─────────────────────────────────────────────────────
router.post("/:id/assignments", protect, authorize("ADMIN", "LECTURER"), createAssignment);
router.get("/:id/assignments", protect, getAssignmentsForCourse);
router.get("/:id/my-submissions", protect, authorize("STUDENT"), getMySubmissionsForCourse);

// ── Material sub-routes ───────────────────────────────────────────────────────
router.get("/:id/materials", protect, getMaterials);
router.post("/:id/materials", protect, authorize("ADMIN", "LECTURER"), upload.single('file'), addMaterial);
router.delete("/:id/materials/:materialId", protect, authorize("ADMIN", "LECTURER"), deleteMaterial);

module.exports = router;
