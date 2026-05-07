const cors = require('cors');
const express = require('express');

const { env } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const apiRoutes = require('./routes');

const app = express();
const requestBodyLimit = '1mb';

app.disable('x-powered-by');

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error(`CORS blocked for origin: ${origin}`);
      error.statusCode = 403;
      callback(error);
    },
  }),
);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to the Smart Task & Habit Tracker API',
  });
});

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
