class AppError extends Error {
  constructor(message, statusCode, details, code) {
    super(message);

    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.isOperational = true;
    this.statusCode = statusCode;
  }
}

module.exports = { AppError };
