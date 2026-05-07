const { AppError } = require('../utils/app-error');

function validateRequest(validator) {
  return function validationMiddleware(req, _res, next) {
    const result = validator(req);

    if (!result.isValid) {
      next(new AppError('Validation failed.', 400, result.errors));
      return;
    }

    if (result.sanitizedBody) {
      req.body = result.sanitizedBody;
    }

    next();
  };
}

module.exports = { validateRequest };
