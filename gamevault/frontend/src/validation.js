// Client-side checks mirror the API rules for fast feedback. The API still validates
// everything: client-side validation is for usability, never for security.
export function validateRegistration({ username, email, password, confirm }) {
  const errors = {};
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    errors.username = 'Use 3–30 letters, numbers or underscores.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
  const missing = [];
  if (password.length < 8) missing.push('8+ characters');
  if (!/[a-z]/.test(password)) missing.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) missing.push('an uppercase letter');
  if (!/\d/.test(password)) missing.push('a number');
  if (!/[^A-Za-z0-9]/.test(password)) missing.push('a symbol');
  if (missing.length) errors.password = `Password needs ${missing.join(', ')}.`;
  if (confirm !== undefined && confirm !== password) errors.confirm = 'Passwords do not match.';
  return errors;
}
