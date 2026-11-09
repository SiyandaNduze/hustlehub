const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoginAttemptTracker } = require('../../src/services/loginAttempts');

const clock = () => { let t = 1_000_000; return { now: () => t, advance: (ms) => { t += ms; } }; };

test('locks after the configured number of failures', () => {
  const c = clock();
  const tracker = createLoginAttemptTracker({ maxFailures: 3, now: c.now });
  assert.equal(tracker.recordFailure('a@x.com').locked, false);
  assert.equal(tracker.recordFailure('a@x.com').locked, false);
  const third = tracker.recordFailure('a@x.com');
  assert.equal(third.locked, true);
  assert.ok(third.retryAfterSec > 0);
  assert.equal(tracker.check('a@x.com').locked, true);
});

test('lockout applies to unknown accounts the same way (no enumeration)', () => {
  const tracker = createLoginAttemptTracker({ maxFailures: 2, now: clock().now });
  tracker.recordFailure('ghost@nowhere.test');
  assert.equal(tracker.recordFailure('ghost@nowhere.test').locked, true);
});

test('other accounts are unaffected', () => {
  const tracker = createLoginAttemptTracker({ maxFailures: 2, now: clock().now });
  tracker.recordFailure('a@x.com');
  tracker.recordFailure('a@x.com');
  assert.equal(tracker.check('b@x.com').locked, false);
});

test('the lock expires after lockMs', () => {
  const c = clock();
  const tracker = createLoginAttemptTracker({ maxFailures: 2, lockMs: 60000, now: c.now });
  tracker.recordFailure('a@x.com');
  tracker.recordFailure('a@x.com');
  c.advance(59000);
  assert.equal(tracker.check('a@x.com').locked, true);
  c.advance(2000);
  assert.equal(tracker.check('a@x.com').locked, false);
});

test('failures outside the window do not count', () => {
  const c = clock();
  const tracker = createLoginAttemptTracker({ maxFailures: 3, windowMs: 1000, now: c.now });
  tracker.recordFailure('a@x.com');
  tracker.recordFailure('a@x.com');
  c.advance(5000);
  assert.equal(tracker.recordFailure('a@x.com').locked, false);
});

test('a successful login resets the counter', () => {
  const tracker = createLoginAttemptTracker({ maxFailures: 3, now: clock().now });
  tracker.recordFailure('a@x.com');
  tracker.recordFailure('a@x.com');
  tracker.recordSuccess('a@x.com');
  assert.equal(tracker.recordFailure('a@x.com').locked, false);
});

test('memory is capped when many different e-mails are tried', () => {
  const tracker = createLoginAttemptTracker({ maxEntries: 50, now: clock().now });
  for (let i = 0; i < 500; i += 1) tracker.recordFailure(`user${i}@x.com`);
  assert.ok(tracker.size() <= 51);
});
