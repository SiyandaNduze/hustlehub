// Gives every request a correlation id (also returned as X-Request-Id) and
// writes one structured access-log line per request when it finishes.
const crypto = require('crypto');
const logger = require('../utils/logger');

function requestContext(req, res, next) {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number((process.hrtime.bigint() - started) / 1000000n);
    const log = logger.forRequest(req);
    const fields = { status: res.statusCode, durationMs };
    if (res.statusCode >= 500) log.error('http.request', fields);
    else if (res.statusCode >= 400) log.warn('http.request', fields);
    // Health checks run every few seconds in Docker: keep them out of the main log.
    else if (req.path === '/api/health') log.debug('http.request', fields);
    else log.info('http.request', fields);
  });

  next();
}

module.exports = requestContext;
