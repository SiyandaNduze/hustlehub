const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { idParam, createGigRules, updateGigRules, listGigRules } = require('../validators/gigValidators');
const c = require('../controllers/gigController');

const router = express.Router();

router.use(requireAuth); // every gig route needs a valid JWT

// Role check runs BEFORE validation so the wrong role gets 403, not a 400 hint
router.get('/categories', c.getCategories);
router.get('/mine', requireRole('freelancer'), c.myGigs); // must stay above /:id
router.get('/', listGigRules, validateRequest, c.listGigs);
router.get('/:id', idParam, validateRequest, c.getGig);
router.post('/', requireRole('freelancer'), createGigRules, validateRequest, c.createGig);
router.put('/:id', requireRole('freelancer'), idParam, updateGigRules, validateRequest, c.updateGig);
router.delete('/:id', requireRole('freelancer', 'admin'), idParam, validateRequest, c.deleteGig);

module.exports = router;
