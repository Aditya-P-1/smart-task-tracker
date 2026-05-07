const mongoose = require('mongoose');

const { env } = require('./env');

mongoose.set('bufferCommands', false);

async function connectDatabase() {
  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  console.log('MongoDB connected');
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
