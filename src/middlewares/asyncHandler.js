/**
 * Wraps an async function to catch errors and pass them to next().
 * Eliminates the need for try/catch blocks in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
