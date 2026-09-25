const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const { isDbConnected } = require('./config/db');
const { isFirebaseReady } = require('./config/firebase');
const authRoutes = require('./modules/auth/auth.routes');
const companyRoutes = require('./modules/companies/company.routes');
const departmentRoutes = require('./modules/departments/department.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const carbonRoutes = require('./modules/carbon/carbon.routes');
const esgRoutes = require('./modules/esg/esg.routes');
const greenScoreRoutes = require('./modules/greenscore/greenscore.routes');
const energyRoutes = require('./modules/energy/energy.routes');
const recommendationRoutes = require('./modules/recommendations/recommendation.routes');
const reportRoutes = require('./modules/reports/report.routes');
const wasteRoutes = require('./modules/waste/waste.routes');
const expressMongoSanitize = require('express-mongo-sanitize');
const { requireAuth } = require('./middleware/auth.middleware');
const { globalLimiter, loginLimiter, uploadLimiter } = require('./middleware/rateLimiter.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const { sendSuccess, sendError } = require('./utils/responseEnvelope');
const AppError = require('./utils/AppError');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration with authoritative CORS_ORIGIN
const allowedOrigins = env.CORS_ORIGIN.split(',').map((s) => {
  try {
    return new URL(s.trim()).origin.toLowerCase();
  } catch {
    return s.trim().toLowerCase();
  }
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      let normalizedIncoming = origin;
      try {
        normalizedIncoming = new URL(origin).origin.toLowerCase();
      } catch {}

      if (allowedOrigins.includes(normalizedIncoming)) {
        return callback(null, origin);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// Compression
app.use(compression());

// Body & Cookie Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// NoSQL Input Sanitizer (runs on parsed req.body, req.query, req.params)
app.use(expressMongoSanitize());

// Request correlation ID tracking
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// -----------------------------------------------------------------------------
// Health & Readiness Probes
// -----------------------------------------------------------------------------

/**
 * GET /health
 * Lightweight liveness probe
 */
app.get('/health', (req, res) => {
  return sendSuccess(res, 200, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /ready
 * Comprehensive readiness probe checking database & external dependencies
 */
app.get('/ready', async (req, res) => {
  const mongoReady = isDbConnected();
  const firestoreReady = await isFirebaseReady();

  // Readiness evaluation
  const isReady = mongoReady; // MongoDB is mandatory primary store
  const services = {
    mongodb: mongoReady ? 'connected' : 'disconnected',
    firestore: firestoreReady ? 'connected' : 'uninitialized',
  };

  if (!isReady) {
    return sendError(
      res,
      503,
      'SERVICE_UNAVAILABLE',
      'One or more primary backend services are unavailable',
      [services]
    );
  }

  return sendSuccess(res, 200, {
    status: 'ready',
    services,
  });
});

// -----------------------------------------------------------------------------
// Rate Limiters
// -----------------------------------------------------------------------------
app.use('/api/v1', globalLimiter);
app.post('/api/v1/auth/login', loginLimiter);
app.post('/api/v1/upload', requireAuth, uploadLimiter);

// -----------------------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/carbon', carbonRoutes);
app.use('/api/v1/esg', esgRoutes);
app.use('/api/v1/greenscore', greenScoreRoutes);
app.use('/api/v1/energy', energyRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/waste', wasteRoutes);

// -----------------------------------------------------------------------------
// 404 Handler
// -----------------------------------------------------------------------------
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// -----------------------------------------------------------------------------
// Global Error Handler
// -----------------------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
