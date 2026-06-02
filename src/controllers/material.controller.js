const materialService = require("../services/material.service");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * @route   GET /api/courses/:id/materials
 * @access  Enrolled Student | Lecturer (course) | Admin
 */
const getMaterials = asyncHandler(async (req, res) => {
  const materials = await materialService.getMaterials(req.params.id, req.user);

  res.status(200).json({
    status: "success",
    results: materials.length,
    data: { materials },
  });
});

/**
 * @route   POST /api/courses/:id/materials
 * @access  Admin | Lecturer (course owner)
 */
const addMaterial = asyncHandler(async (req, res) => {
  const material = await materialService.addMaterial(req.params.id, req.body, req.user, req.file);

  res.status(201).json({
    status: "success",
    message: "Material added.",
    data: { material },
  });
});

/**
 * @route   DELETE /api/courses/:id/materials/:materialId
 * @access  Admin | Lecturer (course owner)
 */
const deleteMaterial = asyncHandler(async (req, res) => {
  await materialService.deleteMaterial(req.params.id, req.params.materialId, req.user);

  res.status(200).json({
    status: "success",
    message: "Material deleted.",
  });
});

module.exports = { getMaterials, addMaterial, deleteMaterial };
