const { body, param, query } = require('express-validator');
const { CATEGORIES } = require('../constants');
const { stripHtml } = require('../utils/sanitize');

const idParam = param('id').isUUID().withMessage('Invalid id');

const text = (field, label, min, max, optional) => {
  let chain = body(field);
  if (optional) chain = chain.optional();
  return chain
    .isString().withMessage(`${label} must be text`).bail()
    .customSanitizer(stripHtml)
    .isLength({ min, max }).withMessage(`${label} must be between ${min} and ${max} characters`);
};

const category = (optional) => {
  let chain = body('category');
  if (optional) chain = chain.optional();
  return chain.isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`);
};

const price = (optional) => {
  let chain = body('price');
  if (optional) chain = chain.optional();
  return chain
    .isFloat({ min: 1, max: 100000 }).withMessage('Price must be a number between 1 and 100000')
    .toFloat()
    .customSanitizer((v) => Math.round(v * 100) / 100);
};

const createGigRules = [
  text('title', 'Title', 3, 100, false),
  text('description', 'Description', 10, 2000, false),
  category(false),
  price(false),
];

const updateGigRules = [
  text('title', 'Title', 3, 100, true),
  text('description', 'Description', 10, 2000, true),
  category(true),
  price(true),
  body('active').optional().isBoolean().withMessage('Active must be true or false').toBoolean(),
];

const listGigRules = [
  query('q')
    .optional()
    .isString().withMessage('Search text is invalid').bail()
    .customSanitizer(stripHtml)
    .isLength({ max: 100 }).withMessage('Search text is too long'),
  query('category').optional().isIn(CATEGORIES).withMessage('Unknown category'),
];

module.exports = { idParam, createGigRules, updateGigRules, listGigRules };
