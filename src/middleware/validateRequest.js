const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Sits after the validation rule chains on a route. If any rule failed,
// short-circuits with a controlled 400 instead of letting bad input reach the
// controller. Only field names are logged (never the submitted values).
function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const list = errors.array();
    logger.forRequest(req).warn('validation.failed', { fields: list.map((e) => e.path) });
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: list.map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  return next();
}

module.exports = validateRequest;
