import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { env } from '../config/env.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authentication token is missing or malformed', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw AppError.unauthorized('Authentication token has expired. Please refresh your token.', ERROR_CODES.UNAUTHORIZED);
      }
      throw AppError.unauthorized('Invalid authentication token', ERROR_CODES.UNAUTHORIZED);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw AppError.unauthorized('User associated with this token no longer exists', ERROR_CODES.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw AppError.forbidden('User account has been deactivated', ERROR_CODES.FORBIDDEN);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
