const dotenv = require('dotenv');

dotenv.config();

const PLACEHOLDER_JWT_SECRET = 'replace-with-a-secure-secret';
const DEFAULT_CLIENT_URLS = ['http://localhost:8081', 'http://localhost:19006'];

function parsePositiveInteger(name, value, fallbackValue) {
  const parsedValue = Number(value || fallbackValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsedValue;
}

function parseClientUrls(value) {
  const rawValue = value || DEFAULT_CLIENT_URLS.join(',');

  return rawValue
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

function isValidMongoUri(value) {
  return /^mongodb(\+srv)?:\/\//.test(value);
}

const port = parsePositiveInteger('PORT', process.env.PORT, 5000);

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function normalizeAppUrl(value) {
  return value.endsWith('://') ? value : trimTrailingSlash(value);
}

const env = Object.freeze({
  appUrl: normalizeAppUrl(process.env.APP_URL || 'smarttaskhabittracker://'),
  clientUrls: parseClientUrls(process.env.CLIENT_URL),
  emailVerificationTokenExpiresMinutes: parsePositiveInteger(
    'EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES',
    process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES,
    60,
  ),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtSecret: process.env.JWT_SECRET || PLACEHOLDER_JWT_SECRET,
  mongoUri:
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-task-habit-tracker',
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  serverUrl: trimTrailingSlash(process.env.SERVER_URL || `http://localhost:${port}`),
  smtp: {
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    host: process.env.SMTP_HOST || 'smtp.example.com',
    pass: process.env.SMTP_PASS || 'example-password',
    port: parsePositiveInteger('SMTP_PORT', process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || 'example-user',
  },
});

function validateRuntimeEnv() {
  if (!isValidMongoUri(env.mongoUri)) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string.');
  }

  if (env.nodeEnv === 'production' && env.jwtSecret === PLACEHOLDER_JWT_SECRET) {
    throw new Error('JWT_SECRET must be replaced before starting the server in production.');
  }
}

module.exports = {
  env,
  validateRuntimeEnv,
};
