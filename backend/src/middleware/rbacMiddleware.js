import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('User must be authenticated before checking permissions', ERROR_CODES.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`,
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    next();
  };
};
