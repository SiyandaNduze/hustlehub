import StatusBadge from './StatusBadge';
import { displayRef, formatDate, formatMoney } from '../utils/format';

// A booking shown as a ticket. The tear-off stub holds the transaction that
// was recorded for it, so the link between booking and payment is visible.
export default function BookingReceipt({ booking, transaction }) {
  return (
    <article className="ticket" aria-label={`Booking ${displayRef('BK', booking.id)}`}>
      <div className="ticket-body">
        <div className="ticket-head">
          <p className="ticket-ref">{displayRef('BK', booking.id)}</p>
          <StatusBadge status={booking.status} />
        </div>
        <h2 className="ticket-title">{booking.gigTitle}</h2>
        <dl className="ticket-facts">
          <div>
            <dt>Client</dt>
            <dd>{booking.clientName}</dd>
          </div>
          <div>
            <dt>Freelancer</dt>
            <dd>{booking.freelancerName}</dd>
          </div>
          <div>
            <dt>Booked on</dt>
            <dd>{formatDate(booking.createdAt)}</dd>
          </div>
        </dl>
        {booking.notes && (
          <div className="ticket-notes">
            <h3>Notes for the freelancer</h3>
            <p>{booking.notes}</p>
          </div>
        )}
      </div>

      <div className="ticket-stub">
        <p className="ticket-amount">{formatMoney(booking.price)}</p>
        {transaction ? (
          <dl className="ticket-txn">
            <div>
              <dt>Transaction</dt>
              <dd>{displayRef('TXN', transaction.id)}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                Simulated · <StatusBadge status={transaction.status} />
              </dd>
            </div>
            <div>
              <dt>Recorded</dt>
              <dd>{formatDate(transaction.createdAt)}</dd>
            </div>
          </dl>
        ) : (
          <p className="ticket-missing">Transaction record not available to this account.</p>
        )}
      </div>
    </article>
  );
}
