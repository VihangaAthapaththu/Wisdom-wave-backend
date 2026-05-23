const authService = require("../services/auth.service");
const asyncHandler = require("../middlewares/asyncHandler");

// Cookie options for JWT token
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await authService.register({ name, email, password });
  const token = authService.generateToken(user._id);

  res.cookie("token", token, getCookieOptions());

  res.status(201).json({
    status: "success",
    message: "Account created successfully",
    data: { user },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.login(email, password);

  res.cookie("token", token, getCookieOptions());

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    data: { user },
  });
});

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

module.exports = { register, login, logout, getMe };
