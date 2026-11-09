import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HOME_FOR_ROLE, useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/validation';
import Alert, { ApiErrorAlert } from '../components/Alert';
import Field from '../components/Field';

export default function LoginPage() {
  const { user, login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={HOME_FOR_ROLE[user.role] || '/gigs'} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setApiError(null);
    const found = validateLogin(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      navigate(location.state?.from || HOME_FOR_ROLE[loggedIn?.role] || '/gigs', { replace: true });
    } catch (err) {
      setApiError(err);
      setForm((f) => ({ ...f, password: '' })); // never keep a rejected password in the form
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <h1>Log in</h1>
      <p className="lede">Welcome back. Pick up where you left off.</p>
      {location.state?.registered && <Alert type="success">Account created. Log in to get started.</Alert>}
      {sessionExpired && !location.state?.registered && (
        <Alert type="info">Your session ended. Please log in again.</Alert>
      )}
      <form className="card form" onSubmit={onSubmit} noValidate aria-label="Log in">
        <ApiErrorAlert error={apiError} />
        <Field
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
          error={errors.email}
        />
        <Field
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={onChange}
          error={errors.password}
        />
        <button className="btn btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
        <p className="muted small">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  );
}
