const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
} = require("../controllers/notification.controller");

// All notification endpoints require authentication (student & lecturer can have notifications)
router.use(protect);

router.get("/",               getNotifications);
router.get("/unread-count",   getUnreadCount);
router.patch("/read-all",     markAllRead);
router.patch("/:id/read",     markOneRead);

module.exports = router;
