const nodemailer = require('nodemailer');

const { env } = require('../config/env');

let transporter;

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
  const path = `auth/verify-email/${token}`;

  if (env.appUrl.endsWith('://')) {
    return `${env.appUrl}${path}`;
  }

  return `${env.appUrl}/${path}`;
}

async function sendMail({ html, subject, text, to }) {
  const mailTransporter = createMailTransporter();

  if (!mailTransporter) {
    return {
      delivered: false,
      message: 'SMTP credentials are not configured yet.',
    };
  }

  await mailTransporter.sendMail({
    from: env.smtp.from,
    html,
    subject,
    text,
    to,
  });

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
