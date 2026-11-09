import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import GigForm from '../components/GigForm';
import Alert, { ApiErrorAlert } from '../components/Alert';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatMoney } from '../utils/format';

export default function MyGigsPage() {
  const [gigs, setGigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const formRef = useRef(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get('/gigs/mine');
      setGigs(res.data.gigs);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/gigs/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
    load();
  }, [load]);

  // Errors thrown here are shown by GigForm next to the right fields
  async function createGig(payload) {
    await api.post('/gigs', payload);
    setMessage(`Published "${payload.title}".`);
    await load();
  }

  async function updateGig(payload) {
    await api.put(`/gigs/${editing.id}`, payload);
    setEditing(null);
    setMessage('Changes saved.');
    await load();
  }

  const startEdit = (gig) => {
    setMessage('');
    setEditing(gig);
    formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  async function toggleActive(gig) {
    setError(null);
    setMessage('');
    try {
      await api.put(`/gigs/${gig.id}`, { active: !gig.active });
      setMessage(gig.active ? `"${gig.title}" is hidden from clients.` : `"${gig.title}" is live again.`);
      await load();
    } catch (err) {
      setError(err);
    }
  }

  async function deleteGig(gig) {
    setError(null);
    setMessage('');
    try {
      await api.del(`/gigs/${gig.id}`);
      setMessage(`Deleted "${gig.title}". Existing bookings and transactions are kept.`);
      if (editing?.id === gig.id) setEditing(null);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <section className="page">
      <header className="page-head">
        <h1>My gigs</h1>
      </header>
      {message && <Alert type="success">{message}</Alert>}
      <ApiErrorAlert error={error} />

      <div className="split">
        <div ref={formRef}>
          {editing ? (
            <>
              <h2>Edit gig</h2>
              <GigForm
                key={editing.id}
                categories={categories}
                initial={editing}
                submitLabel="Save changes"
                onSubmit={updateGig}
                onCancel={() => setEditing(null)}
              />
            </>
          ) : (
            <>
              <h2>Create a new gig</h2>
              <GigForm categories={categories} onSubmit={createGig} />
            </>
          )}
        </div>

        <div>
          <h2>Your listings</h2>
          {loading ? (
            <Loading />
          ) : gigs.length === 0 ? (
            <EmptyState title="You have not created any gigs yet">
              <p className="muted">Fill in the form to publish your first gig.</p>
            </EmptyState>
          ) : (
            <ul className="listing">
              {gigs.map((gig) => (
                <li key={gig.id} className={editing?.id === gig.id ? 'is-editing' : undefined}>
                  <div className="listing-main">
                    <p className="listing-meta">
                      {gig.category} · listed {formatDate(gig.createdAt)}
                    </p>
                    <h3>{gig.title}</h3>
                    <p className="listing-price">
                      {formatMoney(gig.price)} <StatusBadge status={gig.active ? 'live' : 'hidden'} />
                    </p>
                  </div>
                  <div className="listing-actions">
                    {confirmingId === gig.id ? (
                      <>
                        <button className="btn btn-danger btn-small" onClick={() => deleteGig(gig)}>
                          Confirm delete
                        </button>
                        <button className="btn btn-secondary btn-small" onClick={() => setConfirmingId(null)}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-secondary btn-small" onClick={() => startEdit(gig)}>
                          Edit
                        </button>
                        <button className="btn btn-secondary btn-small" onClick={() => toggleActive(gig)}>
                          {gig.active ? 'Hide' : 'Show'}
                        </button>
                        <button className="btn btn-danger-outline btn-small" onClick={() => setConfirmingId(gig.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
