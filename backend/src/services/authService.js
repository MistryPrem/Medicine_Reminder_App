import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { env } from '../config/env.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRATION }
  );
};

export const generateRefreshToken = async (userId) => {
  // Generate a cryptographically secure random token string
  const rawToken = crypto.randomBytes(40).toString('hex');

  // Token expires in 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Store hashed reference in database
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await RefreshToken.create({
    token: tokenHash,
    userId,
    expiresAt
  });

  return rawToken;
};

export const registerUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  if (existingUser) {
    throw AppError.conflict('An account with this email address already exists', ERROR_CODES.CONFLICT);
  }

  const user = await User.create({
    ...userData,
    email: userData.email.toLowerCase()
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id);

  return {
    user,
    accessToken,
    refreshToken
  };
};

export const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw AppError.unauthorized('Invalid email or password credentials', ERROR_CODES.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw AppError.forbidden('This user account has been deactivated. Please contact support.', ERROR_CODES.FORBIDDEN);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id);

  return {
    user,
    accessToken,
    refreshToken
  };
};

export const rotateRefreshToken = async (rawRefreshToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  const storedToken = await RefreshToken.findOne({ token: tokenHash });
  if (!storedToken) {
    throw AppError.unauthorized('Invalid or expired refresh token', ERROR_CODES.UNAUTHORIZED);
  }

  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw AppError.unauthorized('Refresh token has expired', ERROR_CODES.UNAUTHORIZED);
  }

  const user = await User.findById(storedToken.userId);
  if (!user || !user.isActive) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw AppError.unauthorized('User associated with this token is no longer active', ERROR_CODES.UNAUTHORIZED);
  }

  // Delete used refresh token (Rotation security)
  await RefreshToken.deleteOne({ _id: storedToken._id });

  // Issue new token pair
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user._id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

export const revokeRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  await RefreshToken.deleteOne({ token: tokenHash });
};
