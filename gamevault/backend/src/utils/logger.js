/**
 * Structured logging with Winston (LU6: logging & monitoring).
 * Never log passwords, tokens or full request bodies.
 */
const { createLogger, format, transports } = require('winston');
const config = require('../config/env');

const logger = createLogger({
  level: config.logLevel,
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'gamevault-api' },
  transports: [
    new transports.Console({
      silent: config.nodeEnv === 'test',
      format: config.isProduction
        ? format.json()
        : format.combine(format.colorize(), format.printf(({ level, message, timestamp, stack }) =>
          `${timestamp} ${level}: ${stack || message}`)),
    }),
  ],
});

if (config.nodeEnv !== 'test') {
  logger.add(new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5_000_000, maxFiles: 3 }));
  logger.add(new transports.File({ filename: 'logs/combined.log', maxsize: 5_000_000, maxFiles: 3 }));
}

// Stream used by morgan for HTTP access logs
logger.stream = { write: (message) => logger.info(message.trim()) };

module.exports = logger;
