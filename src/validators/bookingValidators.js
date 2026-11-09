const { body } = require('express-validator');
const { stripHtml } = require('../utils/sanitize');

const createBookingRules = [
  body('gigId').isString().bail().isUUID().withMessage('A valid gigId is required'),
  body('notes')
    .optional({ values: 'falsy' })
    .isString().withMessage('Notes must be text').bail()
    .customSanitizer(stripHtml)
    .isLength({ max: 500 }).withMessage('Notes must be 500 characters or fewer'),
];

module.exports = { createBookingRules };
