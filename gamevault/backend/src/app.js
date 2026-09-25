/**
 * Express application (exported separately from server.js so tests can import it
 * without opening a network port).
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const mongoose = require('mongoose');

const config = require('./config/env');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Behind Docker/nginx there is exactly one proxy; needed for correct client IPs in rate limiting
app.set('trust proxy', 1);

// ---- Security headers (Helmet) incl. a strict Content Security Policy ----
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

// ---- CORS: only our frontend origin(s) may call the API with credentials ----
app.use(cors({
  origin(origin, callback) {
    // Allow same-origin / non-browser clients (Postman, curl) which send no Origin header
    if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---- Body parsing with a size limit (mitigates large-payload DoS) ----
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ---- Strip keys starting with $ or containing . (NoSQL injection) ----
app.use(mongoSanitize());

// ---- HTTP access logs ----
if (config.nodeEnv !== 'test') app.use(morgan(config.isProduction ? 'combined' : 'dev', { stream: logger.stream }));

// ---- Rate limiting for everything under /api ----
app.use('/api', apiLimiter);

// ---- Health check (used by Docker & monitoring) ----
app.get('/api/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    database: dbUp ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ---- Routes ----
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
