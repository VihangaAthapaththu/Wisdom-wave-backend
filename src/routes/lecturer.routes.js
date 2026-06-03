const express = require("express");
const router = express.Router();

const {
  registerLecturer,
  getAllLecturers,
  getLecturerById,
  getMyProfile,
  getMyKpis,
  updateLecturer,
  deactivateLecturer,
} = require("../controllers/lecturer.controller");
const {
  validateLecturerRegister,
  validateLecturerUpdate,
} = require("../validators/lecturer.validator");
const { protect, authorize } = require("../middlewares/authMiddleware");

// All routes require authentication
router.use(protect);

// Lecturer-only: get own profile and KPIs
router.get("/me", authorize("LECTURER"), getMyProfile);
router.get("/me/kpis", authorize("LECTURER"), getMyKpis);

// Admin-only routes
router.post("/", authorize("ADMIN"), validateLecturerRegister, registerLecturer);
router.get("/", authorize("ADMIN"), getAllLecturers);
router.get("/:id", authorize("ADMIN"), getLecturerById);
router.put("/:id", authorize("ADMIN"), validateLecturerUpdate, updateLecturer);
router.delete("/:id", authorize("ADMIN"), deactivateLecturer);

module.exports = router;
