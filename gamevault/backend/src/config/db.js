const mongoose = require('mongoose');
const logger = require('../utils/logger');

module.exports = async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI is not set. Copy .env.example to .env and configure it.');
  mongoose.set('strictQuery', true); // unknown query fields are ignored, not passed to MongoDB
  await mongoose.connect(uri);
  logger.info(`MongoDB connected (${mongoose.connection.name})`);
};
