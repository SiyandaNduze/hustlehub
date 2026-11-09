const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/transactionController');

const router = express.Router();
router.get('/mine', requireAuth, requireRole('client', 'freelancer'), c.myTransactions);

module.exports = router;
