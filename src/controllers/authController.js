const env = require('../config/env');
const userStore = require('../models/userStore');
const { hashPassword, comparePassword } = require('../utils/passwords');
const { signToken } = require('../utils/jwt');
const { ROLES } = require('../constants');
const logger = require('../utils/logger');
const { maskEmail } = logger;
const { createLoginAttemptTracker } = require('../services/loginAttempts');

const tracker = createLoginAttemptTracker({
  maxFailures: env.lockoutMaxFailures,
  windowMs: env.lockoutMinutes * 60 * 1000,
  lockMs: env.lockoutMinutes * 60 * 1000,
});

// POST /api/auth/register
// The validator only allows 'client' or 'freelancer'; admins are seeded via script.
async function register(req, res, next) {
  const log = logger.forRequest(req);
  try {
    const { name, email, password, role } = req.body;

    if (userStore.findByEmail(email)) {
      log.warn('auth.register.duplicate', { email: maskEmail(email) });
      // Generic wording: doesn't reveal which field clashed (account enumeration)
      return res.status(409).json({
        status: 'error',
        message: 'An account with these details already exists',
      });
    }

    const passwordHash = await hashPassword(password);
    const newUser = userStore.createUser({ name, email, passwordHash, role: role || ROLES.CLIENT });
    log.info('auth.register.success', { userId: newUser.id, role: newUser.role, email: maskEmail(email) });

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: { user: userStore.toPublicUser(newUser) },
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  const log = logger.forRequest(req);
  try {
    const { email, password } = req.body;
    const key = String(email).toLowerCase();

    // Locked accounts are rejected BEFORE any password check. Unknown e-mails are
    // tracked too, so the lockout response is identical for real and fake accounts.
    const lock = tracker.check(key);
    if (lock.locked) {
      log.warn('auth.login.locked', { email: maskEmail(email), retryAfterSec: lock.retryAfterSec });
      res.set('Retry-After', String(lock.retryAfterSec));
      return res.status(429).json({
        status: 'error',
        message: 'Too many failed login attempts. Please try again later.',
      });
    }

    const user = userStore.findByEmail(email);
    const valid = user ? await comparePassword(password, user.passwordHash) : false;

    if (!valid) {
      const result = tracker.recordFailure(key);
      log.warn('auth.login.failure', {
        email: maskEmail(email),
        reason: user ? 'bad_password' : 'unknown_email', // logged internally, never sent to the client
        failedAttempts: result.failures,
      });
      if (result.locked) {
        log.warn('auth.login.lockout', { email: maskEmail(email), lockMinutes: env.lockoutMinutes });
      }
      // Identical response for unknown email and wrong password
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    tracker.recordSuccess(key);
    log.info('auth.login.success', { userId: user.id, role: user.role, email: maskEmail(email) });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: { token: signToken(user), user: userStore.toPublicUser(user) },
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/logout  (requires a valid token)
// Bumps the user's tokenVersion, so this token AND every other token issued
// before now is rejected by requireAuth from this moment on.
async function logout(req, res, next) {
  try {
    const user = userStore.findById(req.user.id);
    userStore.updateUser(user.id, { tokenVersion: (user.tokenVersion || 0) + 1 });
    logger.forRequest(req).info('auth.logout', { userId: user.id });
    return res.status(200).json({
      status: 'success',
      message: 'Logged out. All existing sessions for this account are now invalid.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, logout };
