const { body } = require("express-validator");
const { validate } = require("./validate");
const PAYMENT_METHODS = require("../enums/paymentMethods");

const validateCreatePayment = [
  body("courseId")
    .notEmpty()
    .withMessage("courseId is required")
    .isMongoId()
    .withMessage("courseId must be a valid id"),

  body("method")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(PAYMENT_METHODS.values)
    .withMessage(`Payment method must be one of: ${PAYMENT_METHODS.values.join(", ")}`),

  validate,
];

module.exports = { validateCreatePayment };
