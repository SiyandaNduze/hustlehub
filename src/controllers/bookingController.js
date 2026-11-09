const env = require('../config/env');
const { gigs, bookings, transactions } = require('../models/collections');
const userStore = require('../models/userStore');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { appendTransaction } = require('../services/ledger');

const nameOf = (id) => {
  const u = userStore.findById(id);
  return u ? u.name : 'Unknown';
};

const enrich = (b) => ({ ...b, clientName: nameOf(b.clientId), freelancerName: nameOf(b.freelancerId) });

// Client: book a gig. Payment is simulated, but every booking ALWAYS produces a
// ledger-sealed transaction linking the client and the freelancer. The price is
// read from the gig on the server - the client cannot choose what they pay.
const createBooking = asyncHandler(async (req, res) => {
  const log = logger.forRequest(req);
  const gig = gigs.findById(req.body.gigId);
  if (!gig || !gig.active) {
    log.warn('booking.rejected', { reason: 'gig_unavailable', gigId: req.body.gigId });
    return res.status(404).json({ status: 'error', message: 'Gig not found or no longer available' });
  }

  const booking = bookings.insert({
    gigId: gig.id,
    gigTitle: gig.title,
    clientId: req.user.id,
    freelancerId: gig.freelancerId,
    price: gig.price,
    notes: req.body.notes || '',
    status: 'confirmed',
  });

  let transaction;
  try {
    transaction = appendTransaction(transactions, {
      bookingId: booking.id,
      gigId: gig.id,
      gigTitle: gig.title,
      clientId: req.user.id,
      freelancerId: gig.freelancerId,
      amount: gig.price,
      currency: env.currency,
      status: 'completed',
      method: 'simulated',
    });
  } catch (err) {
    bookings.remove(booking.id); // never leave a booking without its transaction
    throw err;
  }

  log.info('booking.created', { bookingId: booking.id, gigId: gig.id, freelancerId: gig.freelancerId, amount: gig.price });
  // The hash is logged too: the cloud log is an external anchor for the ledger.
  log.info('transaction.created', {
    transactionId: transaction.id,
    bookingId: booking.id,
    amount: transaction.amount,
    currency: transaction.currency,
    ledgerHash: transaction.hash,
  });

  res.status(201).json({
    status: 'success',
    message: 'Booking confirmed (simulated payment)',
    data: { booking: enrich(booking), transaction },
  });
});

// Client: bookings they made. Freelancer: bookings on their gigs.
const listMyBookings = asyncHandler(async (req, res) => {
  const mine = bookings
    .filter((b) => (req.user.role === 'client' ? b.clientId === req.user.id : b.freelancerId === req.user.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ status: 'success', data: { bookings: mine.map(enrich) } });
});

// Only the two parties (or an admin) may view a booking
const getBooking = asyncHandler(async (req, res) => {
  const booking = bookings.findById(req.params.id);
  if (!booking) return res.status(404).json({ status: 'error', message: 'Booking not found' });
  const allowed =
    req.user.role === 'admin' || booking.clientId === req.user.id || booking.freelancerId === req.user.id;
  if (!allowed) {
    logger.forRequest(req).warn('access.denied', { reason: 'not_party', action: 'booking.read', bookingId: booking.id });
    return res.status(403).json({ status: 'error', message: 'You cannot access this booking' });
  }
  return res.json({ status: 'success', data: { booking: enrich(booking) } });
});

module.exports = { createBooking, listMyBookings, getBooking };
