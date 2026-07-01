const { body } = require("express-validator");
const { validate } = require("./validate");

const validateAdminEnroll = [
  body("studentId")
    .notEmpty()
    .withMessage("studentId is required")
    .isMongoId()
    .withMessage("studentId must be a valid id"),

  validate,
];

module.exports = { validateAdminEnroll };
