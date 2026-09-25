/**
 * Authentication (who are you?) and authorisation (what may you do?) - LU3.
 */
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Requires a valid JWT. The token is read from the Authorization header
 * (Postman / API clients) or from the httpOnly "token" cookie (browser).
 */
exports.protect = asyncHandler(async (req, _res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) token = header.slice(7);
  else if (req.cookies && req.cookies.token) token = req.cookies.token;

  if (!token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    // Pin the algorithm to stop "alg: none" / algorithm-confusion attacks
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  // Re-load the user so deleted users and changed roles take effect immediately
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('User no longer exists', 401);

  req.user = user;
  next();
});

/** Role-Based Access Control: allow only the listed roles. */
exports.authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  return next();
};
