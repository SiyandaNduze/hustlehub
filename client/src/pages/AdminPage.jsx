import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Alert, { ApiErrorAlert } from '../components/Alert';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import { displayRef, formatDate, formatMoney, shortRef } from '../utils/format';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/admin/transactions')])
      .then(([u, t]) => {
        setUsers(u.data.users);
        setTransactions(t.data.transactions);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // Recomputes the hash chain over every stored transaction (detects edited, removed or reordered records)
  async function verifyLedger() {
    setChecking(true);
    setError(null);
    try {
      const res = await api.get('/admin/ledger/verify');
      setLedger(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setChecking(false);
    }
  }

  const count = (role) => users.filter((u) => u.role === role).length;
  const volume =
    transactions.filter((t) => t.status === 'completed').reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0) / 100;

  return (
    <section className="page">
      <header className="page-head">
        <h1>Admin</h1>
        <Link className="btn btn-secondary" to="/gigs">
          Moderate gigs
        </Link>
      </header>
      <ApiErrorAlert error={error} />
      {loading && <Loading label="Loading platform data" />}

      {!loading && !error && (
        <>
          <dl className="stats">
            <div>
              <dt>Users</dt>
              <dd>{users.length}</dd>
            </div>
            <div>
              <dt>Clients / freelancers</dt>
              <dd>
                {count('client')} / {count('freelancer')}
              </dd>
            </div>
            <div>
              <dt>Transactions</dt>
              <dd>{transactions.length}</dd>
            </div>
            <div>
              <dt>Booking volume</dt>
              <dd>{formatMoney(volume)}</dd>
            </div>
          </dl>

          <div className="card ledger">
            <div>
              <h2>Transaction ledger integrity</h2>
              <p className="muted small">
                Every transaction is hash-chained to the one before it. Verifying recomputes the chain and detects
                edited, removed or reordered records.
              </p>
            </div>
            <button type="button" className="btn" onClick={verifyLedger} disabled={checking}>
              {checking ? 'Verifying…' : 'Verify ledger'}
            </button>
          </div>
          {ledger && ledger.valid && (
            <Alert type="success">
              Ledger intact: {ledger.verified} sealed transaction{ledger.verified === 1 ? '' : 's'} verified
              {ledger.legacy > 0 ? ` (${ledger.legacy} older unsealed)` : ''}.
            </Alert>
          )}
          {ledger && !ledger.valid && (
            <Alert>
              Tampering detected at record {ledger.brokenAt.index + 1} ({shortRef(ledger.brokenAt.id)}):{' '}
              {ledger.brokenAt.reason}.
            </Alert>
          )}

          <h2 className="section-title">Users ({users.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="nowrap">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="section-title">All transactions ({transactions.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Transaction</th>
                  <th scope="col">Booking</th>
                  <th scope="col">Gig</th>
                  <th scope="col">Client</th>
                  <th scope="col">Freelancer</th>
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
                    <td className="nowrap">
                      <Link to={`/bookings/${t.bookingId}`} className="ref">
                        {displayRef('BK', t.bookingId)}
                      </Link>
                    </td>
                    <td>{t.gigTitle}</td>
                    <td>{t.clientName}</td>
                    <td>{t.freelancerName}</td>
                    <td className="nowrap">{formatDate(t.createdAt)}</td>
                    <td className="num">{formatMoney(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
