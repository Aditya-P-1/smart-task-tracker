const crypto = require('crypto');

function createRandomToken(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  createRandomToken,
  hashToken,
};
