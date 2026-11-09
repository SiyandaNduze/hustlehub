import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ApiErrorAlert } from '../components/Alert';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { displayRef, formatDate, formatMoney } from '../utils/format';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isClient = user.role === 'client';

  useEffect(() => {
    api
      .get('/bookings/mine')
      .then((res) => setBookings(res.data.bookings))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page">
      <header className="page-head">
        <h1>{isClient ? 'My bookings' : 'Bookings on my gigs'}</h1>
        {isClient && (
          <Link className="btn btn-accent" to="/gigs">
            Book a gig
          </Link>
        )}
      </header>
      <ApiErrorAlert error={error} />
      {loading ? (
        <Loading label="Loading bookings" />
      ) : bookings.length === 0 ? (
        !error && (
          <EmptyState title="No bookings yet">
            {isClient ? (
              <p>
                <Link to="/gigs">Browse gigs</Link> to make your first booking.
              </p>
            ) : (
              <p className="muted">When a client books one of your gigs, it shows up here.</p>
            )}
          </EmptyState>
        )
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Booking</th>
                <th scope="col">Gig</th>
                <th scope="col">{isClient ? 'Freelancer' : 'Client'}</th>
                <th scope="col">Notes</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col" className="num">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="nowrap">
                    <Link to={`/bookings/${b.id}`} state={{ booking: b }} className="ref">
                      {displayRef('BK', b.id)}
                    </Link>
                  </td>
                  <td>{b.gigTitle}</td>
                  <td>{isClient ? b.freelancerName : b.clientName}</td>
                  <td className="notes-cell">{b.notes || '—'}</td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="nowrap">{formatDate(b.createdAt)}</td>
                  <td className="num">{formatMoney(b.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
