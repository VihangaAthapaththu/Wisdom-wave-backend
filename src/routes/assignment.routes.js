const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} = require("../controllers/assignment.controller");

router.use(protect);

router.get("/:id", getAssignmentById);
router.put("/:id", authorize("ADMIN", "LECTURER"), updateAssignment);
router.delete("/:id", authorize("ADMIN", "LECTURER"), deleteAssignment);
router.post("/:id/submit", authorize("STUDENT"), submitAssignment);
router.get("/:id/submissions", authorize("ADMIN", "LECTURER"), getSubmissions);
router.put("/:id/submissions/:studentId", authorize("ADMIN", "LECTURER"), gradeSubmission);

module.exports = router;
