const Notification = require("../models/Notification.model");

class NotificationRepository {
  async create(data) {
    return await Notification.create(data);
  }

  async findByRecipient(recipientId, { limit = 20, skip = 0 } = {}) {
    return await Notification.find({ recipient: recipientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async countUnread(recipientId) {
    return await Notification.countDocuments({ recipient: recipientId, isRead: false });
  }

  async markOneRead(notificationId, recipientId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: recipientId },
      { $set: { isRead: true } },
      { returnDocument: "after" }
    );
  }

  async markAllRead(recipientId) {
    return await Notification.updateMany(
      { recipient: recipientId, isRead: false },
      { $set: { isRead: true } }
    );
  }

  // Idempotency check — prevent duplicate deadline reminders
  async existsDeadlineReminder(recipientId, assignmentId, daysThreshold) {
    return await Notification.exists({
      recipient: recipientId,
      "data.assignmentId": assignmentId,
      type: "DEADLINE_APPROACHING",
      "data.daysThreshold": daysThreshold,
    });
  }
}

module.exports = NotificationRepository;
