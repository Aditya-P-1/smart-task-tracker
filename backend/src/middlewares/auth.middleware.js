const { User } = require('../models/user.model');
const { AppError } = require('../utils/app-error');
const { asyncHandler } = require('../utils/async-handler');
const { verifyToken } = require('../utils/jwt');

const AUTHENTICATED_USER_SELECT =
  '_id name email isEmailVerified lastLoginAt createdAt updatedAt';

const requireAuth = asyncHandler(async (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication token is required.', 401);
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token) {
    throw new AppError('Authentication token is required.', 401);
  }

  let payload;

  try {
    payload = verifyToken(token);
  } catch (_error) {
    throw new AppError('Authentication token is invalid or expired.', 401);
  }

  if (!payload || payload.type !== 'access' || typeof payload.sub !== 'string') {
    throw new AppError('Authentication token is invalid or expired.', 401);
  }

  const user = await User.findById(payload.sub).select(AUTHENTICATED_USER_SELECT);

  if (!user) {
    throw new AppError('Authenticated user was not found.', 401);
  }

  req.auth = {
    token,
    user,
    userId: user._id.toString(),
  };

  next();
});

module.exports = { requireAuth };
