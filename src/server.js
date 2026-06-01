const express = require("express");
const dotenv = require("dotenv");
const dns = require("dns");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const lecturerRoutes = require("./routes/lecturer.routes");
const studentRoutes = require("./routes/student.routes");
const courseRoutes = require("./routes/course.routes");
const paymentRoutes = require("./routes/payment.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const adminRoutes = require("./routes/admin.routes");
const errorHandler = require("./middlewares/errorHandler");
const { seedAdmin } = require("./seeders/adminSeeder");

dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Rate limiting on auth routes (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { status: "fail", message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Connect Database & Seed Admin
connectDB().then(() => {
  seedAdmin();
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Server Running");
});

// Centralized Error Handler (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});