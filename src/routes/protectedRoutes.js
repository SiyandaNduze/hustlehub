const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const userStore = require('../models/userStore');

const router = express.Router();

// Returns the authenticated user's public profile (used by the React app on reload)
router.get('/profile', requireAuth, (req, res) => {
  const user = userStore.findById(req.user.id);
  res.status(200).json({ status: 'success', data: { user: userStore.toPublicUser(user) } });
});

module.exports = router;
