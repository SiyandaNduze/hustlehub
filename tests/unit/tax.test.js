const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateTax, buildIncomeSummary, taxYearOf, taxYearRange, availableTaxYears, toCents,
} = require('../../src/services/taxService');

const tax = (rand, year = 2026) => calculateTax(toCents(rand), year);

test('income at or below the tax threshold pays no tax', () => {
  assert.equal(tax(0).estimatedTax, 0);
  assert.equal(tax(50000).estimatedTax, 0);
  assert.equal(tax(99000).estimatedTax, 0); // 18% x 99,000 = rebate exactly
  assert.equal(tax(99000).taxThreshold, 99000);
  assert.equal(tax(95750, 2025).estimatedTax, 0);
  assert.equal(tax(95750, 2025).taxThreshold, 95750);
});

test('first bracket: 18% minus primary rebate (2026/27)', () => {
  const r = tax(100000);
  assert.equal(r.taxBeforeRebate, 18000);
  assert.equal(r.rebate, 17820);
  assert.equal(r.estimatedTax, 180);
  assert.equal(r.netIncome, 99820);
  assert.equal(r.marginalRatePercent, 18);
});

test('derived bracket base amounts match SARS published figures (2026/27)', () => {
  const b = tax(2000000).brackets;
  assert.equal(b[1].baseTax, 44118);
  assert.equal(b[2].baseTax, 79998);
  assert.equal(b[5].baseTax, 259783);
  assert.equal(b[6].baseTax, 666339);
});

test('derived bracket base amounts match SARS published figures (2025/26)', () => {
  const b = tax(2000000, 2025).brackets;
  assert.equal(b[1].baseTax, 42678);
  assert.equal(b[2].baseTax, 77362);
  assert.equal(b[5].baseTax, 251258);
  assert.equal(b[6].baseTax, 644489);
});

test('boundary values (2026/27)', () => {
  assert.equal(tax(245100).estimatedTax, 44118 - 17820);
  assert.equal(tax(383100).estimatedTax, 79998 - 17820);
  assert.equal(tax(1878600).estimatedTax, 666339 - 17820);
});

test('mid-bracket income uses slice-by-slice calculation (2026/27)', () => {
  const r = tax(500000);
  // 79,998 + 31% x (500,000 - 383,100) = 116,237.00 ; minus rebate 17,820
  assert.equal(r.taxBeforeRebate, 116237);
  assert.equal(r.estimatedTax, 98417);
  assert.equal(r.marginalRatePercent, 31);
  assert.equal(r.effectiveRatePercent, 19.68);
});

test('mid-bracket income (2025/26)', () => {
  // 77,362 + 31% x (500,000 - 370,500) = 117,507 ; minus 17,235
  assert.equal(tax(500000, 2025).estimatedTax, 100272);
});

test('top bracket is open-ended at 45%', () => {
  const r = tax(2000000);
  assert.equal(r.marginalRatePercent, 45);
  assert.equal(r.nextBracket, null);
  assert.equal(r.estimatedTax, 666339 + 0.45 * (2000000 - 1878600) - 17820);
});

test('per-bracket breakdown adds up to the total', () => {
  const r = tax(620000);
  const sumIncome = r.brackets.reduce((s, b) => s + b.amountInBracket, 0);
  const sumTax = r.brackets.reduce((s, b) => s + b.taxInBracket, 0);
  assert.equal(Math.round(sumIncome * 100), 62000000);
  assert.equal(Math.round(sumTax * 100), Math.round(r.taxBeforeRebate * 100));
  assert.equal(r.brackets.filter((b) => b.reached).length, 4);
});

test('nextBracket tells the freelancer how far the next rate is', () => {
  const r = tax(100000);
  assert.deepEqual(r.nextBracket, { startsAt: 245100, rate: 26, remaining: 145100 });
});

test('cents arithmetic avoids floating point drift', () => {
  assert.equal(tax(0.1 + 0.2).taxableIncome, 0.3);
});

test('unknown tax year is rejected', () => {
  assert.throws(() => calculateTax(100, 1999), RangeError);
});

test('tax year boundaries use South African time (UTC+2)', () => {
  assert.equal(taxYearOf('2026-03-01T00:00:00+02:00'), 2026);
  assert.equal(taxYearOf('2026-02-28T23:30:00Z'), 2026); // already 1 March in SAST
  assert.equal(taxYearOf('2026-02-28T21:30:00Z'), 2025); // 23:30 on 28 Feb in SAST
  assert.equal(taxYearOf('2027-02-28T21:59:59Z'), 2026);
  assert.equal(taxYearOf('2027-02-28T22:00:00Z'), 2027);
  assert.equal(taxYearOf('2026-12-31T10:00:00Z'), 2026);
  assert.equal(taxYearOf('2027-01-15T10:00:00Z'), 2026);
});

test('tax year range handles leap years', () => {
  assert.deepEqual(taxYearRange(2026), { startYear: 2026, label: '2026/27', start: '2026-03-01', end: '2027-02-28' });
  assert.equal(taxYearRange(2027).end, '2028-02-29');
});

test('available tax years are listed newest first', () => {
  assert.deepEqual(availableTaxYears().map((y) => y.label), ['2026/27', '2025/26']);
});

const tx = (amount, createdAt, extra = {}) => ({
  id: `t-${createdAt}`, gigId: 'g1', gigTitle: 'Logo design', clientId: 'c1', amount, status: 'completed', createdAt, ...extra,
});

test('income summary filters by tax year/status and builds monthly + per-gig data', () => {
  const rows = [
    tx(1000, '2026-03-10T10:00:00Z'),
    tx(2000, '2026-04-15T10:00:00Z'),
    tx(500, '2026-10-20T10:00:00Z', { gigId: 'g2', gigTitle: 'Banner' }),
    tx(9999, '2026-02-10T10:00:00Z'), // previous tax year
    tx(777, '2026-05-01T10:00:00Z', { status: 'refunded' }),
  ];
  const s = buildIncomeSummary(rows, { startYear: 2026, currency: 'ZAR', nameOf: () => 'Casey' });
  assert.equal(s.totalEarned, 3500);
  assert.equal(s.bookingCount, 3);
  assert.equal(s.estimatedTax, 0);
  assert.equal(s.estimatedNetIncome, 3500);
  assert.equal(s.monthly.length, 12);
  assert.equal(s.monthly[0].month, '2026-03');
  assert.equal(s.monthly[0].income, 1000);
  assert.equal(s.monthly[1].income, 2000);
  assert.equal(s.monthly[7].income, 500);
  assert.equal(s.monthly[10].month, '2027-01');
  assert.equal(s.monthly[11].label, 'Feb');
  assert.deepEqual(s.byGig.map((g) => [g.gigTitle, g.income, g.bookings]), [['Logo design', 3000, 2], ['Banner', 500, 1]]);
  assert.equal(s.transactions.length, 3);
  assert.equal(s.transactions[0].clientName, 'Casey');
  assert.equal(s.taxYear.label, '2026/27');
});

test('income summary sums cents exactly', () => {
  const rows = [tx(10.1, '2026-06-01T10:00:00Z'), tx(20.2, '2026-06-02T10:00:00Z'), tx(550, '2026-06-03T10:00:00Z')];
  assert.equal(buildIncomeSummary(rows, { startYear: 2026 }).totalEarned, 580.3);
});

test('income summary with no data is all zeros', () => {
  const s = buildIncomeSummary([], { startYear: 2026 });
  assert.equal(s.totalEarned, 0);
  assert.equal(s.tax.effectiveRatePercent, 0);
  assert.equal(s.byGig.length, 0);
});

test('a high earner is taxed progressively and gets sensible insights', () => {
  const rows = [tx(300000, '2026-06-01T10:00:00Z')];
  const s = buildIncomeSummary(rows, { startYear: 2026 });
  assert.equal(s.tax.taxBeforeRebate, 44118 + 0.26 * (300000 - 245100));
  assert.equal(s.estimatedTax, s.tax.taxBeforeRebate - 17820);
  assert.equal(s.tax.marginalRatePercent, 26);
  assert.equal(s.tax.nextBracket.startsAt, 383100);
});
