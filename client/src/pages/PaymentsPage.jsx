import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ApiErrorAlert } from '../components/Alert';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { displayRef, formatDate, formatMoney } from '../utils/format';

// Client view of the transaction records created by their bookings
export default function PaymentsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/transactions/mine')
      .then((res) => setTransactions(res.data.transactions))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const paid = transactions.filter((t) => t.status === 'completed');
  const total = paid.reduce((sum, t) => sum + Math.round(Number(t.amount) * 100), 0) / 100;

  return (
    <section className="page">
      <header className="page-head">
        <h1>Payments</h1>
      </header>
      <ApiErrorAlert error={error} />
      {loading ? (
        <Loading label="Loading payments" />
      ) : (
        !error && (
          <>
            <dl className="stats">
              <div>
                <dt>Total spent</dt>
                <dd>{formatMoney(total)}</dd>
              </div>
              <div>
                <dt>Payments</dt>
                <dd>{paid.length}</dd>
              </div>
            </dl>
            <p className="muted small">All payments are simulated. Each one was recorded when you made a booking.</p>

            {transactions.length === 0 ? (
              <EmptyState title="No payments yet">
                <p>
                  <Link to="/gigs">Book a gig</Link> and its transaction will appear here.
                </p>
              </EmptyState>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Transaction</th>
                      <th scope="col">Gig</th>
                      <th scope="col">Freelancer</th>
                      <th scope="col">Booking</th>
                      <th scope="col">Status</th>
                      <th scope="col">Date</th>
                      <th scope="col" className="num">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="nowrap ref">{displayRef('TXN', t.id)}</td>
                        <td>{t.gigTitle}</td>
                        <td>{t.freelancerName}</td>
                        <td className="nowrap">
                          <Link to={`/bookings/${t.bookingId}`} className="ref">
                            {displayRef('BK', t.bookingId)}
                          </Link>
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
          </>
        )
      )}
    </section>
  );
}
