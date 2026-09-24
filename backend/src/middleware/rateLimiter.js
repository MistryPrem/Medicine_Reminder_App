import rateLimit from 'express-rate-limit';
import { ERROR_CODES } from '../constants/errorCodes.js';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests created from this IP, please try again after 15 minutes',
    errorCode: ERROR_CODES.RATE_LIMIT_EXCEEDED
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Stricter limit for login/registration attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    errorCode: ERROR_CODES.RATE_LIMIT_EXCEEDED
  }
});
