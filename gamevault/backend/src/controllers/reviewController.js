const { matchedData } = require('express-validator');
const Game = require('../models/Game');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/games/:id/reviews
exports.listForGame = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ game: req.params.id })
    .populate('user', 'username') // only expose the username, never email etc.
    .sort('-createdAt')
    .limit(100)
    .lean();
  res.json({ success: true, data: reviews });
});

// POST /api/games/:id/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const { rating, comment = '' } = matchedData(req, { locations: ['body'] });
  const game = await Game.findById(req.params.id);
  if (!game) throw new AppError('Game not found', 404);

  const existing = await Review.findOne({ game: game._id, user: req.user._id });
  if (existing) throw new AppError('You have already reviewed this game. Edit your review instead.', 409);

  const review = await Review.create({ game: game._id, user: req.user._id, rating, comment });
  await Review.recalculate(game._id);
  await review.populate('user', 'username');
  res.status(201).json({ success: true, data: review });
});

// PUT /api/reviews/:id  (owner only)
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  if (!review.user.equals(req.user._id)) throw new AppError('You can only edit your own reviews', 403);

  const data = matchedData(req, { locations: ['body'] });
  if (data.rating !== undefined) review.rating = data.rating;
  if (data.comment !== undefined) review.comment = data.comment;
  await review.save();
  await Review.recalculate(review.game);
  await review.populate('user', 'username');
  res.json({ success: true, data: review });
});

// DELETE /api/reviews/:id  (owner or admin)
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  const isOwner = review.user.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new AppError('You can only delete your own reviews', 403);

  await review.deleteOne();
  await Review.recalculate(review.game);
  res.json({ success: true, message: 'Review deleted' });
});
