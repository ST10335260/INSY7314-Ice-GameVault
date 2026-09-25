const { matchedData } = require('express-validator');
const Game = require('../models/Game');
const Review = require('../models/Review');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// User text is escaped before being used in a regex: prevents regex injection / ReDoS.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/games?q=&genre=&platform=&sort=&page=&limit=
exports.listGames = asyncHandler(async (req, res) => {
  const { q, genre, platform, sort = 'title' } = req.query;
  const page = req.query.page || 1;
  const limit = req.query.limit || 12;

  const filter = {};
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
  if (genre) filter.genre = genre;
  if (platform) filter.platforms = platform;

  const [games, total] = await Promise.all([
    Game.find(filter).sort(`${sort} _id`).skip((page - 1) * limit).limit(limit).lean(),
    Game.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: games,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// GET /api/games/:id
exports.getGame = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id).lean();
  if (!game) throw new AppError('Game not found', 404);
  res.json({ success: true, data: game });
});

// POST /api/games  (admin)
exports.createGame = asyncHandler(async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  const game = await Game.create({ ...data, createdBy: req.user._id });
  logger.info(`Game ${game._id} created by ${req.user._id}`);
  res.status(201).json({ success: true, data: game });
});

// PUT /api/games/:id  (admin)
exports.updateGame = asyncHandler(async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  const game = await Game.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!game) throw new AppError('Game not found', 404);
  logger.info(`Game ${game._id} updated by ${req.user._id}`);
  res.json({ success: true, data: game });
});

// DELETE /api/games/:id  (admin)
exports.deleteGame = asyncHandler(async (req, res) => {
  const game = await Game.findByIdAndDelete(req.params.id);
  if (!game) throw new AppError('Game not found', 404);

  // Clean up everything that referenced the game
  await Promise.all([
    Review.deleteMany({ game: game._id }),
    User.updateMany({}, { $pull: { library: { game: game._id }, wishlist: game._id } }),
  ]);

  logger.info(`Game ${game._id} deleted by ${req.user._id}`);
  res.json({ success: true, message: 'Game deleted' });
});
