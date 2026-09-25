const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true },
);

// One review per user per game
reviewSchema.index({ game: 1, user: 1 }, { unique: true });

/** Recalculates a game's average rating and review count. */
reviewSchema.statics.recalculate = async function recalculate(gameId) {
  const id = new mongoose.Types.ObjectId(String(gameId));
  const [count, [sum]] = await Promise.all([
    this.countDocuments({ game: id }),
    this.aggregate([{ $match: { game: id } }, { $group: { _id: '$game', total: { $sum: '$rating' } } }]),
  ]);
  await mongoose.model('Game').findByIdAndUpdate(id, {
    averageRating: count > 0 && sum ? Math.round((sum.total / count) * 10) / 10 : 0,
    reviewCount: count,
  });
};

reviewSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Review', reviewSchema);
