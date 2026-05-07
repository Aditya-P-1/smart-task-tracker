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

    if (result.sanitizedParams) {
      req.params = result.sanitizedParams;
    }

    if (result.sanitizedQuery) {
      req.query = result.sanitizedQuery;
    }

    next();
  };
}

module.exports = { validateRequest };
