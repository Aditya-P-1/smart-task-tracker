const nodemailer = require('nodemailer');

const { env } = require('../config/env');

let transporter;
let transporterVerificationResultPromise;

const VERIFICATION_ROUTE_PATH = '/api/v1/auth/verify-email';

function isMailConfigured() {
  const placeholderValues = new Set([
    'smtp.example.com',
    'example-user',
    'example-password',
    'no-reply@example.com',
  ]);

  return ![env.smtp.host, env.smtp.user, env.smtp.pass, env.smtp.from].some((value) =>
    placeholderValues.has(value),
  );
}

function formatMailErrorForLog(error) {
  if (!(error instanceof Error)) {
    return 'Unknown mail transport error.';
  }

  return `${error.name}: ${error.message}`;
}

function logMailFailure(context, error) {
  console.warn(`[mail] ${context} ${formatMailErrorForLog(error)}`);
}

function logDevelopmentVerificationUrl(verificationUrl) {
  if (env.nodeEnv === 'production') {
    return;
  }

  console.info(`Verification URL:\n${verificationUrl}`);
}

function createMailTransporter() {
  if (!isMailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      auth: {
        pass: env.smtp.pass,
        user: env.smtp.user,
      },
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
    });
  }

  return transporter;
}

function getVerificationUrl(token) {
  return `${env.serverUrl}${VERIFICATION_ROUTE_PATH}/${token}`;
}

async function verifyMailTransporter(mailTransporter) {
  if (transporterVerificationResultPromise) {
    return transporterVerificationResultPromise;
  }

  transporterVerificationResultPromise = mailTransporter
    .verify()
    .then(() => true)
    .catch((error) => {
      transporterVerificationResultPromise = null;
      logMailFailure('SMTP transporter verification failed.', error);
      return false;
    });

  return transporterVerificationResultPromise;
}

async function sendMail({ html, subject, text, to }) {
  const mailTransporter = createMailTransporter();

  if (!mailTransporter) {
    return {
      delivered: false,
      message: 'SMTP credentials are not configured yet.',
      reason: 'smtp_not_configured',
    };
  }

  const isTransporterVerified = await verifyMailTransporter(mailTransporter);

  if (!isTransporterVerified) {
    return {
      delivered: false,
      message: 'SMTP transporter verification failed.',
      reason: 'smtp_verification_failed',
    };
  }

  try {
    await mailTransporter.sendMail({
      from: env.smtp.from,
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    logMailFailure('Email delivery failed.', error);

    return {
      delivered: false,
      message: 'Email delivery failed.',
      reason: 'smtp_send_failed',
    };
  }

  return {
    delivered: true,
    message: 'Email sent successfully.',
  };
}

async function sendVerificationEmail({ email, name, token }) {
  const verificationUrl = getVerificationUrl(token);
  const subject = 'Verify your Smart Task & Habit Tracker account';
  const text = [
    `Hello ${name},`,
    '',
    'Please verify your email address by opening the link below:',
    verificationUrl,
    '',
    `This link will expire in ${env.emailVerificationTokenExpiresMinutes} minutes.`,
  ].join('\n');
  const html = [
    `<p>Hello ${name},</p>`,
    '<p>Please verify your email address by opening the link below:</p>',
    `<p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    `<p>This link will expire in ${env.emailVerificationTokenExpiresMinutes} minutes.</p>`,
  ].join('');

  const result = await sendMail({
    html,
    subject,
    text,
    to: email,
  });

  if (!result.delivered) {
    logDevelopmentVerificationUrl(verificationUrl);
  }

  return {
    ...result,
    verificationUrl,
  };
}

async function sendMailPlaceholder(_payload) {
  const result = await sendMail({
    html: '<p>Mail service placeholder is configured.</p>',
    subject: 'Mail Placeholder',
    text: 'Mail service placeholder is configured.',
    to: env.smtp.from,
  });

  if (!result.delivered) {
    return {
      message:
        'Mail service placeholder is present, but SMTP credentials still need to be configured.',
      ready: false,
    };
  }

  return {
    message:
      'Mail service placeholder is configured. Feature-specific mail flows can use this transporter later.',
    ready: true,
  };
}

module.exports = {
  createMailTransporter,
  getVerificationUrl,
  isMailConfigured,
  sendMail,
  sendMailPlaceholder,
  sendVerificationEmail,
};
