const test = require('node:test');
const assert = require('node:assert/strict');
const { stripHtml } = require('../../src/utils/sanitize');
const sanitizeRequest = require('../../src/middleware/sanitizeRequest');
const { isCommonPassword } = require('../../src/utils/commonPasswords');

test('stripHtml removes tags, keeps harmless text and punctuation', () => {
  assert.equal(stripHtml('<script>alert(1)</script>Banner design'), 'alert(1)Banner design');
  assert.equal(stripHtml('<img src=x onerror=alert(1)>Animated banners'), 'Animated banners');
  assert.equal(stripHtml("Tom & O'Brien"), "Tom & O'Brien");
  assert.ok(!stripHtml('a <b>bold</b> < c').includes('<'));
  assert.equal(stripHtml('  padded  '), 'padded');
});

test('stripHtml removes control characters but keeps new lines', () => {
  assert.equal(stripHtml('a\u0000b\u0007c'), 'abc');
  assert.equal(stripHtml('line1\nline2'), 'line1\nline2');
});

test('stripHtml leaves non-strings alone for the validators to reject', () => {
  assert.deepEqual(stripHtml({ a: 1 }), { a: 1 });
  assert.equal(stripHtml(5), 5);
});

test('sanitizeRequest strips operator and prototype-pollution keys', () => {
  const req = {
    body: JSON.parse('{"email":{"$ne":null},"a.b":1,"__proto__":{"polluted":true},"ok":"fine","deep":{"$gt":1,"keep":2}}'),
    query: { 'x.y': 1, q: 'hi' },
  };
  let called = false;
  sanitizeRequest(req, {}, () => { called = true; });
  assert.ok(called);
  assert.deepEqual(req.body.email, {});
  assert.equal(Object.hasOwn(req.body, 'a.b'), false);
  assert.equal(Object.hasOwn(req.body, '__proto__'), false);
  assert.deepEqual(req.body.deep, { keep: 2 });
  assert.equal(req.body.ok, 'fine');
  assert.deepEqual(req.query, { q: 'hi' });
  assert.equal(({}).polluted, undefined);
});

test('common passwords are rejected regardless of case', () => {
  assert.equal(isCommonPassword('Password123'), true);
  assert.equal(isCommonPassword('  QWERTY123 '), true);
  assert.equal(isCommonPassword('StrongPass123'), false);
  assert.equal(isCommonPassword('Xk9!rT2#vLm'), false);
  assert.equal(isCommonPassword(undefined), false);
});
