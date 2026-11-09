// Defence-in-depth against operator-injection ({"$ne": null}) and prototype
// pollution payloads. Removes dangerous keys from body and query recursively.
// (Field-level HTML stripping is done in the validators.)
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function clean(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 10) return;
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$') || key.includes('.') || FORBIDDEN_KEYS.has(key)) {
      Reflect.deleteProperty(node, key);
    } else {
      clean(value, depth + 1);
    }
  }
}

function sanitizeRequest(req, res, next) {
  clean(req.body);
  clean(req.query);
  next();
}

module.exports = sanitizeRequest;
module.exports.clean = clean;
