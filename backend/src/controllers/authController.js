import * as authService from '../services/authService.js';
import { successResponse } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return successResponse(res, 'User registered successfully', result, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.authenticateUser(email, password);
    return successResponse(res, 'Login successful', result, 200);
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const result = await authService.rotateRefreshToken(token);
    return successResponse(res, 'Token refreshed successfully', result, 200);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    await authService.revokeRefreshToken(token);
    return successResponse(res, 'Logged out successfully', {}, 200);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 'User profile retrieved successfully', { user: req.user }, 200);
  } catch (err) {
    next(err);
  }
};
