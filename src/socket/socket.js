const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/user.repository");
const StudentRepository = require("../repositories/student.repository");
const LecturerRepository = require("../repositories/lecturer.repository");
const ConversationRepository = require("../repositories/conversation.repository");

const userRepository = new UserRepository();
const studentRepository = new StudentRepository();
const lecturerRepository = new LecturerRepository();
const conversationRepository = new ConversationRepository();

// Resolve every conversation the user belongs to and join those rooms.
// Runs on each connection (including reconnects) so room membership is always
// authoritative server-side — never dependent on the client emitting chat:join.
async function joinUserConversations(socket) {
  try {
    let convs = [];
    if (socket.userRole === "STUDENT") {
      const student = await studentRepository.findByUserId(socket.userId);
      if (student) convs = await conversationRepository.findIdsByStudent(student._id);
    } else if (socket.userRole === "LECTURER") {
      const lecturer = await lecturerRepository.findByUserId(socket.userId);
      if (lecturer) convs = await conversationRepository.findIdsByLecturer(lecturer._id);
    }
    convs.forEach((c) => socket.join(`conv:${c._id}`));
  } catch (err) {
    // Non-fatal: the client also emits chat:join as a fallback.
    console.error("joinUserConversations failed:", err.message);
  }
}

// In-memory presence map: userId → socketId
const onlineUsers = new Map();

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Auth middleware — verify JWT on every socket connection
  io.use(async (socket, next) => {
    try {
      // Accept token from handshake auth or cookie
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers.cookie) {
        const match = socket.handshake.headers.cookie.match(/token=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) return next(new Error("Authentication required."));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error("User not found or inactive."));

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch {
      next(new Error("Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Join personal room for targeted notifications/messages
    socket.join(`user:${userId}`);

    // Authoritatively join all of this user's conversation rooms up front, so
    // real-time messages arrive even when the chat thread isn't open client-side.
    joinUserConversations(socket);

    // Track presence
    onlineUsers.set(userId, socket.id);
    io.emit("presence:update", { userId, online: true });

    // Client may still emit chat:join (e.g. for a conversation created during
    // this session) — kept as a fallback / for brand-new conversations.
    socket.on("chat:join", (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    // Typing indicators
    socket.on("chat:typing:start", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("chat:typing:start", {
        conversationId,
        userId,
        userName: socket.userName,
      });
    });

    socket.on("chat:typing:stop", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("chat:typing:stop", {
        conversationId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("presence:update", { userId, online: false });
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error("Socket.IO not initialised. Call initSocket() first.");
  return io;
}

function getOnlineUsers() {
  return onlineUsers;
}

function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

function emitToConversation(conversationId, event, data) {
  if (!io) return;
  io.to(`conv:${conversationId}`).emit(event, data);
}

module.exports = { initSocket, getIo, getOnlineUsers, emitToUser, emitToConversation };
