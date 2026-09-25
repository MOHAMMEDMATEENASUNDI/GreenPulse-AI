const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * Authentication middleware: ensures valid access token is present
 */
const requireAuth = (req, res, next) => {
  // Read access token from cookie (or Authorization header as fallback)
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      company: decoded.company,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles
 */
const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required before checking permissions.', 401, 'UNAUTHORIZED'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError(
        `Forbidden: Role '${req.user.role}' does not have permission to access this resource.`,
        403,
        'FORBIDDEN'
      )
    );
  }

  return next();
};

module.exports = {
  requireAuth,
  requireRole,
};
