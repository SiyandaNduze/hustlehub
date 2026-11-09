const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Payload kept minimal. `ver` is the user's tokenVersion: logging out bumps it,
// which instantly invalidates every token issued earlier (server-side revocation).
// The algorithm is pinned on both sign and verify.
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, ver: user.tokenVersion || 0 },
    env.jwtSecret,
    { algorithm: 'HS256', expiresIn: env.jwtExpiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
