import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import GigCard from '../components/GigCard';
import Alert, { ApiErrorAlert } from '../components/Alert';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

export default function GigsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [applied, setApplied] = useState({ q: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (search, cat) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (cat) params.set('category', cat);
      const qs = params.toString();
      const res = await api.get(`/gigs${qs ? `?${qs}` : ''}`);
      setGigs(res.data.gigs);
      setApplied({ q: search, category: cat });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/gigs/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
    load('', '');
  }, [load]);

  const onSearch = (e) => {
    e.preventDefault();
    load(q.trim().slice(0, 100), category);
  };

  const pickCategory = (cat) => {
    setCategory(cat);
    load(q.trim().slice(0, 100), cat);
  };

  const clearFilters = () => {
    setQ('');
    setCategory('');
    load('', '');
  };

  async function handleBook(gigId, notes) {
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      const body = notes ? { gigId, notes } : { gigId };
      const res = await api.post('/bookings', body);
      // Show the receipt: booking + the transaction the server recorded for it
      navigate(`/bookings/${res.data.booking.id}`, {
        state: { booking: res.data.booking, transaction: res.data.transaction, justBooked: true },
      });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  async function handleDelete(gigId) {
    setError(null);
    try {
      await api.del(`/gigs/${gigId}`);
      setMessage('Gig deleted.');
      load(applied.q, applied.category);
    } catch (err) {
      setError(err);
    }
  }

  const filtered = applied.q || applied.category;

  return (
    <section className="page">
      <header className="page-head">
        <h1>{user.role === 'freelancer' ? 'Marketplace' : 'Find a freelancer'}</h1>
        <form className="search" role="search" onSubmit={onSearch}>
          <label htmlFor="search" className="sr-only">
            Search gigs
          </label>
          <input
            id="search"
            type="search"
            placeholder="Logo, CV, landing page…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={100}
          />
          <label htmlFor="filter-category" className="sr-only">
            Category
          </label>
          <select id="filter-category" value={category} onChange={(e) => pickCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="btn" type="submit">
            Search
          </button>
        </form>
      </header>

      {message && <Alert type="success">{message}</Alert>}
      <ApiErrorAlert error={error} />

      {loading ? (
        <Loading label="Loading gigs" />
      ) : gigs.length === 0 ? (
        <EmptyState title={filtered ? 'No gigs match that search' : 'No gigs listed yet'}>
          {filtered ? (
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear search
            </button>
          ) : (
            <p className="muted">Check back soon - freelancers are adding new services.</p>
          )}
        </EmptyState>
      ) : (
        <>
          <p className="muted small results-count">
            {gigs.length} {gigs.length === 1 ? 'gig' : 'gigs'}
            {applied.category ? ` in ${applied.category}` : ''}
            {applied.q ? ` matching "${applied.q}"` : ''}
            {filtered && (
              <>
                {' · '}
                <button className="link-button" onClick={clearFilters}>
                  Clear
                </button>
              </>
            )}
          </p>
          <div className="grid">
            {gigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                role={user.role}
                isOwn={gig.freelancerId === user.id}
                busy={busy}
                onBook={handleBook}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
