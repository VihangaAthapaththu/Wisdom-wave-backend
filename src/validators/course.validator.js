const { body, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

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

const validateCourseCreate = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be at most 2000 characters"),

  body("duration")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Duration must be a positive number"),

  body("fee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fee must be a positive number"),

  body("lecturer")
    .optional()
    .isMongoId()
    .withMessage("Lecturer must be a valid id"),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),

  validate,
];

const validateCourseUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be at most 2000 characters"),

  body("duration")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Duration must be a positive number"),

  body("fee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fee must be a positive number"),

  body("lecturer")
    .optional()
    .isMongoId()
    .withMessage("Lecturer must be a valid id"),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),

  validate,
];

module.exports = { validateCourseCreate, validateCourseUpdate };
