const lecturerService = require("../services/lecturer.service");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * @desc    Register a new lecturer
 * @route   POST /api/lecturers
 * @access  Admin only
 */
const registerLecturer = asyncHandler(async (req, res) => {
  const { name, email, password, specialization } = req.body;

  const lecturer = await lecturerService.registerLecturer({
    name,
    email,
    password,
    specialization,
  });

  res.status(201).json({
    status: "success",
    message: "Lecturer registered successfully",
    data: { lecturer },
  });
});

/**
 * @desc    Get all lecturers
 * @route   GET /api/lecturers
 * @access  Admin only
 */
const getAllLecturers = asyncHandler(async (req, res) => {
  const lecturers = await lecturerService.getAllLecturers();

  res.status(200).json({
    status: "success",
    results: lecturers.length,
    data: { lecturers },
  });
});

/**
 * @desc    Get a single lecturer by ID
 * @route   GET /api/lecturers/:id
 * @access  Admin, Lecturer (own profile)
 */
const getLecturerById = asyncHandler(async (req, res) => {
  const lecturer = await lecturerService.getLecturerById(req.params.id);

  res.status(200).json({
    status: "success",
    data: { lecturer },
  });
});

/**
 * @desc    Get lecturer profile for the logged-in lecturer
 * @route   GET /api/lecturers/me
 * @access  Lecturer only
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const lecturer = await lecturerService.getLecturerByUserId(req.user._id);

  res.status(200).json({
    status: "success",
    data: { lecturer },
  });
});

/**
 * @desc    Get KPI summary for the logged-in lecturer
 * @route   GET /api/lecturers/me/kpis
 * @access  Lecturer only
 */
const getMyKpis = asyncHandler(async (req, res) => {
  const kpis = await lecturerService.getMyKpis(req.user._id);

  res.status(200).json({
    status: "success",
    data: { kpis },
  });
});

/**
 * @desc    Update a lecturer
 * @route   PUT /api/lecturers/:id
 * @access  Admin only
 */
const updateLecturer = asyncHandler(async (req, res) => {
  const { name, specialization } = req.body;

  const lecturer = await lecturerService.updateLecturer(req.params.id, {
    name,
    specialization,
  });

  res.status(200).json({
    status: "success",
    message: "Lecturer updated successfully",
    data: { lecturer },
  });
});

/**
 * @desc    Deactivate a lecturer
 * @route   DELETE /api/lecturers/:id
 * @access  Admin only
 */
const deactivateLecturer = asyncHandler(async (req, res) => {
  const lecturer = await lecturerService.deactivateLecturer(req.params.id);

  res.status(200).json({
    status: "success",
    message: "Lecturer deactivated successfully",
    data: { lecturer },
  });
});

module.exports = {
  registerLecturer,
  getAllLecturers,
  getLecturerById,
  getMyProfile,
  getMyKpis,
  updateLecturer,
  deactivateLecturer,
};
