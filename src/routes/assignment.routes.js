const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
  deleteMySubmission,
} = require("../controllers/assignment.controller");

const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get("/:id", getAssignmentById);
router.put("/:id", authorize("ADMIN", "LECTURER"), updateAssignment);
router.delete("/:id", authorize("ADMIN", "LECTURER"), deleteAssignment);
router.post("/:id/submit", authorize("STUDENT"), upload.single("file"), submitAssignment);
router.delete("/:id/submit", authorize("STUDENT"), deleteMySubmission);
router.get("/:id/submissions", authorize("ADMIN", "LECTURER"), getSubmissions);
router.put("/:id/submissions/:studentId", authorize("ADMIN", "LECTURER"), gradeSubmission);

module.exports = router;
