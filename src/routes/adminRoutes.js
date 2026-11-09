const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { listUsers, verifyLedger } = require('../controllers/adminController');
const { listAllTransactions } = require('../controllers/transactionController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));
router.get('/users', listUsers);
router.get('/transactions', listAllTransactions);
router.get('/ledger/verify', verifyLedger);

module.exports = router;
