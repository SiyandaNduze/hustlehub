const { body } = require('express-validator');
const { stripHtml } = require('../utils/sanitize');
const { isCommonPassword } = require('../utils/commonPasswords');

// Every field is type-checked (isString) first so objects/arrays such as
// {"$ne": null} can never reach later validators or the controllers.
const registerValidationRules = [
  body('name')
    .isString().withMessage('Name is required').bail()
    .customSanitizer(stripHtml)
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .isString().withMessage('A valid email address is required').bail()
    .trim()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),

  body('password')
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .custom((value) => !isCommonPassword(value))
    .withMessage('This password is too common. Please choose a less predictable one'),

  // 'admin' is deliberately NOT allowed: admins are created by the seed script only
  body('role')
    .optional()
    .isIn(['client', 'freelancer']).withMessage('Role must be either "client" or "freelancer"'),
];

const loginValidationRules = [
  body('email')
    .isString().withMessage('A valid email address is required').bail()
    .trim()
    .isEmail().withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 1, max: 128 }).withMessage('Password is required'),
];

module.exports = { registerValidationRules, loginValidationRules };
