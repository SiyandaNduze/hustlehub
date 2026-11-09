const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12; // cost factor: higher = slower to brute-force

async function hashPassword(plainTextPassword) {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

async function comparePassword(plainTextPassword, passwordHash) {
  return bcrypt.compare(plainTextPassword, passwordHash);
}

module.exports = { hashPassword, comparePassword };
