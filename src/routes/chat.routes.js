const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  getContacts,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markRead,
} = require("../controllers/chat.controller");

// Chat is available to STUDENT and LECTURER only
router.use(protect, authorize("STUDENT", "LECTURER"));

router.get("/contacts",                       getContacts);
router.get("/conversations",                  getConversations);
router.post("/conversations",                 startConversation);
router.get("/conversations/:id/messages",     getMessages);
router.post("/conversations/:id/messages",    sendMessage);
router.patch("/conversations/:id/read",       markRead);

module.exports = router;
