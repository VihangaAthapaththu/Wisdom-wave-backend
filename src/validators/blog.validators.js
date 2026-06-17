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
      Object.assign(new AppError("Validation failed", 400), { errors: extractedErrors })
    );
  }
  next();
};

const validateBlogCreate = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("contentHtml")
    .notEmpty()
    .withMessage("Content is required"),

  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Excerpt must be at most 500 characters"),

  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid ID"),

  validate,
];

const validateBlogUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Excerpt must be at most 500 characters"),

  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid ID"),

  validate,
];

const validateCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),

  validate,
];

const validateTemplate = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Template title is required")
    .isLength({ max: 120 })
    .withMessage("Title must be at most 120 characters"),

  body("contentHtml")
    .notEmpty()
    .withMessage("Template content is required"),

  validate,
];

module.exports = { validateBlogCreate, validateBlogUpdate, validateCategory, validateTemplate };
