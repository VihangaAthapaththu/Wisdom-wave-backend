const progressService = require("../services/progress.service");
const asyncHandler = require("../middlewares/asyncHandler");

const getOverview = asyncHandler(async (req, res) => {
  const progress = await progressService.getProgressOverview(req.user._id);
  res.status(200).json({ status: "success", data: { progress } });
});

const getCourseProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getCourseProgress(req.params.courseId, req.user._id);
  res.status(200).json({ status: "success", data: { progress } });
});

const markComplete = asyncHandler(async (req, res) => {
  const result = await progressService.markMaterialComplete(
    req.params.courseId,
    req.params.materialId,
    req.user._id
  );
  res.status(200).json({ status: "success", ...result });
});

const unmarkComplete = asyncHandler(async (req, res) => {
  const result = await progressService.unmarkMaterialComplete(
    req.params.courseId,
    req.params.materialId,
    req.user._id
  );
  res.status(200).json({ status: "success", ...result });
});

module.exports = { getOverview, getCourseProgress, markComplete, unmarkComplete };
