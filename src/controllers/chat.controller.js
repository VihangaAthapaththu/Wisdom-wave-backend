const chatService = require("../services/chat.service");
const asyncHandler = require("../middlewares/asyncHandler");

const getContacts = asyncHandler(async (req, res) => {
  const contacts = await chatService.getContacts(req.user._id, req.user.role);
  res.status(200).json({ status: "success", data: { contacts } });
});

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.user._id, req.user.role);
  res.status(200).json({ status: "success", data: { conversations } });
});

const startConversation = asyncHandler(async (req, res) => {
  const { lecturerId, studentId, courseId } = req.body;
  const conversation = await chatService.getOrCreateConversation(
    req.user._id,
    req.user.role,
    { lecturerId, studentId, courseId }
  );
  res.status(200).json({ status: "success", data: { conversation } });
});

const getMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const result = await chatService.getMessages(req.params.id, req.user._id, req.user.role, page);
  res.status(200).json({ status: "success", data: result });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ status: "fail", message: "Message content is required." });
  }
  const message = await chatService.sendMessage(
    req.params.id, req.user._id, req.user.role, content.trim()
  );
  res.status(201).json({ status: "success", data: { message } });
});

const markRead = asyncHandler(async (req, res) => {
  const result = await chatService.markRead(req.params.id, req.user._id, req.user.role);
  res.status(200).json({ status: "success", ...result });
});

module.exports = { getContacts, getConversations, startConversation, getMessages, sendMessage, markRead };
