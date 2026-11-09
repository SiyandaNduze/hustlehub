import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { HOME_FOR_ROLE, useAuth } from '../context/AuthContext';
import { fieldErrorMap } from '../api/client';
import { COMMON_PASSWORD_MESSAGE, isCommonPassword, passwordProblems, validateRegister } from '../utils/validation';
import { ApiErrorAlert } from '../components/Alert';
import Field from '../components/Field';

const FIELDS = ['name', 'email', 'password', 'role'];

export default function RegisterPage() {
  const { user, register, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const startRole = params.get('role') === 'freelancer' ? 'freelancer' : 'client';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: startRole });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={HOME_FOR_ROLE[user.role] || '/gigs'} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const missing = passwordProblems(form.password);

  async function onSubmit(e) {
    e.preventDefault();
    setApiError(null);
    const found = validateRegister(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      // confirmPassword is only checked here - it is never sent to the API
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
    } catch (err) {
      setErrors(fieldErrorMap(err));
      setApiError(err);
      setSubmitting(false);
      return;
    }
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      navigate(HOME_FOR_ROLE[loggedIn?.role] || '/gigs', { replace: true });
    } catch {
      navigate('/login', { replace: true, state: { registered: true } }); // let the user log in manually
    }
  }

  return (
    <section className="auth-page">
      <h1>Create your account</h1>
      <p className="lede">One account. Choose whether you're hiring or earning.</p>
      <form className="card form" onSubmit={onSubmit} noValidate aria-label="Create account">
        <ApiErrorAlert error={apiError} shownFields={FIELDS} />

        <fieldset className="role-pick">
          <legend>I want to</legend>
          <label className={`role-option${form.role === 'client' ? ' is-picked' : ''}`}>
            <input type="radio" name="role" value="client" checked={form.role === 'client'} onChange={onChange} />
            Hire freelancers
          </label>
          <label className={`role-option${form.role === 'freelancer' ? ' is-picked' : ''}`}>
            <input type="radio" name="role" value="freelancer" checked={form.role === 'freelancer'} onChange={onChange} />
            Offer my services
          </label>
          {errors.role && <span className="field-error">{errors.role}</span>}
        </fieldset>

        <Field label="Full name" id="name" name="name" autoComplete="name" maxLength={100} value={form.name} onChange={onChange} error={errors.name} />
        <Field label="Email" id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          maxLength={128}
          hint={
            errors.password
              ? undefined // the error below says it already
              : isCommonPassword(form.password)
                ? `${COMMON_PASSWORD_MESSAGE}.`
                : form.password && missing.length
                  ? `Still needs ${missing.join(', ')}.`
                  : 'At least 8 characters with an uppercase letter, a lowercase letter and a number.'
          }
          value={form.password}
          onChange={onChange}
          error={errors.password}
        />
        <Field
          label="Confirm password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={onChange}
          error={errors.confirmPassword}
        />

        <button className="btn btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
        <p className="muted small">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}
