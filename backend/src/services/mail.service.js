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

async function sendMailPlaceholder(_payload) {
  const mailTransporter = createMailTransporter();

  if (!mailTransporter) {
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
  isMailConfigured,
  sendMailPlaceholder,
};
