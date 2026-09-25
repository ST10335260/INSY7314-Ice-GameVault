const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, COLLECTION_STATUSES } = require('../config/constants');

// Lower cost in tests keeps them fast; 12 rounds in real use.
const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;

// NOTE: "collection" is a reserved Mongoose path name, so the personal collection is stored as "library".
const libraryItemSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    status: { type: String, enum: COLLECTION_STATUSES, default: 'backlog' },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String, required: true, unique: true, trim: true,
      minlength: 3, maxlength: 30, match: /^[a-zA-Z0-9_]+$/,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, minlength: 8, select: false }, // never returned by default
    role: { type: String, enum: ROLES, default: 'user' },
    library: [libraryItemSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  },
  { timestamps: true },
);

// Hash the password whenever it changes (bcrypt adds a unique salt per hash)
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
