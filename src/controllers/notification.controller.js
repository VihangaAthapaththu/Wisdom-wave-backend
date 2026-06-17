const notificationService = require("../services/notification.service");
const asyncHandler = require("../middlewares/asyncHandler");

const getNotifications = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await notificationService.getNotifications(req.user._id, { limit, page });
  res.status(200).json({ status: "success", data: result });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user._id);
  res.status(200).json({ status: "success", data: result });
});

const markOneRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markOneRead(req.params.id, req.user._id);
  res.status(200).json({ status: "success", data: { notification } });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user._id);
  res.status(200).json({ status: "success", ...result });
});

module.exports = { getNotifications, getUnreadCount, markOneRead, markAllRead };
