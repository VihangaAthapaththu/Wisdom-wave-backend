const express = require("express");
const router = express.Router();

const {
  createCourse,
  getAllCourses,
  getCourseById,
  getMyCourses,
  updateCourse,
  deleteCourse,
} = require("../controllers/course.controller");

const { validateCourseCreate, validateCourseUpdate } = require("../validators/course.validator");
const { protect, authorize } = require("../middlewares/authMiddleware");

// All course routes require authentication
router.use(protect);

// Any authenticated user can list or view courses
router.get("/", getAllCourses);

// Lecturer-specific: get my courses (declare before param routes)
router.get("/me", authorize("LECTURER"), getMyCourses);

// View single course
router.get("/:id", getCourseById);

// Create: Admin only. Update/delete still allow admin or owning lecturer.
router.post("/", authorize("ADMIN"), validateCourseCreate, createCourse);
router.put("/:id", authorize("ADMIN", "LECTURER"), validateCourseUpdate, updateCourse);
router.delete("/:id", authorize("ADMIN", "LECTURER"), deleteCourse);

module.exports = router;
