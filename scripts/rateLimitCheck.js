// Demonstrates IP rate limiting: fires bad logins (a different e-mail each time, so the
// per-account lockout is not what triggers) until the API answers 429.
// Usage (server running):  npm run test:ratelimit
// Restart the server afterwards to reset the in-memory counters.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // self-signed local certificate
const env = require('../src/config/env');

const url = process.env.TARGET_URL || `https://localhost:${env.port}/api/auth/login`;

(async () => {
  const attempts = env.authRateLimitMax + 5;
  for (let i = 1; i <= attempts; i += 1) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `nobody${i}@example.com`, password: 'WrongPass123' }),
    });
    if (res.status === 429) {
      const body = await res.json();
      console.log(`Attempt ${i}: 429 Too Many Requests`);
      console.log(`Retry-After: ${res.headers.get('retry-after')}s`);
      console.log(`Message: ${body.message}`);
      console.log('PASS: login endpoint is rate limited.');
      return;
    }
    console.log(`Attempt ${i}: ${res.status}`);
  }
  console.log('FAIL: no 429 received.');
  process.exit(1);
})().catch((e) => {
  console.error('Could not reach the server:', e.message);
  process.exit(1);
});
