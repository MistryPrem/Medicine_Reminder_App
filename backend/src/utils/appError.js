import { ERROR_CODES } from '../constants/errorCodes.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = ERROR_CODES.VALIDATION_ERROR, details = null) {
    return new AppError(message, 400, errorCode, details);
  }

  static unauthorized(message = 'Authentication required', errorCode = ERROR_CODES.UNAUTHORIZED) {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message = 'You do not have permission to perform this action', errorCode = ERROR_CODES.FORBIDDEN) {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message = 'Requested resource not found', errorCode = ERROR_CODES.NOT_FOUND) {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message, errorCode = ERROR_CODES.CONFLICT) {
    return new AppError(message, 409, errorCode);
  }

  static internal(message = 'An unexpected internal error occurred') {
    return new AppError(message, 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
}
