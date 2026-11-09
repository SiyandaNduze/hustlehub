import { Link, Navigate } from 'react-router-dom';
import { HOME_FOR_ROLE, useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted loading">Loading…</p>;
  if (user) return <Navigate to={HOME_FOR_ROLE[user.role] || '/gigs'} replace />;

  return (
    <section className="hero">
      <h1 className="hero-title">
        Book the hustle.
        <br />
        Skip the hassle.
      </h1>
      <p className="hero-lede">
        Find local designers, developers, writers and tutors, book them in a few clicks, and keep every
        booking and payment on record.
      </p>
      <div className="hero-paths">
        <Link to="/register?role=client" className="path path-client">
          <span className="path-who">I need work done</span>
          <span className="path-what">Browse gigs and book a freelancer</span>
        </Link>
        <Link to="/register?role=freelancer" className="path path-freelancer">
          <span className="path-who">I want to earn</span>
          <span className="path-what">List your services and track your income</span>
        </Link>
      </div>
      <p className="hero-login">
        Already on HustleHub? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
