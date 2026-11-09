const { gigs } = require('../models/collections');
const userStore = require('../models/userStore');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { CATEGORIES } = require('../constants');

const EDITABLE = ['title', 'description', 'category', 'price', 'active'];

// Allow-list copy: only named fields are copied (stops mass assignment, e.g.
// a client sending freelancerId). Uses entries() so no dynamic property lookups.
const allowFields = (source, keys) =>
  Object.fromEntries(Object.entries(source).filter(([key, value]) => keys.includes(key) && value !== undefined));

const withFreelancer = (gig) => {
  const owner = userStore.findById(gig.freelancerId);
  return { ...gig, freelancerName: owner ? owner.name : 'Unknown' };
};

const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);

const getCategories = (req, res) =>
  res.json({ status: 'success', data: { categories: CATEGORIES } });

// Freelancer: create own gig. freelancerId always comes from the JWT identity.
const createGig = asyncHandler(async (req, res) => {
  const { title, description, category, price } = req.body;
  const gig = gigs.insert({ title, description, category, price, freelancerId: req.user.id, active: true });
  logger.forRequest(req).info('gig.created', { gigId: gig.id, price: gig.price, category: gig.category });
  res.status(201).json({ status: 'success', message: 'Gig created', data: { gig: withFreelancer(gig) } });
});

// Any authenticated user: browse active gigs
const listGigs = asyncHandler(async (req, res) => {
  const { q, category } = req.query;
  let items = gigs.filter((g) => g.active);
  if (category) items = items.filter((g) => g.category === category);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (g) => g.title.toLowerCase().includes(needle) || g.description.toLowerCase().includes(needle)
    );
  }
  res.json({ status: 'success', data: { gigs: items.sort(newestFirst).map(withFreelancer) } });
});

// Freelancer: view own gigs (including inactive)
const myGigs = asyncHandler(async (req, res) => {
  const items = gigs.filter((g) => g.freelancerId === req.user.id).sort(newestFirst);
  res.json({ status: 'success', data: { gigs: items.map(withFreelancer) } });
});

const getGig = asyncHandler(async (req, res) => {
  const gig = gigs.findById(req.params.id);
  const canSeeInactive = gig && (gig.freelancerId === req.user.id || req.user.role === 'admin');
  if (!gig || (!gig.active && !canSeeInactive)) {
    return res.status(404).json({ status: 'error', message: 'Gig not found' });
  }
  return res.json({ status: 'success', data: { gig: withFreelancer(gig) } });
});

// Owner only
const updateGig = asyncHandler(async (req, res) => {
  const log = logger.forRequest(req);
  const gig = gigs.findById(req.params.id);
  if (!gig) return res.status(404).json({ status: 'error', message: 'Gig not found' });
  if (gig.freelancerId !== req.user.id) {
    log.warn('access.denied', { reason: 'not_owner', action: 'gig.update', gigId: gig.id });
    return res.status(403).json({ status: 'error', message: 'You can only modify your own gigs' });
  }
  const changes = allowFields(req.body, EDITABLE);
  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ status: 'error', message: 'No valid fields supplied to update' });
  }
  const updated = gigs.update(gig.id, changes);
  log.info('gig.updated', { gigId: gig.id, fields: Object.keys(changes) });
  return res.json({ status: 'success', message: 'Gig updated', data: { gig: withFreelancer(updated) } });
});

// Owner or admin
const deleteGig = asyncHandler(async (req, res) => {
  const log = logger.forRequest(req);
  const gig = gigs.findById(req.params.id);
  if (!gig) return res.status(404).json({ status: 'error', message: 'Gig not found' });
  if (req.user.role !== 'admin' && gig.freelancerId !== req.user.id) {
    log.warn('access.denied', { reason: 'not_owner', action: 'gig.delete', gigId: gig.id });
    return res.status(403).json({ status: 'error', message: 'You can only delete your own gigs' });
  }
  gigs.remove(gig.id);
  log.info('gig.deleted', { gigId: gig.id, byRole: req.user.role });
  return res.json({ status: 'success', message: 'Gig deleted' });
});

module.exports = { getCategories, createGig, listGigs, myGigs, getGig, updateGig, deleteGig };
