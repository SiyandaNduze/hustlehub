const express = require('express');
const { query } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { getIncome } = require('../controllers/transactionController');

const router = express.Router();
router.get(
  '/',
  requireAuth,
  requireRole('freelancer'),
  query('taxYear').optional().isInt({ min: 2000, max: 2100 }).withMessage('taxYear must be a year such as 2026'),
  validateRequest,
  getIncome
);

module.exports = router;
