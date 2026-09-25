const mongoose = require('mongoose');
const { GENRES, PLATFORMS } = require('../config/constants');

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    genre: { type: String, enum: GENRES, required: true },
    platforms: {
      type: [{ type: String, enum: PLATFORMS }],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'At least one platform is required' },
    },
    releaseYear: { type: Number, min: 1970, max: 2100 },
    developer: { type: String, trim: true, maxlength: 100 },
    publisher: { type: String, trim: true, maxlength: 100 },
    coverImage: { type: String, trim: true, maxlength: 500 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

gameSchema.index({ title: 1 });
gameSchema.index({ genre: 1 });

gameSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Game', gameSchema);
