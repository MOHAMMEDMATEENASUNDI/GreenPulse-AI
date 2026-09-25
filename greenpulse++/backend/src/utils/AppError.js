/**
 * Custom application error class for operational errors.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Standardized machine-readable error code
   * @param {Array} [details=[]] - Optional additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
