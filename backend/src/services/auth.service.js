const { env } = require('../config/env');
const { User } = require('../models/user.model');
const { AppError } = require('../utils/app-error');
const { signToken } = require('../utils/jwt');
const { comparePassword, hashPassword } = require('../utils/password');
const { createRandomToken, hashToken } = require('../utils/token');
const { getVerificationUrl, sendVerificationEmail } = require('./mail.service');

const EMAIL_VERIFICATION_WINDOW_MINUTES = env.emailVerificationTokenExpiresMinutes;
const VERIFICATION_TOKEN_LENGTH = 64;
const LOGIN_USER_SELECT =
  '_id name email passwordHash isEmailVerified lastLoginAt createdAt updatedAt';
const VERIFICATION_USER_SELECT =
  '_id name email isEmailVerified emailVerificationTokenHash emailVerificationTokenExpiresAt';

function buildAccessToken(user) {
  return signToken({
    email: user.email,
    sub: user._id.toString(),
    type: 'access',
  });
}

function buildVerificationExpiryDate() {
  return new Date(Date.now() + EMAIL_VERIFICATION_WINDOW_MINUTES * 60 * 1000);
}

function createVerificationSession() {
  const token = createRandomToken();

  return {
    expiresAt: buildVerificationExpiryDate(),
    token,
    tokenHash: hashToken(token),
  };
}

function buildVerificationResponse({
  createdNewUser,
  delivery,
  verificationExpiresAt,
}) {
  const response = {
    createdNewUser,
    emailSent: delivery.delivered,
    expiresAt: verificationExpiresAt,
  };

  if (delivery.message) {
    response.message = delivery.message;
  }

  return response;
}

async function sendVerificationForUser({ user, verificationToken }) {
  let delivery = {
    delivered: false,
    message: 'Verification email could not be sent. Configure SMTP to enable email delivery.',
    verificationUrl: getVerificationUrl(verificationToken),
  };

  try {
    delivery = await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken,
    });
  } catch (error) {
    console.warn(
      '[auth] Verification email dispatch failed unexpectedly.',
      error instanceof Error ? error.message : error,
    );

    if (env.nodeEnv !== 'production') {
      console.info(`Verification URL:\n${delivery.verificationUrl}`);
    }
  }

  if (env.nodeEnv === 'production' && !delivery.delivered) {
    throw new AppError('Email delivery is unavailable. Please try again later.', 503);
  }

  if (!delivery.delivered && env.nodeEnv !== 'production') {
    console.info(
      '[auth] Signup completed without SMTP delivery. Use the verification URL logged above to verify the account locally.',
    );
  }

  return delivery;
}

async function signup({ email, name, password }) {
  const existingUser = await User.findOne({ email }).select(
    '_id name email isEmailVerified passwordHash emailVerificationTokenHash emailVerificationTokenExpiresAt',
  );

  if (existingUser?.isEmailVerified) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await hashPassword(password);
  const verificationSession = createVerificationSession();
  const createdNewUser = !existingUser;

  let user = existingUser;

  if (!user) {
    user = await User.create({
      email,
      emailVerificationTokenExpiresAt: verificationSession.expiresAt,
      emailVerificationTokenHash: verificationSession.tokenHash,
      name,
      passwordHash,
    });
  } else {
    user.name = name;
    user.passwordHash = passwordHash;
    user.emailVerificationTokenExpiresAt = verificationSession.expiresAt;
    user.emailVerificationTokenHash = verificationSession.tokenHash;
    await user.save();
  }

  let delivery;

  try {
    delivery = await sendVerificationForUser({
      user,
      verificationToken: verificationSession.token,
    });
  } catch (error) {
    if (createdNewUser) {
      await User.findByIdAndDelete(user._id);
    }

    throw error;
  }

  return {
    createdNewUser,
    user: user.toSafeObject(),
    verification: buildVerificationResponse({
      createdNewUser,
      delivery,
      verificationExpiresAt: verificationSession.expiresAt,
    }),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select(LOGIN_USER_SELECT);

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError('Please verify your email address before logging in.', 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: buildAccessToken(user),
    user: user.toSafeObject(),
  };
}

async function verifyEmail(token) {
  if (
    typeof token !== 'string' ||
    token.length !== VERIFICATION_TOKEN_LENGTH ||
    !/^[a-f0-9]+$/i.test(token)
  ) {
    throw new AppError('Email verification link is invalid or has expired.', 400);
  }

  const tokenHash = hashToken(token);

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
  }).select(VERIFICATION_USER_SELECT);

  if (!user) {
    throw new AppError('Email verification link is invalid or has expired.', 400);
  }

  if (user.isEmailVerified) {
    return {
      alreadyVerified: true,
      user: user.toSafeObject(),
    };
  }

  if (
    !user.emailVerificationTokenExpiresAt ||
    user.emailVerificationTokenExpiresAt.getTime() <= Date.now()
  ) {
    throw new AppError('Email verification link is invalid or has expired.', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenExpiresAt = undefined;
  user.emailVerificationTokenHash = undefined;
  await user.save();

  return {
    alreadyVerified: false,
    user: user.toSafeObject(),
  };
}

module.exports = {
  login,
  signup,
  verifyEmail,
};
