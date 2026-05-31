const courseService = require("../services/course.service");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Admin or Lecturer
 */
const createCourse = asyncHandler(async (req, res) => {
  const course = await courseService.createCourse(req.body, req.user);

  res.status(201).json({
    status: "success",
    message: "Course created successfully",
    data: { course },
  });
});

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Authenticated
 */
const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.getAllCourses();

  res.status(200).json({
    status: "success",
    results: courses.length,
    data: { courses },
  });
});


/** * @desc    Get all published courses
 * @route   GET /api/courses/published
 * @access  Public
 */
const getAllPublishedCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.getAllPublishedCourses();
  res.status(200).json({
    status: "success",
    results: courses.length,
    data: { courses },
  });
});

/**
 * @desc    Get a single course by ID
 * @route   GET /api/courses/:id
 * @access  Authenticated
 */
const getCourseById = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseById(req.params.id);

  res.status(200).json({
    status: "success",
    data: { course },
  });
});

/**
 * @desc    Get courses for the logged-in lecturer
 * @route   GET /api/courses/me
 * @access  Lecturer
 */
const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.getCoursesForLecturerUser(req.user._id);

  res.status(200).json({
    status: "success",
    results: courses.length,
    data: { courses },
  });
});

/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id
 * @access  Admin or owning Lecturer
 */
const updateCourse = asyncHandler(async (req, res) => {
  const course = await courseService.updateCourse(req.params.id, req.body, req.user);

  res.status(200).json({
    status: "success",
    message: "Course updated successfully",
    data: { course },
  });
});

/**
 * @desc    Delete a course
 * @route   DELETE /api/courses/:id
 * @access  Admin or owning Lecturer
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await courseService.deleteCourse(req.params.id, req.user);

  res.status(200).json({
    status: "success",
    message: "Course deleted successfully",
    data: { course },
  });
});

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  getMyCourses,
  updateCourse,
  deleteCourse,
  getAllPublishedCourses,
};
