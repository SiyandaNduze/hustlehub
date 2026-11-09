const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { bookingLimiter } = require('../middleware/rateLimiters');
const validateRequest = require('../middleware/validateRequest');
const { createBookingRules } = require('../validators/bookingValidators');
const { idParam } = require('../validators/gigValidators');
const c = require('../controllers/bookingController');

const router = express.Router();

// Limiter first so even unauthenticated floods are throttled
router.post('/', bookingLimiter, requireAuth, requireRole('client'), createBookingRules, validateRequest, c.createBooking);
router.get('/mine', requireAuth, requireRole('client', 'freelancer'), c.listMyBookings);
router.get('/:id', requireAuth, idParam, validateRequest, c.getBooking);

module.exports = router;
