import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import BookingReceipt from '../components/BookingReceipt';

// Shows one booking and the transaction recorded for it. Right after booking
// both come from the POST response; otherwise they are fetched. The API only
// returns the booking to its client, its freelancer or an admin.
export default function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { state } = useLocation();
  const fresh = state?.booking?.id === id ? state : null;
  const [booking, setBooking] = useState(fresh?.booking || null);
  const [transaction, setTransaction] = useState(fresh?.transaction || null);
  const [loading, setLoading] = useState(!fresh?.transaction);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    if (fresh?.transaction) return undefined;
    let active = true;
    const txPath = user.role === 'admin' ? '/admin/transactions' : '/transactions/mine';

    Promise.all([api.get(`/bookings/${encodeURIComponent(id)}`), api.get(txPath).catch(() => null)])
      .then(([b, t]) => {
        if (!active) return;
        setBooking(b.data.booking);
        setTransaction(t?.data.transactions.find((tx) => tx.bookingId === id) || null);
      })
      .catch((err) => {
        if (!active) return;
        setProblem(
          [400, 403, 404].includes(err.status)
            ? "We couldn't find that booking, or it isn't yours to view."
            : err.message
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, user.role, fresh]);

  return (
    <section className="page page-narrow">
      <Link to={user.role === 'admin' ? '/admin' : '/bookings'} className="back">
        {user.role === 'admin' ? 'Admin' : 'Bookings'}
      </Link>
      {state?.justBooked && (
        <Alert type="success">
          Booking confirmed. A transaction has been recorded for you and the freelancer.
        </Alert>
      )}
      {loading && <Loading label="Loading booking" />}
      {problem && <Alert>{problem}</Alert>}
      {!loading && booking && <BookingReceipt booking={booking} transaction={transaction} />}
      {!loading && booking && user.role === 'client' && (
        <p className="after-ticket">
          <Link to="/payments">See all payments</Link> · <Link to="/gigs">Book another gig</Link>
        </p>
      )}
    </section>
  );
}
