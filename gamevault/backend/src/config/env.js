/**
 * Centralised configuration. All secrets come from environment variables,
 * never from source code (LU1: environment variables).
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const toBool = (v) => String(v).toLowerCase() === 'true';
const nodeEnv = process.env.NODE_ENV || 'development';
const useHttps = toBool(process.env.USE_HTTPS);

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parseInt(process.env.PORT, 10) || 4000,
  logLevel: process.env.LOG_LEVEL || 'info',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresSeconds: parseInt(process.env.JWT_EXPIRES_IN_SECONDS, 10) || 3600,
  cookieSecure: process.env.COOKIE_SECURE
    ? toBool(process.env.COOKIE_SECURE)
    : nodeEnv === 'production' || useHttps,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  useHttps,
  sslKeyPath: path.resolve(__dirname, '../..', process.env.SSL_KEY_PATH || './certs/key.pem'),
  sslCertPath: path.resolve(__dirname, '../..', process.env.SSL_CERT_PATH || './certs/cert.pem'),
};
