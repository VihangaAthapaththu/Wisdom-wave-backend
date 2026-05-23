const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/user.repository");
const AppError = require("../utils/AppError");

const userRepository = new UserRepository();

/**
 * Protect routes — verifies JWT from httpOnly cookie.
 * Attaches the authenticated user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    // 1) Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return next(
        new AppError("Not authenticated. Please log in to access this resource.", 401)
      );
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await userRepository.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      return next(
        new AppError("Your account has been deactivated. Please contact support.", 403)
      );
    }

    // 5) Grant access — attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    return next(
      new AppError("Invalid or expired token. Please log in again.", 401)
    );
  }
};

/**
 * Authorize by role — restricts access to specific roles.
 * Must be used AFTER protect middleware.
 *
 * @param  {...string} roles - Allowed roles (e.g., "ADMIN", "LECTURER")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }

    next();
  };
};

module.exports = { protect, authorize };
