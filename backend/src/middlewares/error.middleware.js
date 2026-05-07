const mongoose = require('mongoose');

const { env } = require('../config/env');
const { AppError } = require('../utils/app-error');

function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

function escapeHeaderValue(value) {
  return String(value).replace(/["\\]/g, '');
}

function errorHandler(error, _req, res, _next) {
  let normalizedError = error;

  if (error instanceof mongoose.Error.ValidationError) {
    normalizedError = new AppError('Database validation failed.', 400, error.errors, 'DATABASE_VALIDATION_FAILED');
  } else if (error instanceof mongoose.Error.CastError) {
    normalizedError = new AppError(
      'The provided resource identifier is invalid.',
      400,
      [
        {
          field: error.path,
          message: `A valid value is required for "${error.path}".`,
        },
      ],
      'INVALID_IDENTIFIER',
    );
  } else if (error?.code === 11000) {
    normalizedError = new AppError(
      'A record with the provided unique value already exists.',
      409,
      undefined,
      'DUPLICATE_RECORD',
    );
  }

  const statusCode = normalizedError.statusCode || 500;

  if (statusCode === 401) {
    const authCode =
      normalizedError.code === 'TOKEN_REQUIRED'
        ? 'invalid_request'
        : 'invalid_token';
    const authDescription = escapeHeaderValue(normalizedError.message || 'Authentication failed.');
    res.set('WWW-Authenticate', `Bearer error="${authCode}", error_description="${authDescription}"`);
  }

  res.status(statusCode).json({
    code: normalizedError.code,
    details: normalizedError.details,
    message: normalizedError.message || 'Internal server error',
    stack: env.nodeEnv === 'development' ? normalizedError.stack : undefined,
    success: false,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
