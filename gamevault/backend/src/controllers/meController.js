/** Endpoints for the logged-in user's own data: profile, collection, wishlist, reviews. */
const Game = require('../models/Game');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { publicUser } = require('./authController');

const ensureGame = async (id) => {
  const game = await Game.exists({ _id: id });
  if (!game) throw new AppError('Game not found', 404);
};

// GET /api/me
exports.getProfile = asyncHandler(async (req, res) => {
  const reviewCount = await Review.countDocuments({ user: req.user._id });
  res.json({
    success: true,
    user: publicUser(req.user),
    stats: { collection: req.user.library.length, wishlist: req.user.wishlist.length, reviews: reviewCount },
    library: req.user.library.map((i) => ({ game: i.game, status: i.status })),
    wishlist: req.user.wishlist,
  });
});

// GET /api/me/reviews
exports.getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).populate('game', 'title').sort('-createdAt').lean();
  res.json({ success: true, data: reviews.filter((r) => r.game) });
});

// GET /api/me/collection
exports.getCollection = asyncHandler(async (req, res) => {
  await req.user.populate('library.game');
  const items = req.user.library.filter((i) => i.game); // skip games that were deleted
  res.json({ success: true, data: items });
});

// POST /api/me/collection { gameId, status }
exports.addToCollection = asyncHandler(async (req, res) => {
  const { gameId, status = 'backlog' } = req.body;
  await ensureGame(gameId);
  if (req.user.library.some((i) => i.game.equals(gameId))) {
    throw new AppError('This game is already in your collection', 409);
  }
  req.user.library.push({ game: gameId, status });
  req.user.wishlist.pull(gameId); // owning it means it's no longer a wish
  await req.user.save();
  res.status(201).json({ success: true, message: 'Added to collection' });
});

// PATCH /api/me/collection/:gameId { status }
exports.updateCollectionItem = asyncHandler(async (req, res) => {
  const item = req.user.library.find((i) => i.game.equals(req.params.gameId));
  if (!item) throw new AppError('This game is not in your collection', 404);
  item.status = req.body.status;
  await req.user.save();
  res.json({ success: true, message: 'Status updated' });
});

// DELETE /api/me/collection/:gameId
exports.removeFromCollection = asyncHandler(async (req, res) => {
  const before = req.user.library.length;
  req.user.library = req.user.library.filter((i) => !i.game.equals(req.params.gameId));
  if (req.user.library.length === before) throw new AppError('This game is not in your collection', 404);
  await req.user.save();
  res.json({ success: true, message: 'Removed from collection' });
});

// GET /api/me/wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
  await req.user.populate('wishlist');
  res.json({ success: true, data: req.user.wishlist.filter(Boolean) });
});

// POST /api/me/wishlist/:gameId
exports.addToWishlist = asyncHandler(async (req, res) => {
  await ensureGame(req.params.gameId);
  if (req.user.library.some((i) => i.game.equals(req.params.gameId))) {
    throw new AppError('You already own this game', 409);
  }
  req.user.wishlist.addToSet(req.params.gameId);
  await req.user.save();
  res.json({ success: true, message: 'Added to wishlist' });
});

// DELETE /api/me/wishlist/:gameId
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  req.user.wishlist.pull(req.params.gameId);
  await req.user.save();
  res.json({ success: true, message: 'Removed from wishlist' });
});
