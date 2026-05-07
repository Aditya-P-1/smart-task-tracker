function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateSignupRequest(req) {
  const name = normalizeString(req.body?.name);
  const email = normalizeString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const errors = [];

  if (!name || name.length < 2 || name.length > 60) {
    errors.push({
      field: 'name',
      message: 'Name must be between 2 and 60 characters.',
    });
  }

  if (!email || !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'A valid email address is required.',
    });
  }

  if (!password || password.trim().length === 0 || password.length < 8 || password.length > 128) {
    errors.push({
      field: 'password',
      message: 'Password must be between 8 and 128 characters.',
    });
  }

  return {
    errors,
    isValid: errors.length === 0,
    sanitizedBody: {
      email,
      name,
      password,
    },
  };
}

function validateLoginRequest(req) {
  const email = normalizeString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push({
      field: 'email',
      message: 'A valid email address is required.',
    });
  }

  if (!password || password.trim().length === 0) {
    errors.push({
      field: 'password',
      message: 'Password is required.',
    });
  }

  return {
    errors,
    isValid: errors.length === 0,
    sanitizedBody: {
      email,
      password,
    },
  };
}

module.exports = {
  validateLoginRequest,
  validateSignupRequest,
};
