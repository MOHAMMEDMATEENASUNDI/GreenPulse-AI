const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Pino structured logger configured with security redacting
 */
const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
      'credentials',
      'FIREBASE_PRIVATE_KEY',
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: !isProduction
    ? {
        target: 'pino/file', // lightweight transport, avoids extra thread/spawn overhead
      }
    : undefined,
});

module.exports = logger;
