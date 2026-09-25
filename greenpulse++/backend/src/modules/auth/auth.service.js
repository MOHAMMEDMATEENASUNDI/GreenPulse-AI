const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user.model');
const Company = require('../companies/company.model');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');
const { logAuditEvent } = require('../audit/auditLogger');

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * SHA-256 hash for full-length token storage (avoids bcrypt 72-byte truncation on JWTs)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate Access and Refresh JWTs
 */
const generateTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    company: user.company ? user.company.toString() : null,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  // Include cryptographically unique jti so rotated tokens are always distinct
  const refreshToken = jwt.sign(
    {
      id: user._id.toString(),
      jti: crypto.randomUUID(),
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }
  );

  return { accessToken, refreshToken };
};

/**
 * Sign up a new user
 */
const signup = async ({ email, password, role = 'facility_manager', company = null }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409, 'USER_ALREADY_EXISTS');
  }

  // Hash password with bcrypt cost factor 12
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Link or create Company document if user has no company assigned
  let assignedCompanyId = company;
  if (!assignedCompanyId) {
    const domain = email.split('@')[1] || 'organization.com';
    const companyName = domain.split('.')[0].toUpperCase() + ' Corp';
    const newCompany = await Company.create({
      name: companyName,
      industry: 'General',
      brsrStatus: 'voluntary',
    });
    assignedCompanyId = newCompany._id;
  }

  // Create user
  const user = new User({
    email,
    passwordHash,
    role,
    company: assignedCompanyId,
  });

  // Generate tokens
  const tokens = generateTokens(user);

  // Store SHA-256 hash of refresh token for rotation & revocation
  user.refreshToken = hashToken(tokens.refreshToken);
  await user.save();

  // Return safe user object (passwordHash & refreshToken excluded by toJSON)
  return {
    user: user.toJSON(),
    tokens,
  };
};

/**
 * Log in an existing user
 */
const login = async ({ email, password }) => {
  // Find user and explicitly select passwordHash
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const tokens = generateTokens(user);

  // Store SHA-256 hash of refresh token for rotation
  user.refreshToken = hashToken(tokens.refreshToken);
  await user.save();

  await logAuditEvent({
    companyId: user.company,
    actorId: user._id,
    action: 'user.login',
  });

  return {
    user: user.toJSON(),
    tokens,
  };
};

/**
 * Refresh access token using refresh token (with rotation & reuse detection)
 */
const refresh = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw new AppError('Refresh token is required', 401, 'UNAUTHORIZED');
  }

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Find user and verify stored refresh token hash (rotation check)
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || !user.refreshToken) {
    throw new AppError('Invalid refresh token session', 401, 'UNAUTHORIZED');
  }

  const incomingHash = hashToken(oldRefreshToken);
  if (incomingHash !== user.refreshToken) {
    // Token reuse detected or invalidated - revoke all sessions for security
    user.refreshToken = null;
    await user.save();
    throw new AppError('Refresh token reuse detected. Please log in again.', 401, 'TOKEN_REUSE_DETECTED');
  }

  // Rotate tokens: generate new pair
  const tokens = generateTokens(user);
  user.refreshToken = hashToken(tokens.refreshToken);
  await user.save();

  return {
    user: user.toJSON(),
    tokens,
  };
};

/**
 * Log out user: revoke refresh token
 */
const logout = async (userId) => {
  if (userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
};

/**
 * Get safe user profile by ID
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return user.toJSON();
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getUserById,
};
