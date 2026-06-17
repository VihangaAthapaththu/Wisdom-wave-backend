const Message = require("../models/Message.model");

const PAGE_SIZE = 30;

class MessageRepository {
  async create(data) {
    const msg = await Message.create(data);
    return await msg.populate("sender", "name role");
  }

  async findByConversation(conversationId, page = 1) {
    const skip = (page - 1) * PAGE_SIZE;
    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .populate("sender", "name role"),
      Message.countDocuments({ conversation: conversationId }),
    ]);
    return { messages, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async markReadByConversation(conversationId, readerRole) {
    // Mark all messages sent by the other role as read
    const senderRole = readerRole === "STUDENT" ? "LECTURER" : "STUDENT";
    return await Message.updateMany(
      { conversation: conversationId, senderRole, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }

  async countUnreadInConversation(conversationId, readerRole) {
    const senderRole = readerRole === "STUDENT" ? "LECTURER" : "STUDENT";
    return await Message.countDocuments({ conversation: conversationId, senderRole, isRead: false });
  }
}

module.exports = MessageRepository;
