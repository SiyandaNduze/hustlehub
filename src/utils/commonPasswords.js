// Small blocklist of very common passwords (security feature). Complexity rules
// alone accept "Password123"; this rejects the passwords attackers try first.
// Production systems would use a larger list or the HIBP k-anonymity API.
const COMMON = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234', 'passw0rd', 'p@ssw0rd', 'p@ssword1',
  'qwerty', 'qwerty1', 'qwerty12', 'qwerty123', 'qwertyuiop', 'qwerty1234', '1qaz2wsx', 'zaq12wsx',
  'letmein', 'letmein1', 'letmein123', 'welcome', 'welcome1', 'welcome123', 'welcome12',
  'admin', 'admin123', 'admin1234', 'administrator', 'root1234', 'changeme', 'changeme1', 'changeme123',
  'iloveyou', 'iloveyou1', 'monkey123', 'dragon123', 'football1', 'football123', 'baseball1', 'superman1',
  'abc12345', 'abcd1234', 'abc123456', '12345678', '123456789', '1234567890', '123123123', '11111111',
  'trustno1', 'sunshine1', 'princess1', 'master123', 'login123', 'hello123', 'freedom1', 'whatever1',
  'summer2024', 'summer2025', 'summer2026', 'winter2025', 'winter2026', 'spring2026', 'february2026',
]);

const isCommonPassword = (password) =>
  typeof password === 'string' && COMMON.has(password.trim().toLowerCase());

module.exports = { isCommonPassword };
