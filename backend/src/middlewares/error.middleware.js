const mongoose = require('mongoose');

const { env } = require('../config/env');
const { AppError } = require('../utils/app-error');

function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

function errorHandler(error, _req, res, _next) {
  let normalizedError = error;

  if (error instanceof mongoose.Error.ValidationError) {
    normalizedError = new AppError('Database validation failed.', 400, error.errors);
  } else if (error?.code === 11000) {
    normalizedError = new AppError('A record with the provided unique value already exists.', 409);
  }

  const statusCode = normalizedError.statusCode || 500;

  res.status(statusCode).json({
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
