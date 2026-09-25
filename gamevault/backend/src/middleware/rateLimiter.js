const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const skip = () => config.nodeEnv === 'test';
const message = (text) => ({ success: false, message: text });

/** General limit for all API routes. */
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: message('Too many requests. Please try again later.'),
});

/** Strict limit on login/register to slow down brute-force & credential stuffing. */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true, // only failed attempts count
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: message('Too many failed attempts. Please try again in 15 minutes.'),
});
