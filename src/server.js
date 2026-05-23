const express = require("express");
const dotenv = require("dotenv");
const dns = require("dns");
const cookieParser = require("cookie-parser");
const cors = require("cors");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middlewares/errorHandler");
const { seedAdmin } = require("./seeders/adminSeeder");

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Connect Database & Seed Admin
connectDB().then(() => {
  seedAdmin();
});

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server Running");
});

// Centralized Error Handler (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});