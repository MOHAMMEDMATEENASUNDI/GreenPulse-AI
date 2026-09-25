const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const isTestEnv = () => process.env.NODE_ENV === 'test';

/**
 * Standardized 429 response envelope generator
 */
const createRateLimitHandler = (message) => (req, res) => {
  return res.status(429).json({
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message,
      details: [],
    },
  });
};

/**
 * Global API Limiter: 100 requests / minute / IP
 */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: isTestEnv,
  handler: createRateLimitHandler('Too many requests. Please slow down and try again shortly.'),
});

/**
 * Login Limiter: 5 requests / minute / IP
 * Applied specifically to POST /api/v1/auth/login
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: isTestEnv,
  handler: createRateLimitHandler('Too many login attempts. Please try again after 1 minute.'),
});

/**
 * Upload Limiter: 5 requests / minute / user
 * Applied to POST /api/v1/upload (preceded by requireAuth)
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: isTestEnv,
  keyGenerator: (req) => {
    if (req.user?.id) return req.user.id;
    return ipKeyGenerator(req.ip);
  },
  handler: createRateLimitHandler('Upload rate limit exceeded. Maximum 5 uploads per minute per user.'),
});

/**
 * Copilot Limiter: 10 requests / minute / user
 * Prepared for POST /api/v1/copilot/ask (Intentionally unmounted until Phase 6B)
 */
const copilotLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user?.id) return req.user.id;
    return ipKeyGenerator(req.ip);
  },
  handler: createRateLimitHandler('Copilot rate limit exceeded. Maximum 10 requests per minute per user.'),
});

module.exports = {
  globalLimiter,
  loginLimiter,
  uploadLimiter,
  copilotLimiter,
};
