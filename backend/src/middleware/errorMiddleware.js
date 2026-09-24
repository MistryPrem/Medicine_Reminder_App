import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Log error with request details
  logger.error('Unhandled request error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = AppError.badRequest(`Invalid resource identifier: ${err.value}`, ERROR_CODES.VALIDATION_ERROR);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    error = AppError.conflict(`Duplicate entry detected for field: ${field}`, ERROR_CODES.CONFLICT);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    error = AppError.badRequest('Validation failed', ERROR_CODES.VALIDATION_ERROR, details);
  }

  // Standardize response payload
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'An unexpected error occurred',
    errorCode: error.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR
  };

  if (error.details) {
    response.details = error.details;
  }

  if (env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
