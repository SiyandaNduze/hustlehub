import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../utils/format';
import { validateBookingNotes } from '../utils/validation';

// Renders gig data as plain text (React escapes it) - never as HTML.
export default function GigCard({ gig, role, isOwn = false, onBook, onDelete, busy = false }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const confirmBooking = () => {
    const problem = validateBookingNotes(notes);
    setNotesError(problem);
    if (problem) return;
    // Only the gig id and notes are sent. The price is set by the server.
    onBook(gig.id, notes.trim());
  };

  return (
    <article className="card gig-card">
      <header className="card-header">
        <p className="gig-category">{gig.category}</p>
        {isOwn && <span className="badge badge-own">Your gig</span>}
      </header>
      <h3>{gig.title}</h3>
      <p className="gig-description">{gig.description}</p>
      <div className="gig-foot">
        <p className="muted small">by {gig.freelancerName}</p>
        <p className="price">{formatMoney(gig.price)}</p>
      </div>

      {role === 'client' && !open && (
        <button className="btn btn-accent" onClick={() => setOpen(true)}>
          Book this gig
        </button>
      )}

      {role === 'client' && open && (
        <div className="booking-box">
          <label htmlFor={`notes-${gig.id}`}>Notes for the freelancer (optional)</label>
          <textarea
            id={`notes-${gig.id}`}
            maxLength={500}
            rows={3}
            value={notes}
            aria-invalid={notesError ? 'true' : undefined}
            aria-describedby={`notes-${gig.id}-help`}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="muted small" id={`notes-${gig.id}-help`}>
            {notesError || `${500 - notes.length} characters left. Payment is simulated - no real charge is made.`}
          </p>
          <div className="row">
            <button className="btn btn-accent" disabled={busy} onClick={confirmBooking}>
              {busy ? 'Booking…' : `Confirm booking · ${formatMoney(gig.price)}`}
            </button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {role === 'freelancer' && isOwn && (
        <Link className="btn btn-secondary" to="/my-gigs">
          Manage in My gigs
        </Link>
      )}

      {role === 'admin' &&
        (confirmDelete ? (
          <div className="row">
            <button className="btn btn-danger" onClick={() => onDelete(gig.id)}>
              Confirm delete
            </button>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
              Keep
            </button>
          </div>
        ) : (
          <button className="btn btn-danger-outline" onClick={() => setConfirmDelete(true)}>
            Delete gig
          </button>
        ))}
    </article>
  );
}
