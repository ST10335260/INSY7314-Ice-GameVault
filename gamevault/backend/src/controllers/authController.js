const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { matchedData } = require('express-validator');
const config = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 4);

const cookieOptions = () => ({
  httpOnly: true, // JavaScript cannot read the token -> mitigates token theft via XSS
  secure: config.cookieSecure, // only sent over HTTPS when enabled
  sameSite: 'strict', // not sent on cross-site requests -> mitigates CSRF
  path: '/',
  maxAge: config.jwtExpiresSeconds * 1000,
});

const signToken = (user) => jwt.sign(
  { sub: user._id.toString(), role: user.role },
  config.jwtSecret,
  { expiresIn: config.jwtExpiresSeconds, algorithm: 'HS256' },
);

const publicUser = (u) => ({
  id: u._id, username: u.username, email: u.email, role: u.role, createdAt: u.createdAt,
});

const sendAuth = (res, status, user) => {
  res.cookie('token', signToken(user), cookieOptions());
  res.status(status).json({ success: true, user: publicUser(user) });
};

exports.publicUser = publicUser;

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  // matchedData returns ONLY validated fields, so a client can't sneak in { role: 'admin' }
  const { username, email, password } = matchedData(req, { locations: ['body'] });

  const exists = await User.findOne({ $or: [{ email }, { username }] }).lean();
  if (exists) throw new AppError('That username or email is already registered', 409);

  const user = await User.create({ username, email, password });
  logger.info(`User registered: ${user._id}`);
  sendAuth(res, 201, user);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = matchedData(req, { locations: ['body'] });
  const user = await User.findOne({ email }).select('+password');

  const valid = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

  if (!valid) {
    logger.warn(`Failed login attempt from ${req.ip}`);
    throw new AppError('Invalid email or password', 401); // generic: don't reveal which part was wrong
  }

  logger.info(`User logged in: ${user._id}`);
  sendAuth(res, 200, user);
});

// POST /api/auth/logout
exports.logout = (_req, res) => {
  const { maxAge: _ignored, ...opts } = cookieOptions();
  res.clearCookie('token', opts);
  res.json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me
exports.me = (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
};
