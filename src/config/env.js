// Single place that reads process.env. Fails fast if a critical value is missing.
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('Missing required environment variable: JWT_SECRET');
  process.exit(1);
}

const num = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';

module.exports = {
  port: num(process.env.PORT, 5443),
  nodeEnv,
  isTest,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Number of reverse proxies in front of the API (nginx in Docker = 1). Needed so
  // rate limiting and logs see the real client IP instead of the proxy's IP.
  trustProxy: num(process.env.TRUST_PROXY, 0),

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  sslKeyPath: process.env.SSL_KEY_PATH || './certs/key.pem',
  sslCertPath: process.env.SSL_CERT_PATH || './certs/cert.pem',

  // Rate limiting
  authRateLimitWindowMs: num(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  authRateLimitMax: num(process.env.AUTH_RATE_LIMIT_MAX, 50),
  bookingRateLimitWindowMs: num(process.env.BOOKING_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  bookingRateLimitMax: num(process.env.BOOKING_RATE_LIMIT_MAX, 10),
  apiRateLimitWindowMs: num(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  apiRateLimitMax: num(process.env.API_RATE_LIMIT_MAX, 300),

  // Per-account login lockout (security feature)
  lockoutMaxFailures: num(process.env.LOCKOUT_MAX_FAILURES, 5),
  lockoutMinutes: num(process.env.LOCKOUT_MINUTES, 15),

  currency: process.env.CURRENCY || 'ZAR',

  // Storage + logging
  dataDir: process.env.DATA_DIR || '',
  logLevel: process.env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
  logDir: process.env.LOG_DIR || './logs',
  logToFile: bool(process.env.LOG_TO_FILE, !isTest),
  logHttpUrl: process.env.LOG_HTTP_URL || '',
  logHttpToken: process.env.LOG_HTTP_TOKEN || '',
  serviceName: process.env.SERVICE_NAME || 'hustlehub-api',
};
