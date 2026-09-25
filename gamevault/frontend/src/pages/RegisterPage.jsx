import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { validateRegistration } from '../validation.js';
import Alert from '../components/Alert.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validateRegistration(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError('');
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (id, label, type, autoComplete, hint) => (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} autoComplete={autoComplete} value={form[id]} onChange={set(id)}
        aria-invalid={Boolean(fieldErrors[id])} aria-describedby={`${id}-msg`} />
      <span id={`${id}-msg`} className={fieldErrors[id] ? 'field-error' : 'hint'}>{fieldErrors[id] || hint}</span>
    </>
  );

  return (
    <section className="auth-card">
      <h1>Create your account</h1>
      <form onSubmit={onSubmit} noValidate>
        {field('username', 'Username', 'text', 'username', 'Shown next to your reviews.')}
        {field('email', 'Email', 'email', 'email', '')}
        {field('password', 'Password', 'password', 'new-password', 'At least 8 characters with upper and lower case, a number and a symbol.')}
        {field('confirm', 'Confirm password', 'password', 'new-password', '')}
        <Alert>{error}</Alert>
        <button type="submit" className="btn wide" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </section>
  );
}
