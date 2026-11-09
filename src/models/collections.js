const { createCollection } = require('./jsonStore');

module.exports = {
  gigs: createCollection('gigs.json'),
  bookings: createCollection('bookings.json'),
  transactions: createCollection('transactions.json'),
};
