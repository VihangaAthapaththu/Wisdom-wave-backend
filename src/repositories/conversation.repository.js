const Conversation = require("../models/Conversation.model");
const Message = require("../models/Message.model");

class ConversationRepository {
  async findOrCreate(studentId, lecturerId, courseId) {
    return await Conversation.findOneAndUpdate(
      { student: studentId, lecturer: lecturerId, course: courseId },
      { $setOnInsert: { student: studentId, lecturer: lecturerId, course: courseId } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  async findById(conversationId) {
    return await Conversation.findById(conversationId)
      .populate({ path: "student", populate: { path: "user", select: "name email" } })
      .populate({ path: "lecturer", populate: { path: "user", select: "name email" } })
      .populate("course", "title");
  }

  // Lightweight id-only lookups used to auto-join socket rooms on connection.
  async findIdsByStudent(studentId) {
    return await Conversation.find({ student: studentId }).select("_id").lean();
  }

  async findIdsByLecturer(lecturerId) {
    return await Conversation.find({ lecturer: lecturerId }).select("_id").lean();
  }

  async findByStudent(studentId) {
    return await Conversation.find({ student: studentId })
      .sort({ updatedAt: -1 })
      .populate({ path: "lecturer", populate: { path: "user", select: "name email" } })
      .populate("course", "title")
      .populate("lastMessage");
  }

  async findByLecturer(lecturerId) {
    return await Conversation.find({ lecturer: lecturerId })
      .sort({ updatedAt: -1 })
      .populate({ path: "student", populate: { path: "user", select: "name email" } })
      .populate("course", "title")
      .populate("lastMessage");
  }

  async setLastMessage(conversationId, messageId) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { lastMessage: messageId, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
  }

  async countUnreadForLecturer(lecturerId) {
    const conversations = await Conversation.find({ lecturer: lecturerId }).select("_id");
    const convIds = conversations.map((c) => c._id);
    return await Message.countDocuments({
      conversation: { $in: convIds },
      senderRole: "STUDENT",
      isRead: false,
    });
  }

  async countUnreadForStudent(studentId) {
    const conversations = await Conversation.find({ student: studentId }).select("_id");
    const convIds = conversations.map((c) => c._id);
    return await Message.countDocuments({
      conversation: { $in: convIds },
      senderRole: "LECTURER",
      isRead: false,
    });
  }
}

module.exports = ConversationRepository;
