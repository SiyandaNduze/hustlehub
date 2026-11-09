// Fills the app with realistic demo data so the income dashboard and tax charts
// have something to show (for screenshots and the demonstration video).
//   npm run seed:demo
// Creates: 1 freelancer, 2 clients, 4 gigs, and bookings spread across the current
// tax year. Transactions go through the same ledger as real bookings, so the
// admin "verify ledger" check passes. Safe to run twice (it skips if demo data exists).
require('../src/config/env');
const env = require('../src/config/env');
const userStore = require('../src/models/userStore');
const { gigs, bookings, transactions } = require('../src/models/collections');
const { hashPassword } = require('../src/utils/passwords');
const { appendTransaction } = require('../src/services/ledger');
const { taxYearOf } = require('../src/services/taxService');

const PASSWORD = 'DemoPass123';
const FREELANCER = 'thandi@demo.hustlehub.local';
const CLIENTS = ['sipho@demo.hustlehub.local', 'lerato@demo.hustlehub.local'];

(async () => {
  if (userStore.findByEmail(FREELANCER)) {
    console.log('Demo data already exists - nothing to do.');
    return;
  }
  const passwordHash = await hashPassword(PASSWORD);
  const freelancer = userStore.createUser({ name: 'Thandi Dlamini', email: FREELANCER, passwordHash, role: 'freelancer' });
  const clients = [
    userStore.createUser({ name: 'Sipho Nkosi', email: CLIENTS[0], passwordHash, role: 'client' }),
    userStore.createUser({ name: 'Lerato Mokoena', email: CLIENTS[1], passwordHash, role: 'client' }),
  ];

  const gigDefs = [
    ['Brand identity package', 'Logo, colour palette and brand guide for your business.', 'Design', 12500],
    ['Landing page build', 'Responsive, fast landing page with contact form.', 'Development', 18000],
    ['Social media content pack', 'Thirty days of branded post templates and captions.', 'Marketing', 6000],
    ['Logo refresh', 'Modernise your existing logo, delivered in all formats.', 'Design', 3500],
  ];
  const created = gigDefs.map(([title, description, category, price]) =>
    gigs.insert({ title, description, category, price, freelancerId: freelancer.id, active: true })
  );

  // Bookings across the current SA tax year (March onwards), oldest first.
  const startYear = taxYearOf(new Date());
  const plan = [
    ['03-12', 3, 0], ['04-03', 0, 1], ['04-21', 2, 0], ['05-15', 1, 1], ['06-09', 3, 0],
    ['06-28', 2, 1], ['07-14', 1, 0], ['08-02', 0, 0], ['08-19', 3, 1], ['09-10', 1, 1],
    ['09-25', 2, 0], ['10-07', 0, 1], ['10-20', 1, 0],
  ];
  const now = Date.now();
  let count = 0;
  for (const [monthDay, gigIndex, clientIndex] of plan) {
    const createdAt = `${startYear}-${monthDay}T09:30:00.000Z`;
    if (Date.parse(createdAt) > now) continue; // never create bookings in the future
    const gig = created.at(gigIndex);
    const client = clients.at(clientIndex);
    const booking = bookings.insert(
      { gigId: gig.id, gigTitle: gig.title, clientId: client.id, freelancerId: freelancer.id, price: gig.price, notes: '', status: 'confirmed' },
      { createdAt }
    );
    appendTransaction(
      transactions,
      { bookingId: booking.id, gigId: gig.id, gigTitle: gig.title, clientId: client.id, freelancerId: freelancer.id, amount: gig.price, currency: env.currency, status: 'completed', method: 'simulated' },
      { createdAt }
    );
    count += 1;
  }

  console.log(`Demo data created: ${count} bookings in tax year ${startYear}/${String(startYear + 1).slice(2)}.`);
  console.log(`Freelancer: ${FREELANCER}  /  ${PASSWORD}`);
  console.log(`Clients:    ${CLIENTS.join(', ')}  /  ${PASSWORD}`);
})();
