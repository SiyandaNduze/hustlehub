import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ApiErrorAlert } from '../components/Alert';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import HorizontalBars from '../components/charts/HorizontalBars';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import { displayRef, formatDate, formatMoney, formatPercent } from '../utils/format';

// One plain-language sentence about where the freelancer stands against the SARS brackets
function Insight({ tax, label }) {
  if (tax.taxableIncome === 0) {
    return <p>No completed bookings in {label} yet. Your income and tax estimate will appear here after your first booking.</p>;
  }
  if (tax.estimatedTax === 0) {
    return (
      <p>
        You are below the tax threshold of <strong>{formatMoney(tax.taxThreshold)}</strong> for {label}, so no tax is
        estimated. You can earn about <strong>{formatMoney(tax.taxThreshold - tax.taxableIncome)}</strong> more before
        tax applies.
      </p>
    );
  }
  return (
    <p>
      Your marginal rate is <strong>{tax.marginalRatePercent}%</strong>: roughly {tax.marginalRatePercent}c of every
      extra rand you earn goes to tax, so set that aside from each new payment.
      {tax.nextBracket && (
        <>
          {' '}
          You are <strong>{formatMoney(tax.nextBracket.remaining)}</strong> away from the{' '}
          <strong>{tax.nextBracket.rate}%</strong> bracket.
        </>
      )}
    </p>
  );
}

export default function IncomePage() {
  const [taxYear, setTaxYear] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/income${taxYear ? `?taxYear=${taxYear}` : ''}`)
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [taxYear]);

  // Guard against an API that answers in a different shape (e.g. an out-of-date backend)
  const usable =
    data &&
    data.tax &&
    Array.isArray(data.tax.brackets) &&
    data.taxYear &&
    ['monthly', 'byGig', 'transactions', 'availableTaxYears'].every((k) => Array.isArray(data[k])) &&
    data.method &&
    Array.isArray(data.method.steps) &&
    Array.isArray(data.method.assumptions);
  if (data && !usable) {
    return (
      <section className="page">
        <header className="page-head">
          <h1>Income &amp; tax</h1>
        </header>
        <ApiErrorAlert error={{ message: 'The income data came back in an unexpected format. Make sure the API is the latest version, then refresh.' }} />
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="page">
        <header className="page-head">
          <h1>Income &amp; tax</h1>
        </header>
        <ApiErrorAlert error={error} />
      </section>
    );
  }
  if (!data) {
    return (
      <section className="page">
        <header className="page-head">
          <h1>Income &amp; tax</h1>
        </header>
        {loading && <Loading label="Loading income" />}
      </section>
    );
  }

  const { tax, taxYear: year } = data;
  const monthly = data.monthly.map((m) => ({ label: m.label, value: m.income }));

  return (
    <section className="page">
      <header className="page-head">
        <h1>Income &amp; tax</h1>
        <div className="row">
          <label htmlFor="tax-year">Tax year</label>
          <select id="tax-year" value={taxYear || String(year.startYear)} onChange={(e) => setTaxYear(e.target.value)}>
            {data.availableTaxYears.map((y) => (
              <option key={y.startYear} value={y.startYear}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
      </header>
      <p className="muted small tax-range">
        {year.label}: {formatDate(year.start)} to {formatDate(year.end)}
      </p>
      <ApiErrorAlert error={error} />

      <div className="tax-stats">
        <div className="stat-card stat-card-lead">
          <span className="stat-label">Gross income</span>
          <strong className="stat-figure">{formatMoney(data.totalEarned)}</strong>
          <span className="stat-sub">
            {data.bookingCount} {data.bookingCount === 1 ? 'booking' : 'bookings'}
          </span>
        </div>
        <div className="stat-card stat-tax">
          <span className="stat-label">Estimated tax</span>
          <strong className="stat-figure">{formatMoney(tax.estimatedTax)}</strong>
          <span className="stat-sub">after primary rebate</span>
        </div>
        <div className="stat-card stat-net">
          <span className="stat-label">Net after tax</span>
          <strong className="stat-figure">{formatMoney(tax.netIncome)}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Effective tax rate</span>
          <strong className="stat-figure">{formatPercent(tax.effectiveRatePercent)}</strong>
          <span className="stat-sub">marginal {tax.marginalRatePercent}%</span>
        </div>
      </div>

      <div className="card insight">
        <h2>Insight</h2>
        <Insight tax={tax} label={year.label} />
      </div>

      <div className="chart-grid">
        <div className="card">
          <h2>Monthly income</h2>
          <BarChart data={monthly} title={`Monthly income for ${year.label}`} />
        </div>
        <div className="card">
          <h2>Where your income goes</h2>
          <DonutChart
            title={`Income split between tax and net income for ${year.label}`}
            centerValue={formatPercent(tax.effectiveRatePercent)}
            centerLabel="effective rate"
            segments={[
              { label: 'Net income', value: tax.netIncome, tone: 'net' },
              { label: 'Estimated tax', value: tax.estimatedTax, tone: 'tax' },
            ]}
          />
        </div>
      </div>

      <div className="card">
        <h2>How your tax is calculated ({year.label} SARS brackets)</h2>
        <div className="table-wrap table-flush">
          <table>
            <thead>
              <tr>
                <th scope="col">Taxable income bracket</th>
                <th scope="col" className="num">
                  Rate
                </th>
                <th scope="col" className="num">
                  Your income in bracket
                </th>
                <th scope="col" className="num">
                  Tax on bracket
                </th>
              </tr>
            </thead>
            <tbody>
              {tax.brackets.map((b) => (
                <tr key={b.from} className={b.reached ? 'row-reached' : 'row-dim'}>
                  <td>
                    {formatMoney(b.from)} {b.to === null ? 'and above' : `to ${formatMoney(b.to)}`}
                  </td>
                  <td className="num">{b.rate}%</td>
                  <td className="num">{formatMoney(b.amountInBracket)}</td>
                  <td className="num">{formatMoney(b.taxInBracket)}</td>
                </tr>
              ))}
              <tr className="row-total">
                <td colSpan="3">Tax before rebate</td>
                <td className="num">{formatMoney(tax.taxBeforeRebate)}</td>
              </tr>
              <tr>
                <td colSpan="3">Less: primary rebate</td>
                <td className="num">- {formatMoney(Math.min(tax.rebate, tax.taxBeforeRebate))}</td>
              </tr>
              <tr className="row-total">
                <td colSpan="3">Estimated tax payable</td>
                <td className="num">{formatMoney(tax.estimatedTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <details className="explain">
          <summary>How this estimate works and what it assumes</summary>
          <p>{data.method.summary}</p>
          <ol>
            {data.method.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p>
            <strong>Assumptions</strong>
          </p>
          <ul>
            {data.method.assumptions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      </div>

      {data.byGig.length > 0 && (
        <div className="card">
          <h2>Earnings by gig</h2>
          <HorizontalBars
            label="Earnings by gig"
            items={data.byGig.map((g) => ({
              key: g.gigId || g.gigTitle,
              label: g.gigTitle,
              value: g.income,
              sub: `${g.bookings} booking${g.bookings === 1 ? '' : 's'}`,
            }))}
          />
        </div>
      )}

      <h2 className="section-title">Transactions in {year.label}</h2>
      {data.transactions.length === 0 ? (
        <EmptyState title="No transactions in this tax year">
          <p>
            Bookings on your gigs record a transaction here. <Link to="/my-gigs">Check your gigs are live.</Link>
          </p>
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Transaction</th>
                <th scope="col">Gig</th>
                <th scope="col">Client</th>
                <th scope="col">Booking</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col" className="num">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t) => (
                <tr key={t.id}>
                  <td className="nowrap ref">{displayRef('TXN', t.id)}</td>
                  <td>{t.gigTitle}</td>
                  <td>{t.clientName}</td>
                  <td className="nowrap">
                    {t.bookingId ? (
                      <Link to={`/bookings/${t.bookingId}`} className="ref">
                        {displayRef('BK', t.bookingId)}
                      </Link>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="nowrap">{formatDate(t.createdAt)}</td>
                  <td className="num">{formatMoney(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small disclaimer">{data.disclaimer}</p>
    </section>
  );
}
