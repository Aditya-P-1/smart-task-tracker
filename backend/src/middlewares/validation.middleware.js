const { AppError } = require('../utils/app-error');

function validateRequest(validator) {
  return function validationMiddleware(req, _res, next) {
    let result;

    try {
      result = validator(req);
    } catch (error) {
      next(
        new AppError(
          'Validation failed.',
          400,
          [
            {
              field: 'request',
              message: error instanceof Error ? error.message : 'The request payload could not be validated.',
            },
          ],
          'VALIDATION_FAILURE',
        ),
      );
      return;
    }

    if (!result.isValid) {
      next(new AppError('Validation failed.', 400, result.errors, 'VALIDATION_FAILURE'));
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
