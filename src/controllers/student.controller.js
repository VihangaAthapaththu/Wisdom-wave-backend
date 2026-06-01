const studentService = require("../services/student.service");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * @desc    Register a new student
 * @route   POST /api/students
 * @access  Admin only
 */
const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const student = await studentService.registerStudent({
    name,
    email,
    password,
    phone,
    address,
  });

  res.status(201).json({
    status: "success",
    message: "Student registered successfully",
    data: { student },
  });
});

/**
 * @desc    Get all students
 * @route   GET /api/students
 * @access  Admin only
 */
const getAllStudents = asyncHandler(async (req, res) => {
  const students = await studentService.getAllStudents();

  res.status(200).json({
    status: "success",
    results: students.length,
    data: { students },
  });
});

/**
 * @desc    Get the current student's profile
 * @route   GET /api/students/me
 * @access  Student only
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentByUserId(req.user._id);

  res.status(200).json({
    status: "success",
    data: { student },
  });
});

/**
 * @desc    Update the current student's profile
 * @route   PUT /api/students/me
 * @access  Student only
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentByUserId(req.user._id);
  const updated = await studentService.updateStudent(student._id, req.body);

  res.status(200).json({
    status: "success",
    message: "Student profile updated successfully",
    data: { student: updated },
  });
});

/**
 * @desc    Deactivate a student account
 * @route   DELETE /api/students/:id
 * @access  Admin only
 */
const deactivateStudent = asyncHandler(async (req, res) => {
  await studentService.deactivateStudent(req.params.id);

  res.status(200).json({
    status: "success",
    message: "Student deactivated successfully",
  });
});

module.exports = {
  registerStudent,
  getAllStudents,
  getMyProfile,
  updateMyProfile,
  deactivateStudent,
};
