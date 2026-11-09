const env = require('../config/env');
const logger = require('../utils/logger');

function notFoundHandler(req, res) {
  res.status(404).json({ status: 'error', message: 'Resource not found' });
}

// Final error handler. Clients only ever see short generic messages (plus the
// request id so support can find the log entry); the full error with stack is
// logged server-side only. Known body-parser failures are mapped explicitly so
// their raw parser messages never reach the client.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let message = 'Something went wrong. Please try again later.';

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  }

  if (status === 500) {
    logger.forRequest(req).error('error.unhandled', { err });
  } else {
    logger.forRequest(req).warn('request.rejected', { status, reason: err.type });
  }

  const body = { status: 'error', message };
  if (status === 500) body.requestId = req.id;
  if (env.nodeEnv === 'development' && status === 500) body.hint = 'See server logs for details.';
  return res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
