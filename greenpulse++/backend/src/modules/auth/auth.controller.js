const authService = require('./auth.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/responseEnvelope');
const env = require('../../config/env');

const isProduction = env.NODE_ENV === 'production';

// Centralized cookie options
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * Helper to attach tokens as HTTP-only cookies
 */
const setAuthCookies = (res, tokens) => {
  res.cookie('accessToken', tokens.accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
};

/**
 * Helper to clear authentication cookies
 */
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
};

/**
 * POST /api/v1/auth/signup
 */
const signup = catchAsync(async (req, res) => {
  const { user, tokens } = await authService.signup(req.body);

  // Set tokens strictly in HTTP-only cookies
  setAuthCookies(res, tokens);

  // Return safe user object, NEVER tokens in JSON
  return sendSuccess(res, 201, { user });
});

/**
 * POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { user, tokens } = await authService.login(req.body);

  // Set tokens strictly in HTTP-only cookies
  setAuthCookies(res, tokens);

  // Return safe user object, NEVER tokens in JSON
  return sendSuccess(res, 200, { user });
});

/**
 * POST /api/v1/auth/refresh
 */
const refresh = catchAsync(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;
  const { user, tokens } = await authService.refresh(oldRefreshToken);

  // Rotate cookies
  setAuthCookies(res, tokens);

  return sendSuccess(res, 200, {
    message: 'Token refreshed successfully',
    user,
  });
});

/**
 * POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  await authService.logout(userId);

  clearAuthCookies(res);

  return sendSuccess(res, 200, { message: 'Logged out successfully' });
});

/**
 * GET /api/v1/auth/me (Phase 1 verification endpoint)
 */
const getMe = catchAsync(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  return sendSuccess(res, 200, { user });
});

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getMe,
  setAuthCookies,
  clearAuthCookies,
};
