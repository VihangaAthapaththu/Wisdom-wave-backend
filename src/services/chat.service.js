const ConversationRepository = require("../repositories/conversation.repository");
const MessageRepository = require("../repositories/message.repository");
const StudentRepository = require("../repositories/student.repository");
const LecturerRepository = require("../repositories/lecturer.repository");
const Student = require("../models/Student.model");
const Lecturer = require("../models/Lecturer.model");
const AppError = require("../utils/AppError");
const { emitToConversation, emitToUser } = require("../socket/socket");

const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();
const studentRepository = new StudentRepository();
const lecturerRepository = new LecturerRepository();

class ChatService {
  /**
   * Returns eligible chat contacts for the requesting user.
   * Students see lecturers of their enrolled courses.
   * Lecturers see students enrolled in their courses.
   */
  async getContacts(userId, role) {
    if (role === "STUDENT") {
      const student = await studentRepository.findByUserId(userId);
      if (!student) throw new AppError("Student profile not found.", 404);

      const courseIds = (student.enrolledCourses || []).map((c) => c._id || c);
      if (!courseIds.length) return [];

      // Unique lecturers across all enrolled courses
      const lecturers = await Lecturer.find({ courses: { $in: courseIds } })
        .populate("user", "name email")
        .populate("courses", "title")
        .lean();

      return lecturers.map((l) => ({
        lecturerId: l._id,
        name:       l.user?.name,
        email:      l.user?.email,
        userId:     l.user?._id,
        courses:    (l.courses || []).filter((c) => courseIds.some((id) => id.toString() === c._id.toString())),
      }));
    }

    if (role === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(userId);
      if (!lecturer) throw new AppError("Lecturer profile not found.", 404);

      const courseIds = (lecturer.courses || []).map((c) => c._id || c);
      if (!courseIds.length) return [];

      const students = await Student.find({ enrolledCourses: { $in: courseIds } })
        .populate("user", "name email")
        .lean();

      return students.map((s) => ({
        studentId: s._id,
        name:      s.user?.name,
        email:     s.user?.email,
        userId:    s.user?._id,
      }));
    }

    return [];
  }

  /**
   * Get or create a conversation.
   * Enforces that the student is enrolled in the course taught by the lecturer.
   */
  async getOrCreateConversation(requestingUserId, requestingRole, { lecturerId, studentId, courseId }) {
    let resolvedStudentId, resolvedLecturerId;

    if (requestingRole === "STUDENT") {
      const student = await studentRepository.findByUserId(requestingUserId);
      if (!student) throw new AppError("Student profile not found.", 404);
      resolvedStudentId = student._id;

      // Verify the student is enrolled in this course
      const enrolled = (student.enrolledCourses || []).some(
        (c) => (c._id || c).toString() === courseId.toString()
      );
      if (!enrolled) throw new AppError("You are not enrolled in this course.", 403);

      // Verify the lecturer teaches this course
      const lecturer = await Lecturer.findById(lecturerId);
      if (!lecturer) throw new AppError("Lecturer not found.", 404);
      const teaches = (lecturer.courses || []).some((c) => (c._id || c).toString() === courseId.toString());
      if (!teaches) throw new AppError("This lecturer does not teach this course.", 403);

      resolvedLecturerId = lecturerId;
    } else if (requestingRole === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(requestingUserId);
      if (!lecturer) throw new AppError("Lecturer profile not found.", 404);
      resolvedLecturerId = lecturer._id;

      const teaches = (lecturer.courses || []).some((c) => (c._id || c).toString() === courseId.toString());
      if (!teaches) throw new AppError("You do not teach this course.", 403);

      // Verify the student is enrolled
      const student = await Student.findById(studentId);
      if (!student) throw new AppError("Student not found.", 404);
      const enrolled = (student.enrolledCourses || []).some(
        (c) => (c._id || c).toString() === courseId.toString()
      );
      if (!enrolled) throw new AppError("This student is not enrolled in this course.", 403);

      resolvedStudentId = studentId;
    } else {
      throw new AppError("Only students and lecturers can use chat.", 403);
    }

    const conversation = await conversationRepository.findOrCreate(
      resolvedStudentId,
      resolvedLecturerId,
      courseId
    );
    return await conversationRepository.findById(conversation._id);
  }

  async getConversations(userId, role) {
    if (role === "STUDENT") {
      const student = await studentRepository.findByUserId(userId);
      if (!student) throw new AppError("Student profile not found.", 404);
      return await conversationRepository.findByStudent(student._id);
    }
    if (role === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(userId);
      if (!lecturer) throw new AppError("Lecturer profile not found.", 404);
      return await conversationRepository.findByLecturer(lecturer._id);
    }
    return [];
  }

  async getMessages(conversationId, userId, role, page = 1) {
    await this._assertConversationAccess(conversationId, userId, role);
    return await messageRepository.findByConversation(conversationId, page);
  }

  async sendMessage(conversationId, userId, role, content) {
    const conv = await this._assertConversationAccess(conversationId, userId, role);

    const senderRole = role === "STUDENT" ? "STUDENT" : "LECTURER";
    const message = await messageRepository.create({
      conversation: conversationId,
      sender: userId,
      senderRole,
      content,
    });

    // Update conversation's lastMessage + updatedAt
    await conversationRepository.setLastMessage(conversationId, message._id);

    const payload = {
      _id:            message._id,
      conversationId: conversationId.toString(),
      sender:         message.sender,
      senderRole:     message.senderRole,
      content:        message.content,
      isRead:         message.isRead,
      createdAt:      message.createdAt,
    };

    // Deliver to BOTH participants' personal rooms. Personal rooms are always
    // joined on connection, so delivery never depends on conversation-room
    // membership (which can lag for a freshly-created conversation or after a
    // reconnect). The client deduplicates by message _id.
    const studentUserId  = conv.student?.user?._id  || conv.student?.user;
    const lecturerUserId = conv.lecturer?.user?._id || conv.lecturer?.user;
    if (studentUserId)  emitToUser(studentUserId,  "message:new", payload);
    if (lecturerUserId) emitToUser(lecturerUserId, "message:new", payload);

    return message;
  }

  async markRead(conversationId, userId, role) {
    await this._assertConversationAccess(conversationId, userId, role);
    await messageRepository.markReadByConversation(conversationId, role);

    // Emit read receipt to conversation room
    emitToConversation(conversationId, "message:read", { conversationId, readerRole: role });
    return { message: "Messages marked as read." };
  }

  async _assertConversationAccess(conversationId, userId, role) {
    const conv = await conversationRepository.findById(conversationId);
    if (!conv) throw new AppError("Conversation not found.", 404);

    if (role === "STUDENT") {
      const student = await studentRepository.findByUserId(userId);
      if (!student || conv.student._id.toString() !== student._id.toString()) {
        throw new AppError("Access denied.", 403);
      }
    } else if (role === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(userId);
      if (!lecturer || conv.lecturer._id.toString() !== lecturer._id.toString()) {
        throw new AppError("Access denied.", 403);
      }
    }
    return conv;
  }
}

module.exports = new ChatService();
