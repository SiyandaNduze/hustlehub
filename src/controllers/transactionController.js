const env = require('../config/env');
const { transactions } = require('../models/collections');
const userStore = require('../models/userStore');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { buildIncomeSummary, taxYearOf, getTable, availableTaxYears } = require('../services/taxService');

const nameOf = (id) => {
  const u = userStore.findById(id);
  return u ? u.name : 'Unknown';
};
const enrich = (t) => ({ ...t, clientName: nameOf(t.clientId), freelancerName: nameOf(t.freelancerId) });
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

// Client: payments made. Freelancer: income records.
const myTransactions = asyncHandler(async (req, res) => {
  const mine = transactions
    .filter((t) => (req.user.role === 'client' ? t.clientId === req.user.id : t.freelancerId === req.user.id))
    .sort(newestFirst);
  res.json({ status: 'success', data: { transactions: mine.map(enrich) } });
});

// Freelancer: income dashboard data for one SA tax year (default: the current one).
// The estimate itself lives in services/taxService.js so it can be unit tested.
const getIncome = asyncHandler(async (req, res) => {
  // Default to the current SA tax year; if its table has not been added yet, use the newest table.
  const current = taxYearOf(new Date());
  const fallback = availableTaxYears().at(0).startYear;
  const requested =
    req.query.taxYear === undefined ? (getTable(current) ? current : fallback) : Number(req.query.taxYear);
  if (!Number.isInteger(requested) || !getTable(requested)) {
    return res.status(400).json({ status: 'error', message: 'Tax tables are not available for that tax year' });
  }

  const mine = transactions.filter((t) => t.freelancerId === req.user.id);
  const summary = buildIncomeSummary(mine, { startYear: requested, currency: env.currency, nameOf });
  logger.forRequest(req).info('income.viewed', { taxYear: summary.taxYear.label, bookings: summary.bookingCount });
  res.json({ status: 'success', data: summary });
});

const listAllTransactions = asyncHandler(async (req, res) => {
  res.json({ status: 'success', data: { transactions: transactions.all().sort(newestFirst).map(enrich) } });
});

module.exports = { myTransactions, getIncome, listAllTransactions };
