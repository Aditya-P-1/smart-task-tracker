const { app } = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { env, validateRuntimeEnv } = require('./config/env');

let server;
let isShuttingDown = false;

async function closeServerIfRunning() {
  if (!server || !server.listening) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((closeError) => {
      if (closeError && closeError.code !== 'ERR_SERVER_NOT_RUNNING') {
        reject(closeError);
        return;
      }

      resolve();
    });
  });
}

async function shutdown(signal, error) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (signal) {
    console.log(`${signal} received. Shutting down gracefully.`);
  }

  if (error) {
    console.error('Shutdown triggered by runtime error', error);
  }

  try {
    await closeServerIfRunning();
    await disconnectDatabase();
    process.exit(error ? 1 : 0);
  } catch (shutdownError) {
    console.error('Graceful shutdown failed', shutdownError);
    process.exit(1);
  }
}

async function startServer() {
  try {
    validateRuntimeEnv();
    await connectDatabase();

    server = app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${env.port} is already in use. Stop the existing process or change PORT in backend/.env.`);
      }

      void shutdown(null, error);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.once('unhandledRejection', (error) => {
  void shutdown('unhandledRejection', error);
});

process.once('uncaughtException', (error) => {
  void shutdown('uncaughtException', error);
});

startServer();
