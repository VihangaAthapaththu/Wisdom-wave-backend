const express = require("express");
const router = express.Router();

const { register, login, logout, forgotPassword, resetPassword, getMe } = require("../controllers/auth.controller");
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require("../validators/auth.validator");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);

// Protected routes
router.get("/me", protect, getMe);

module.exports = router;
