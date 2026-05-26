const { body, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

/**
 * Middleware to check for validation errors from express-validator.
 * Returns 400 with structured error messages if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(
      Object.assign(
        new AppError("Validation failed", 400),
        { errors: extractedErrors }
      )
    );
  }

  next();
};

/**
 * Validation rules for lecturer registration.
 */
const validateLecturerRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Name must be between 3 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("specialization")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Specialization must be at most 100 characters"),

  validate,
];

/**
 * Validation rules for lecturer update.
 */
const validateLecturerUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Name must be between 3 and 50 characters"),

  body("specialization")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Specialization must be at most 100 characters"),

  validate,
];

module.exports = { validateLecturerRegister, validateLecturerUpdate };
