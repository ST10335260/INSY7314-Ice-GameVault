/** Admin-only user management. */
const User = require('../models/User');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// GET /api/users
exports.listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('username email role createdAt').sort('-createdAt').lean();
  res.json({ success: true, data: users });
});

// PATCH /api/users/:id/role { role }
exports.updateRole = asyncHandler(async (req, res) => {
  if (req.user._id.equals(req.params.id)) throw new AppError('You cannot change your own role', 400);
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  user.role = req.body.role;
  await user.save();
  logger.info(`Role of ${user._id} set to ${user.role} by ${req.user._id}`); // audit trail
  res.json({
    success: true,
    data: { _id: user._id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt },
  });
});

// DELETE /api/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.equals(req.params.id)) throw new AppError('You cannot delete your own account here', 400);
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const gameIds = await Review.distinct('game', { user: user._id });
  await Review.deleteMany({ user: user._id });
  await Promise.all(gameIds.map((g) => Review.recalculate(g)));

  logger.info(`User ${user._id} deleted by ${req.user._id}`);
  res.json({ success: true, message: 'User deleted' });
});
