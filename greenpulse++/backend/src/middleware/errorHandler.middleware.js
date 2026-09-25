const { ZodError } = require('zod');
const AppError = require('../utils/AppError');
const { sendError } = require('../utils/responseEnvelope');
const logger = require('../lib/logger');

/**
 * Global error handling middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed', details);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Database validation failed', details);
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, 409, 'CONFLICT', `A record with this ${field} already exists`);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 400, 'INVALID_ID', `Invalid ${err.path}: ${err.value}`);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired');
  }

  // Handle trusted operational errors
  if (error instanceof AppError && error.isOperational) {
    return sendError(res, error.statusCode, error.code, error.message, error.details);
  }

  // Handle unexpected or programmer errors
  // Log full error details securely on the server
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      url: req.originalUrl,
      method: req.method,
      requestId: req.headers['x-request-id'],
    },
    'Unhandled server error occurred'
  );

  // Return generic error without leaking sensitive internals or stack traces
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred on the server');
};

module.exports = errorHandler;
