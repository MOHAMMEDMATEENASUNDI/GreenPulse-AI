/**
 * Standardized API Response Envelopes
 */

/**
 * Send standard success response envelope
 * @param {import('express').Response} res
 * @param {number} [statusCode=200]
 * @param {object} [data={}]
 * @param {object} [meta={}]
 */
const sendSuccess = (res, statusCode = 200, data = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data: data || {},
    meta: meta || {},
  });
};

/**
 * Send standard error response envelope
 * @param {import('express').Response} res
 * @param {number} [statusCode=500]
 * @param {string} [code='INTERNAL_SERVER_ERROR']
 * @param {string} [message='An unexpected error occurred']
 * @param {Array} [details=[]]
 */
const sendError = (
  res,
  statusCode = 500,
  code = 'INTERNAL_SERVER_ERROR',
  message = 'An unexpected error occurred',
  details = []
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: details || [],
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
