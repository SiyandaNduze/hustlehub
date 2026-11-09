import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// UX guard only: the API enforces authentication and roles on every request.
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="muted loading">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/gigs" replace />;
  return children;
}
