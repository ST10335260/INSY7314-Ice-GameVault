/**
 * Seeds an admin, a demo player and sample games.
 *   npm run seed        -> adds anything missing
 *   npm run seed:reset  -> wipes users, games and reviews first
 */
const mongoose = require('mongoose');
const config = require('../config/env');
const connectDB = require('../config/db');
const logger = require('../utils/logger');
const User = require('../models/User');
const Game = require('../models/Game');
const Review = require('../models/Review');
const games = require('./games.json');

async function ensureUser({ username, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(`User exists: ${email}`);
    return existing;
  }
  const user = await User.create({ username, email, password, role });
  logger.info(`Created ${role}: ${email}`);
  return user;
}

async function seed() {
  await connectDB(config.mongoUri);

  if (process.argv.includes('--reset')) {
    await Promise.all([User.deleteMany({}), Game.deleteMany({}), Review.deleteMany({})]);
    logger.warn('Database reset: users, games and reviews removed');
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) throw new Error('Set ADMIN_PASSWORD in your environment before seeding');

  const admin = await ensureUser({
    username: 'vaultkeeper',
    email: (process.env.ADMIN_EMAIL || 'admin@gamevault.local').toLowerCase(),
    password: adminPassword,
    role: 'admin',
  });

  if (!config.isProduction) {
    await ensureUser({ username: 'player_one', email: 'player@gamevault.local', password: 'Player@12345', role: 'user' });
  }

  if ((await Game.countDocuments()) === 0) {
    await Game.insertMany(games.map((g) => ({ ...g, createdBy: admin._id })));
    logger.info(`Inserted ${games.length} games`);
  } else {
    logger.info('Games already present, skipping');
  }

  await mongoose.connection.close();
  logger.info('Seeding complete');
}

seed().catch(async (err) => {
  logger.error(`Seeding failed: ${err.message}`);
  await mongoose.connection.close();
  process.exit(1);
});
