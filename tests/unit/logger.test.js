process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLogger, maskEmail, redact } = require('../../src/utils/logger');
const { createHttpShipper } = require('../../src/utils/logShipper');

const capture = (level = 'debug') => {
  const lines = [];
  return { lines, log: createLogger({ level, sinks: [(e) => lines.push(e)], base: { service: 'test' } }) };
};

test('entries are structured with timestamp, level, event and base fields', () => {
  const { lines, log } = capture();
  log.info('booking.created', { bookingId: 'b1' });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].event, 'booking.created');
  assert.equal(lines[0].level, 'info');
  assert.equal(lines[0].service, 'test');
  assert.equal(lines[0].bookingId, 'b1');
  assert.ok(!Number.isNaN(Date.parse(lines[0].dt)));
});

test('secrets are redacted at any depth', () => {
  const { lines, log } = capture();
  log.warn('x', { password: 'hunter2', nested: { token: 'abc', Authorization: 'Bearer z', ok: 1 }, list: [{ passwordHash: 'h' }] });
  const out = JSON.stringify(lines[0]);
  assert.ok(!out.includes('hunter2') && !out.includes('abc') && !out.includes('Bearer') && !out.includes('"h"'));
  assert.equal(lines[0].nested.ok, 1);
});

test('emails are masked', () => {
  assert.equal(maskEmail('jane@example.com'), 'j***@example.com');
  assert.equal(maskEmail('nonsense'), '[invalid]');
});

test('errors are serialised with name, message and stack', () => {
  const r = redact({ err: new TypeError('boom') });
  assert.equal(r.err.name, 'TypeError');
  assert.equal(r.err.message, 'boom');
  assert.match(r.err.stack, /boom/);
});

test('level filtering and silent mode', () => {
  const warnOnly = capture('warn');
  warnOnly.log.info('a');
  warnOnly.log.warn('b');
  warnOnly.log.error('c');
  assert.deepEqual(warnOnly.lines.map((l) => l.event), ['b', 'c']);
  const silent = capture('silent');
  silent.log.error('never');
  assert.equal(silent.lines.length, 0);
});

test('a throwing sink never breaks the caller', () => {
  const log = createLogger({ level: 'info', sinks: [() => { throw new Error('disk full'); }] });
  assert.doesNotThrow(() => log.info('safe'));
});

test('request logger adds request id, ip and the user once known', () => {
  const { lines, log } = capture();
  const req = { id: 'req-1', ip: '10.0.0.5', method: 'POST', path: '/api/bookings' };
  const rl = log.forRequest(req);
  rl.warn('access.denied');
  req.user = { id: 'u1' };
  rl.info('booking.created');
  assert.equal(lines[0].requestId, 'req-1');
  assert.equal(lines[0].userId, undefined);
  assert.equal(lines[1].userId, 'u1');
  assert.equal(lines[1].ip, '10.0.0.5');
});

test('shipper batches entries and sends them with a Bearer token', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => { calls.push({ url, opts }); return { ok: true }; };
  const shipper = createHttpShipper({ url: 'https://logs.example.com', token: 'tok', batchSize: 2, fetchImpl });
  shipper.push({ message: 'a' });
  shipper.push({ message: 'b' });
  shipper.push({ message: 'c' });
  await shipper.flush();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].opts.headers.Authorization, 'Bearer tok');
  assert.equal(calls[0].opts.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].opts.body).map((e) => e.message), ['a', 'b']);
  assert.deepEqual(JSON.parse(calls[1].opts.body).map((e) => e.message), ['c']);
});

test('shipper refuses non-HTTPS endpoints and missing credentials', () => {
  const errors = [];
  const fetchImpl = async () => ({ ok: true });
  assert.equal(createHttpShipper({ url: 'http://insecure.example.com', token: 't', fetchImpl, onError: (e) => errors.push(e) }), null);
  assert.equal(errors.length, 1);
  assert.equal(createHttpShipper({ url: '', token: '', fetchImpl }), null);
});

test('shipper failures are reported but never thrown', async () => {
  const errors = [];
  const shipper = createHttpShipper({
    url: 'https://logs.example.com', token: 't', batchSize: 1,
    fetchImpl: async () => { throw new Error('network down'); },
    onError: (e) => errors.push(e.message),
  });
  shipper.push({ message: 'x' });
  await shipper.flush();
  assert.deepEqual(errors, ['network down']);
});

test('shipper drops the oldest entries when the queue is full', async () => {
  const sent = [];
  const shipper = createHttpShipper({
    url: 'https://logs.example.com', token: 't', batchSize: 1000, maxQueue: 3, intervalMs: 60000,
    fetchImpl: async (u, o) => { sent.push(...JSON.parse(o.body)); return { ok: true }; },
  });
  ['1', '2', '3', '4', '5'].forEach((m) => shipper.push({ message: m }));
  await shipper.flush();
  assert.deepEqual(sent.map((e) => e.message), ['3', '4', '5']);
});
