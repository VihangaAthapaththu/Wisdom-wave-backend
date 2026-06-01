const assignmentService = require("../services/assignment.service");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * @route   POST /api/courses/:id/assignments
 * @access  Admin | Lecturer (course owner)
 */
const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.createAssignment(
    req.params.id,
    req.body,
    req.user
  );

  res.status(201).json({
    status: "success",
    message: "Assignment created.",
    data: { assignment },
  });
});

/**
 * @route   GET /api/courses/:id/assignments
 * @access  Authenticated (enrolled student | lecturer | admin)
 */
const getAssignmentsForCourse = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getAssignmentsForCourse(
    req.params.id,
    req.user
  );

  res.status(200).json({
    status: "success",
    results: assignments.length,
    data: { assignments },
  });
});

/**
 * @route   GET /api/assignments/:id
 * @access  Authenticated
 */
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.getAssignmentById(req.params.id);

  res.status(200).json({
    status: "success",
    data: { assignment },
  });
});

/**
 * @route   PUT /api/assignments/:id
 * @access  Admin | Lecturer (course owner)
 */
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.updateAssignment(
    req.params.id,
    req.body,
    req.user
  );

  res.status(200).json({
    status: "success",
    message: "Assignment updated.",
    data: { assignment },
  });
});

/**
 * @route   DELETE /api/assignments/:id
 * @access  Admin | Lecturer (course owner)
 */
const deleteAssignment = asyncHandler(async (req, res) => {
  await assignmentService.deleteAssignment(req.params.id, req.user);

  res.status(200).json({
    status: "success",
    message: "Assignment deleted.",
  });
});

/**
 * @route   POST /api/assignments/:id/submit
 * @access  Student (enrolled)
 */
const submitAssignment = asyncHandler(async (req, res) => {
  const submission = await assignmentService.submitAssignment(
    req.params.id,
    req.user._id,
    req.body
  );

  res.status(200).json({
    status: "success",
    message: "Assignment submitted.",
    data: { submission },
  });
});

/**
 * @route   GET /api/assignments/:id/submissions
 * @access  Admin | Lecturer (course owner)
 */
const getSubmissions = asyncHandler(async (req, res) => {
  const submissions = await assignmentService.getSubmissions(req.params.id, req.user);

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: { submissions },
  });
});

/**
 * @route   PUT /api/assignments/:id/submissions/:studentId
 * @access  Admin | Lecturer (course owner)
 */
const gradeSubmission = asyncHandler(async (req, res) => {
  const submission = await assignmentService.gradeSubmission(
    req.params.id,
    req.params.studentId,
    req.body,
    req.user
  );

  res.status(200).json({
    status: "success",
    message: "Submission graded.",
    data: { submission },
  });
});

/**
 * @route   GET /api/students/me/assignments
 * @access  Student
 */
const getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getStudentAssignments(req.user._id);

  res.status(200).json({
    status: "success",
    results: assignments.length,
    data: { assignments },
  });
});

module.exports = {
  createAssignment,
  getAssignmentsForCourse,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
  getMyAssignments,
};
