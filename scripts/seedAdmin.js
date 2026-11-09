// Creates the admin account (admins cannot self-register through the API).
// Usage: npm run seed:admin   (reads ADMIN_EMAIL / ADMIN_PASSWORD from .env)
require('../src/config/env');
const userStore = require('../src/models/userStore');
const { hashPassword } = require('../src/utils/passwords');

(async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@hustlehub.local';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('Set ADMIN_PASSWORD in your .env file first.');
    process.exit(1);
  }
  if (userStore.findByEmail(email)) {
    console.log(`Admin already exists: ${email}`);
    return;
  }
  userStore.createUser({
    name: 'HustleHub Admin',
    email,
    passwordHash: await hashPassword(password),
    role: 'admin',
  });
  console.log(`Admin created: ${email}`);
})();
