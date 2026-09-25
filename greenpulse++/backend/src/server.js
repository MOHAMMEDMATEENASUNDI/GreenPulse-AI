const http = require('http');
const env = require('./config/env');
const logger = require('./lib/logger');
const { connectDB, disconnectDB } = require('./config/db');
const app = require('./app');

let server;

const startServer = async () => {
  try {
    // Attempt database connection
    try {
      await connectDB();
      const departmentService = require('./modules/departments/department.service');
      await departmentService.backfillNormalizedNames();
    } catch (dbErr) {
      logger.warn({ err: dbErr.message }, 'Starting server without active MongoDB connection (check MONGO_URI)');
    }

    server = http.createServer(app);

    server.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          nodeEnv: env.NODE_ENV,
        },
        `GreenPulse AI Backend running on port ${env.PORT}`
      );
    });
  } catch (error) {
    logger.fatal({ err: error.message }, 'Failed to start server');
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });

    // Force close after 10s if hanging
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.fatal({ err: err?.message || err, stack: err?.stack }, 'UNHANDLED REJECTION! Shutting down...');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, 'UNCAUGHT EXCEPTION! Shutting down...');
  process.exit(1);
});

// Start if executed directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer, server };
