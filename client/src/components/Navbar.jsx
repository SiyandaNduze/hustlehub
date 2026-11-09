import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';

const LINKS = {
  client: [
    ['/gigs', 'Browse gigs'],
    ['/bookings', 'My bookings'],
    ['/payments', 'Payments'],
  ],
  freelancer: [
    ['/my-gigs', 'My gigs'],
    ['/bookings', 'Bookings'],
    ['/income', 'Income'],
    ['/gigs', 'Marketplace'],
  ],
  admin: [
    ['/admin', 'Admin'],
    ['/gigs', 'Browse gigs'],
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <header className="navbar">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Link to="/" className="brand" aria-label="HustleHub home">
        <span className="brand-mark" aria-hidden="true">
          H
        </span>
        HustleHub
      </Link>

      {user && (
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      )}

      <nav id="main-nav" className={`nav-links${open ? ' is-open' : ''}`} aria-label="Main">
        {user ? (
          <>
            {(LINKS[user.role] || []).map(([to, label]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ))}
            <div className="nav-user">
              <span className="nav-name">{user.name}</span>
              <StatusBadge status={user.role} />
              <button className="btn btn-ghost btn-small" onClick={onLogout}>
                Log out
              </button>
            </div>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <Link to="/register" className="btn btn-accent btn-small">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
