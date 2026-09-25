const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../lib/logger');

let isConnected = false;

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    logger.info('Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    logger.info({ host: conn.connection.host, name: conn.connection.name }, 'MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    logger.error({ err: error.message }, 'MongoDB connection failed');
    throw error;
  }
};

/**
 * Disconnect MongoDB database
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly');
  }
};

/**
 * Check if database is ready
 */
const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  disconnectDB,
  isDbConnected,
};
