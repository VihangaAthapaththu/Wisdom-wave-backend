const express = require("express");
const router = express.Router();

const { register, login, logout, getMe } = require("../controllers/auth.controller");
const { validateRegister, validateLogin } = require("../validators/auth.validator");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", logout);

// Protected routes
router.get("/me", protect, getMe);

module.exports = router;
