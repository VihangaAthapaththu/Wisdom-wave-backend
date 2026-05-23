const AppError = require("../utils/AppError");

/**
 * Handle Mongoose CastError (invalid ObjectId).
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose duplicate key error (code 11000).
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate value for '${field}'. This ${field} is already in use.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose ValidationError.
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT invalid token error.
 */
const handleJWTError = () => {
  return new AppError("Invalid token. Please log in again.", 401);
};

/**
 * Handle JWT expired token error.
 */
const handleJWTExpiredError = () => {
  return new AppError("Your token has expired. Please log in again.", 401);
};

/**
 * Centralized error handling middleware.
 * Must be registered AFTER all routes.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  // Mongoose bad ObjectId
  if (err.name === "CastError") error = handleCastError(err);

  // Mongoose duplicate key
  if (err.code === 11000) error = handleDuplicateKeyError(err);

  // Mongoose validation error
  if (err.name === "ValidationError") error = handleValidationError(err);

  // JWT errors
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";

  // Log unexpected errors in development
  if (statusCode === 500) {
    console.error("ERROR 💥:", err);
  }

  res.status(statusCode).json({
    status,
    message: error.isOperational ? error.message : "Something went wrong",
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

module.exports = errorHandler;
