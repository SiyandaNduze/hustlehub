const CURRENCY = 'ZAR';

export const formatMoney = (amount) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: CURRENCY }).format(Number(amount) || 0);

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const shortRef = (id) => String(id || '').slice(0, 8);

// Human-friendly reference shown on receipts, e.g. BK-1A2B3C4D / TXN-9F8E7D6C
export const displayRef = (prefix, id) => `${prefix}-${shortRef(id).toUpperCase()}`;

export const formatCompact = (amount) =>
  new Intl.NumberFormat('en-ZA', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(amount) || 0);

export const formatPercent = (value) => `${Number(value || 0).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}%`;
