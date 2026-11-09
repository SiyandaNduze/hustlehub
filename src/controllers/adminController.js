const userStore = require('../models/userStore');
const { transactions } = require('../models/collections');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { verifyChain } = require('../services/ledger');

// passwordHash is stripped by toPublicUser - it never leaves the backend
const listUsers = asyncHandler(async (req, res) => {
  logger.forRequest(req).info('admin.users.listed');
  res.json({ status: 'success', data: { users: userStore.readUsers().map(userStore.toPublicUser) } });
});

// Re-computes the hash chain over every stored transaction.
const verifyLedger = asyncHandler(async (req, res) => {
  const result = verifyChain(transactions.all());
  const log = logger.forRequest(req);
  if (result.valid) log.info('admin.ledger.verified', { verified: result.verified, legacy: result.legacy });
  else log.error('ledger.tamper_detected', { brokenAt: result.brokenAt });
  res.json({ status: 'success', data: result });
});

module.exports = { listUsers, verifyLedger };
