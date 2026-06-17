const Assignment = require("../models/Assignment.model");
const StudentAssignment = require("../models/StudentAssignment.model");

class AssignmentRepository {
  async create(data) {
    return await Assignment.create(data);
  }

  async findById(id) {
    return await Assignment.findById(id).populate("course", "title lecturer");
  }

  async findByCourse(courseId) {
    return await Assignment.find({ course: courseId }).sort({ createdAt: -1 });
  }

  async update(id, data) {
    return await Assignment.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    }).populate("course", "title");
  }

  async delete(id) {
    return await Assignment.findByIdAndDelete(id);
  }

  // ── StudentAssignment (submissions) ───────────────────────────────────────

  async upsertSubmission(assignmentId, studentId, data) {
    return await StudentAssignment.findOneAndUpdate(
      { assignment: assignmentId, student: studentId },
      { $set: data },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
      .populate({ path: "assignment", select: "title dueDate course" })
      .populate({ path: "student", populate: { path: "user", select: "name email" } });
  }

  async findSubmissions(assignmentId) {
    return await StudentAssignment.find({ assignment: assignmentId })
      .populate({ path: "student", populate: { path: "user", select: "name email" } })
      .sort({ submittedAt: 1 });
  }

  async findSubmission(assignmentId, studentId) {
    return await StudentAssignment.findOne({ assignment: assignmentId, student: studentId });
  }

  async gradeSubmission(assignmentId, studentId, { marks, feedback }) {
    return await StudentAssignment.findOneAndUpdate(
      { assignment: assignmentId, student: studentId },
      { $set: { marks, feedback } },
      { returnDocument: "after" }
    ).populate({ path: "student", populate: { path: "user", select: "name email" } });
  }

  async findStudentAssignments(studentId) {
    return await StudentAssignment.find({ student: studentId })
      .populate({
        path: "assignment",
        populate: { path: "course", select: "title" },
      })
      .sort({ createdAt: -1 });
  }

  async findMySubmissionsForCourse(courseId, studentId) {
    const assignments = await Assignment.find({ course: courseId }).select("_id");
    const assignmentIds = assignments.map((a) => a._id);
    return await StudentAssignment.find({
      assignment: { $in: assignmentIds },
      student: studentId,
    });
  }

  async deleteSubmission(assignmentId, studentId) {
    return await StudentAssignment.findOneAndDelete({ assignment: assignmentId, student: studentId });
  }
}

module.exports = AssignmentRepository;
