// Tax estimation + income summary (pure functions: no I/O, fully unit tested).
//
// Method (documented in the README and shown in the UI):
//  1. Gross income  = sum of the freelancer's completed transactions in the tax year.
//  2. Taxable income = gross income (no expenses or deductions are modelled).
//  3. Normal tax    = progressive SARS brackets applied slice by slice.
//  4. Tax payable   = normal tax - primary rebate, never below zero.
//  5. Effective rate = tax / income; marginal rate = rate of the top bracket reached.
// All money is handled in integer cents to avoid floating-point errors.
const { TAX_TABLES } = require('../config/taxTables');

const TABLES = new Map(Object.entries(TAX_TABLES).map(([year, table]) => [Number(year), table]));

const MONTH_LABELS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000; // South Africa is UTC+2 with no daylight saving

const toCents = (rand) => Math.round(Number(rand) * 100);
const toRand = (cents) => cents / 100;
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 10000) / 100 : 0);

function getTable(startYear) {
  return TABLES.get(Number(startYear)) || null;
}

function availableTaxYears() {
  return [...TABLES.keys()]
    .sort((a, b) => b - a)
    .map((startYear) => ({ startYear, label: getTable(startYear).label }));
}

// Date parts in South African time
function saParts(isoOrDate) {
  const d = new Date(new Date(isoOrDate).getTime() + SAST_OFFSET_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }; // month 1-12
}

// Start year of the SA tax year that contains the date (Mar-Dec -> same year; Jan-Feb -> previous)
function taxYearOf(isoOrDate) {
  const { year, month } = saParts(isoOrDate);
  return month >= 3 ? year : year - 1;
}

function taxYearRange(startYear) {
  const nextYear = startYear + 1;
  const lastDayOfFeb = new Date(Date.UTC(nextYear, 2, 0)).getUTCDate(); // 28 or 29
  return {
    startYear,
    label: `${startYear}/${String(nextYear).slice(2)}`,
    start: `${startYear}-03-01`,
    end: `${nextYear}-02-${lastDayOfFeb}`,
  };
}

// Brackets with from/to in cents, plus the cumulative tax at the start of each bracket.
function prepareBrackets(table) {
  let lowerCents = 0;
  let cumulative = 0;
  return table.brackets.map((b) => {
    const upperCents = b.upTo === null ? null : b.upTo * 100;
    const prepared = { fromCents: lowerCents, upperCents, rate: b.rate, baseTaxCents: cumulative };
    if (upperCents !== null) {
      cumulative += Math.round(((upperCents - lowerCents) * b.rate) / 100);
      lowerCents = upperCents;
    }
    return prepared;
  });
}

function calculateTax(taxableCents, startYear) {
  const table = getTable(startYear);
  if (!table) throw new RangeError(`No tax table for ${startYear}`);

  const brackets = prepareBrackets(table).map((b) => {
    const top = b.upperCents === null ? taxableCents : Math.min(taxableCents, b.upperCents);
    const amountCents = Math.max(0, top - b.fromCents);
    return {
      from: toRand(b.fromCents),
      to: b.upperCents === null ? null : toRand(b.upperCents),
      rate: b.rate,
      baseTax: toRand(b.baseTaxCents),
      amountInBracket: toRand(amountCents),
      taxInBracket: toRand(Math.round((amountCents * b.rate) / 100)),
      reached: amountCents > 0,
    };
  });

  const taxBeforeRebateCents = brackets.reduce((sum, b) => sum + toCents(b.taxInBracket), 0);
  const rebateCents = toCents(table.primaryRebate);
  const taxCents = Math.max(0, taxBeforeRebateCents - rebateCents);
  const topReached = [...brackets].reverse().find((b) => b.reached);
  const firstRate = table.brackets.length > 0 ? table.brackets[0].rate : 0;
  const thresholdCents = Math.round((rebateCents * 100) / firstRate);

  const nextBracket = (() => {
    const current = topReached || brackets[0];
    if (current.to === null) return null;
    const following = brackets.find((b) => b.from === current.to);
    return following
      ? { startsAt: following.from, rate: following.rate, remaining: toRand(toCents(following.from) - taxableCents) }
      : null;
  })();

  return {
    taxableIncome: toRand(taxableCents),
    brackets,
    taxBeforeRebate: toRand(taxBeforeRebateCents),
    rebate: table.primaryRebate,
    taxThreshold: toRand(thresholdCents),
    estimatedTax: toRand(taxCents),
    netIncome: toRand(taxableCents - taxCents),
    effectiveRatePercent: pct(taxCents, taxableCents),
    marginalRatePercent: taxCents > 0 && topReached ? topReached.rate : 0,
    nextBracket,
  };
}

const METHOD = {
  summary:
    'Estimated tax = progressive SARS income tax on your income for the tax year, minus the primary rebate.',
  steps: [
    'Add up your completed bookings for the tax year (1 March to end of February, South African time). This is your gross income.',
    'Treat that amount as taxable income. Business expenses and deductions are not modelled.',
    'Apply the SARS brackets slice by slice: each slice of income is taxed only at its own rate.',
    'Subtract the primary rebate. Tax can never be below zero, so income under the tax threshold pays nothing.',
    'Effective rate = tax / income. Marginal rate = the rate on your last rand of income.',
  ],
  assumptions: [
    'You are under 65 (only the primary rebate applies).',
    'This platform is your only source of income.',
    'No expenses, retirement contributions, medical credits or provisional tax payments are included.',
    'Tables: SARS rates of tax for individuals for the selected tax year.',
  ],
};

function buildIncomeSummary(transactions, { startYear, currency = 'ZAR', nameOf = () => 'Unknown' } = {}) {
  const range = taxYearRange(startYear);
  const inYear = transactions.filter(
    (t) => t.status === 'completed' && taxYearOf(t.createdAt) === startYear
  );

  const grossCents = inYear.reduce((sum, t) => sum + toCents(t.amount), 0);
  const tax = calculateTax(grossCents, startYear);

  // Monthly buckets in tax-year order (Mar..Feb)
  const monthCents = new Map();
  inYear.forEach((t) => {
    const { month } = saParts(t.createdAt);
    monthCents.set(month, (monthCents.get(month) || 0) + toCents(t.amount));
  });
  const monthly = MONTH_LABELS.map((label, index) => {
    const month = ((index + 2) % 12) + 1; // Mar=3 ... Dec=12, Jan=1, Feb=2
    const calendarYear = month >= 3 ? startYear : startYear + 1;
    return {
      month: `${calendarYear}-${String(month).padStart(2, '0')}`,
      label,
      income: toRand(monthCents.get(month) || 0),
    };
  });

  // Earnings per gig
  const gigMap = new Map();
  inYear.forEach((t) => {
    const key = t.gigId || t.gigTitle;
    const entry = gigMap.get(key) || { gigId: t.gigId, gigTitle: t.gigTitle, bookings: 0, cents: 0 };
    entry.bookings += 1;
    entry.cents += toCents(t.amount);
    gigMap.set(key, entry);
  });
  const byGig = [...gigMap.values()]
    .sort((a, b) => b.cents - a.cents)
    .map((g) => ({ gigId: g.gigId, gigTitle: g.gigTitle, bookings: g.bookings, income: toRand(g.cents) }));

  return {
    currency,
    taxYear: range,
    availableTaxYears: availableTaxYears(),
    totalEarned: toRand(grossCents),
    bookingCount: inYear.length,
    estimatedTax: tax.estimatedTax,
    estimatedNetIncome: tax.netIncome,
    tax,
    monthly,
    byGig,
    transactions: [...inYear]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => ({
        id: t.id,
        bookingId: t.bookingId,
        gigTitle: t.gigTitle,
        clientName: nameOf(t.clientId),
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt,
      })),
    method: METHOD,
    disclaimer: 'Illustrative estimate only based on SARS tables. This is not tax advice.',
  };
}

module.exports = {
  availableTaxYears,
  taxYearOf,
  taxYearRange,
  calculateTax,
  buildIncomeSummary,
  getTable,
  toCents,
};
