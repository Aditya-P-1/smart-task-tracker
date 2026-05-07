const { sendSuccessResponse } = require('../utils/api-response');
const { asyncHandler } = require('../utils/async-handler');
const authService = require('../services/auth.service');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);

  return sendSuccessResponse(res, {
    data: result,
    message: result.createdNewUser
      ? 'Account created successfully. Please verify your email.'
      : 'Account already exists but is not verified. A new verification email has been sent.',
    statusCode: result.createdNewUser ? 201 : 200,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return sendSuccessResponse(res, {
    data: result,
    message: 'Login successful.',
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);

  return sendSuccessResponse(res, {
    data: result,
    message: result.alreadyVerified
      ? 'Email address is already verified.'
      : 'Email address verified successfully.',
  });
});

module.exports = {
  login,
  signup,
  verifyEmail,
};
