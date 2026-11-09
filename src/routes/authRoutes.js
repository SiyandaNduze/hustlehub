const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiters');
const { requireAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { registerValidationRules, loginValidationRules } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, registerValidationRules, validateRequest, register);
router.post('/login', authLimiter, loginValidationRules, validateRequest, login);
router.post('/logout', requireAuth, logout);

module.exports = router;
