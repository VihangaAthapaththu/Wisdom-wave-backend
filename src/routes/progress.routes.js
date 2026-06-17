const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const { getOverview, getCourseProgress, markComplete, unmarkComplete } = require("../controllers/progress.controller");

router.use(protect, authorize("STUDENT"));

router.get("/overview", getOverview);
router.get("/courses/:courseId", getCourseProgress);
router.post("/courses/:courseId/materials/:materialId", markComplete);
router.delete("/courses/:courseId/materials/:materialId", unmarkComplete);

module.exports = router;
