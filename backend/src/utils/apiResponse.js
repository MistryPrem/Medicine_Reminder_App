/**
 * Standardized success response envelope
 */
export const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standardized error response envelope
 */
export const errorResponse = (res, message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) => {
  const payload = {
    success: false,
    message,
    errorCode
  };

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};
