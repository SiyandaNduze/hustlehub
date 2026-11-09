const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const env = require('./config/env');
const requestContext = require('./middleware/requestContext');
const sanitizeRequest = require('./middleware/sanitizeRequest');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const gigRoutes = require('./routes/gigRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const isProd = env.nodeEnv === 'production';

app.disable('x-powered-by');
// Behind nginx (Docker) the client IP arrives in X-Forwarded-For. Trusting exactly
// N proxies keeps rate limiting and logs accurate without letting clients spoof it.
if (env.trustProxy > 0) app.set('trust proxy', env.trustProxy);

app.use(requestContext); // request id + access log

// --- Security headers + Content Security Policy ------------------------------
// The React build is served from this same origin, so the CSP can be strict:
// only our own scripts/styles, no inline code, no framing, no plugins.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    // HSTS only in production so it can't "stick" to localhost during development
    hsts: isProd,
  })
);

// Only the configured front-end origin(s) may call the API from a browser
app.use(cors({ origin: env.clientOrigins }));

app.use(express.json({ limit: '10kb' }));
app.use(sanitizeRequest);

// --- API ----------------------------------------------------------------------
app.get('/api/health', (req, res) =>
  res.status(200).json({ status: 'success', message: 'HustleHub API is running' })
);

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', protectedRoutes);
app.use('/api', notFoundHandler); // unknown /api/* paths -> JSON 404

// --- Serve the built React app (client/dist) over the same HTTPS origin --------
const distDir = path.join(__dirname, '..', 'client', 'dist');
// eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed project path
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
