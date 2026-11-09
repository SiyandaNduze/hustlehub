// South African individual income tax tables, by tax-year START year.
// A tax year runs 1 March -> end of February.
// Source: SARS "Rates of tax for individuals" (2025/26) and the Budget 2026
// SARS tax guide (2026/27, brackets/rebates raised 3.4% for inflation).
// `upTo` is the top of each bracket in rand; the last bracket is open-ended.
// Base amounts (e.g. R44,118 / R666,339) are NOT hard-coded: they are derived
// from the rates and covered by unit tests against SARS's published figures.
// MAINTENANCE: add a new entry after each February Budget (tables change every tax year).
const TAX_TABLES = {
  2025: {
    label: '2025/26',
    primaryRebate: 17235,
    brackets: [
      { upTo: 237100, rate: 18 },
      { upTo: 370500, rate: 26 },
      { upTo: 512800, rate: 31 },
      { upTo: 673000, rate: 36 },
      { upTo: 857900, rate: 39 },
      { upTo: 1817000, rate: 41 },
      { upTo: null, rate: 45 },
    ],
  },
  2026: {
    label: '2026/27',
    primaryRebate: 17820,
    brackets: [
      { upTo: 245100, rate: 18 },
      { upTo: 383100, rate: 26 },
      { upTo: 530200, rate: 31 },
      { upTo: 695800, rate: 36 },
      { upTo: 887000, rate: 39 },
      { upTo: 1878600, rate: 41 },
      { upTo: null, rate: 45 },
    ],
  },
};

module.exports = { TAX_TABLES };
