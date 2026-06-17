const NotificationRepository = require("../repositories/notification.repository");
const { sendEmail } = require("./email.service");
const { emitToUser } = require("../socket/socket");

const notificationRepository = new NotificationRepository();

class NotificationService {
  async createAndEmit(recipientUserId, type, { title, message, data, emailPayload } = {}) {
    const notification = await notificationRepository.create({
      recipient: recipientUserId,
      type,
      title,
      message,
      data,
    });

    // Push real-time notification
    emitToUser(recipientUserId.toString(), "notification:new", {
      _id:       notification._id,
      type:      notification.type,
      title:     notification.title,
      message:   notification.message,
      data:      notification.data,
      isRead:    false,
      createdAt: notification.createdAt,
    });

    // Send email (non-blocking)
    if (emailPayload?.to && emailPayload?.subject && emailPayload?.html) {
      sendEmail(emailPayload).catch(() => {});
    }

    return notification;
  }

  async getNotifications(userId, { limit = 20, page = 1 } = {}) {
    const skip = (page - 1) * limit;
    const [notifications, unread] = await Promise.all([
      notificationRepository.findByRecipient(userId, { limit, skip }),
      notificationRepository.countUnread(userId),
    ]);
    return { notifications, unread, page };
  }

  async getUnreadCount(userId) {
    return { count: await notificationRepository.countUnread(userId) };
  }

  async markOneRead(notificationId, userId) {
    return await notificationRepository.markOneRead(notificationId, userId);
  }

  async markAllRead(userId) {
    await notificationRepository.markAllRead(userId);
    return { message: "All notifications marked as read." };
  }
}

module.exports = new NotificationService();
