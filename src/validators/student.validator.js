const { body } = require("express-validator");
const { validate } = require("./validate");

const phoneRule = body("phone")
  .optional({ checkFalsy: true })
  .matches(/^\+?[0-9\s\-]{7,20}$/)
  .withMessage("Invalid phone number");

const addressRule = body("address")
  .optional({ checkFalsy: true })
  .trim()
  .isLength({ max: 250 })
  .withMessage("Address must be at most 250 characters");

const validateRegisterStudent = [
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
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  phoneRule,
  addressRule,
  validate,
];

const validateUpdateProfile = [phoneRule, addressRule, validate];

module.exports = { validateRegisterStudent, validateUpdateProfile };
