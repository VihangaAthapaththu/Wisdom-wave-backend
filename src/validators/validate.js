const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

/**
 * Shared express-validator result handler. Collects field errors into the
 * standard `{ field, message }` shape used across the API and forwards a 400.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extractedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return next(
    Object.assign(new AppError("Validation failed", 400), {
      errors: extractedErrors,
    })
  );
};

module.exports = { validate };
