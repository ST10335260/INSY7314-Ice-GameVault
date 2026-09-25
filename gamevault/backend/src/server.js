const fs = require('fs');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const config = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const logger = require('./utils/logger');

async function start() {
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    logger.error('JWT_SECRET is missing or shorter than 32 characters. Set it in .env');
    process.exit(1);
  }

  await connectDB(config.mongoUri);

  let server;
  if (config.useHttps) {
    if (!fs.existsSync(config.sslKeyPath) || !fs.existsSync(config.sslCertPath)) {
      logger.error('USE_HTTPS=true but certificate files were not found. Run `npm run certs` first.');
      process.exit(1);
    }
    server = https.createServer(
      { key: fs.readFileSync(config.sslKeyPath), cert: fs.readFileSync(config.sslCertPath), minVersion: 'TLSv1.2' },
      app,
    );
  } else {
    server = http.createServer(app);
  }

  server.listen(config.port, () => {
    logger.info(`GameVault API running on ${config.useHttps ? 'https' : 'http'}://localhost:${config.port} (${config.nodeEnv})`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err);
  process.exit(1);
});

start().catch((err) => {
  logger.error(`Failed to start: ${err.message}`);
  process.exit(1);
});
