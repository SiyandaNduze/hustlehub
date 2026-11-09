import { Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GigsPage from './pages/GigsPage';
import MyGigsPage from './pages/MyGigsPage';
import BookingsPage from './pages/BookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import IncomePage from './pages/IncomePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Route guards mirror the API's role rules (the API still enforces them).
export default function App() {
  const location = useLocation();
  return (
    <div className="shell">
      <Navbar />
      <main id="main" className="container" tabIndex={-1}>
        {/* keyed by path so navigating away clears a failed page */}
        <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/gigs" element={<ProtectedRoute><GigsPage /></ProtectedRoute>} />
          <Route path="/my-gigs" element={<ProtectedRoute allowedRoles={['freelancer']}><MyGigsPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute allowedRoles={['client', 'freelancer']}><BookingsPage /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute allowedRoles={['client']}><PaymentsPage /></ProtectedRoute>} />
          <Route path="/income" element={<ProtectedRoute allowedRoles={['freelancer']}><IncomePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </ErrorBoundary>
      </main>
      <footer className="footer">HustleHub · Payments are simulated. No real money changes hands.</footer>
    </div>
  );
}
