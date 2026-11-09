const { verifyToken } = require('../utils/jwt');
const userStore = require('../models/userStore');
const logger = require('../utils/logger');

// Authenticates the request: valid JWT, the user still exists, and the token
// has not been revoked (tokenVersion matches). The role is read from the user
// store, never trusted from the token. Every failure returns the same generic
// 401, but the real reason is logged for monitoring.
function requireAuth(req, res, next) {
  const log = logger.forRequest(req);
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    log.warn('auth.token.rejected', { reason: 'missing_token' });
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  let reason = 'invalid_or_expired';
  try {
    const decoded = verifyToken(header.split(' ')[1]);
    const user = userStore.findById(decoded.sub);
    if (!user) {
      reason = 'user_not_found';
    } else if ((decoded.ver ?? 0) !== (user.tokenVersion ?? 0)) {
      reason = 'token_revoked';
    } else {
      req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      return next();
    }
  } catch {
    // signature/expiry failure: falls through to the generic 401 below
  }
  log.warn('auth.token.rejected', { reason });
  return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
}

// RBAC guard: only the listed roles may continue.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logger.forRequest(req).warn('access.denied', {
        reason: 'role_not_allowed',
        role: req.user ? req.user.role : undefined,
        required: allowedRoles,
      });
      return res
        .status(403)
        .json({ status: 'error', message: 'You do not have permission to perform this action' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
