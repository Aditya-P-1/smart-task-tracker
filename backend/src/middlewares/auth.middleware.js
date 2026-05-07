const { User } = require('../models/user.model');
const { AppError } = require('../utils/app-error');
const { asyncHandler } = require('../utils/async-handler');
const { verifyToken } = require('../utils/jwt');

const AUTHENTICATED_USER_SELECT =
  '_id name email isEmailVerified lastLoginAt createdAt updatedAt';

const requireAuth = asyncHandler(async (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication token is required.', 401, undefined, 'TOKEN_REQUIRED');
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token) {
    throw new AppError('Authentication token is required.', 401, undefined, 'TOKEN_REQUIRED');
  }

  let payload;

  try {
    payload = verifyToken(token);
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw new AppError('Authentication token has expired.', 401, undefined, 'TOKEN_EXPIRED');
    }

    throw new AppError('Authentication token is invalid.', 401, undefined, 'TOKEN_INVALID');
  }

  if (!payload || payload.type !== 'access' || typeof payload.sub !== 'string') {
    throw new AppError('Authentication token is invalid.', 401, undefined, 'TOKEN_INVALID');
  }

  const user = await User.findById(payload.sub).select(AUTHENTICATED_USER_SELECT);

  if (!user) {
    throw new AppError('Authenticated user was not found.', 401, undefined, 'USER_NOT_FOUND');
  }

  if (!user.isEmailVerified) {
    throw new AppError('Email verification is required to continue.', 403, undefined, 'EMAIL_NOT_VERIFIED');
  }

  req.auth = {
    token,
    user,
    userId: user._id.toString(),
  };

  next();
});

module.exports = { requireAuth };
