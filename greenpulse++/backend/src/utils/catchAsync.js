/**
 * Wraps async functions to catch any rejected promises and forward to Express next()
 * @param {Function} fn - Async express route handler or middleware
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
