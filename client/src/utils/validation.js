// Client-side validation gives instant feedback. It mirrors the server rules
// but is NOT a security control - the API validates everything again.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors the API's blocklist (src/utils/commonPasswords.js) so the user hears about a
// predictable password before submitting. The API still enforces it; keep the lists in sync.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234', 'passw0rd', 'p@ssw0rd', 'p@ssword1',
  'qwerty', 'qwerty1', 'qwerty12', 'qwerty123', 'qwertyuiop', 'qwerty1234', '1qaz2wsx', 'zaq12wsx',
  'letmein', 'letmein1', 'letmein123', 'welcome', 'welcome1', 'welcome123', 'welcome12',
  'admin', 'admin123', 'admin1234', 'administrator', 'root1234', 'changeme', 'changeme1', 'changeme123',
  'iloveyou', 'iloveyou1', 'monkey123', 'dragon123', 'football1', 'football123', 'baseball1', 'superman1',
  'abc12345', 'abcd1234', 'abc123456', '12345678', '123456789', '1234567890', '123123123', '11111111',
  'trustno1', 'sunshine1', 'princess1', 'master123', 'login123', 'hello123', 'freedom1', 'whatever1',
  'summer2024', 'summer2025', 'summer2026', 'winter2025', 'winter2026', 'spring2026', 'february2026',
]);
export const isCommonPassword = (password) => COMMON_PASSWORDS.has(String(password).trim().toLowerCase());
export const COMMON_PASSWORD_MESSAGE = 'This password is too common. Please choose a less predictable one';

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

// Lists the password rules that are still missing (shown live while typing)
export function passwordProblems(password) {
  const problems = [];
  if (password.length < 8) problems.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
  if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
  if (!/[0-9]/.test(password)) problems.push('a number');
  return problems;
}

export function validateRegister({ name, email, password, confirmPassword, role }) {
  const errors = {};
  const n = name.trim();
  if (n.length < 2 || n.length > 100) errors.name = 'Name must be between 2 and 100 characters';
  else if (/[<>]/.test(n)) errors.name = 'Name cannot contain < or >';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (password.length > 128) errors.password = 'Password must be 128 characters or fewer';
  else if (isCommonPassword(password)) errors.password = COMMON_PASSWORD_MESSAGE;
  else if (passwordProblems(password).length)
    errors.password = 'Password needs an uppercase letter, a lowercase letter and a number';
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  if (!['client', 'freelancer'].includes(role)) errors.role = 'Choose a role';
  return errors;
}

export function validateGig({ title, description, category, price }) {
  const errors = {};
  const t = title.trim();
  const d = description.trim();
  if (t.length < 3 || t.length > 100) errors.title = 'Title must be between 3 and 100 characters';
  if (d.length < 10 || d.length > 2000) errors.description = 'Description must be between 10 and 2000 characters';
  if (!category) errors.category = 'Choose a category';
  const p = Number(price);
  if (price === '' || Number.isNaN(p) || p < 1 || p > 100000)
    errors.price = 'Price must be a number between 1 and 100000';
  return errors;
}

export function validateBookingNotes(notes) {
  return notes.length > 500 ? 'Notes must be 500 characters or fewer' : '';
}
