const test = require('node:test');
const assert = require('node:assert/strict');
const { GENESIS, seal, verifyChain, appendTransaction } = require('../../src/services/ledger');

const base = (n) => ({
  id: `id-${n}`, bookingId: `b-${n}`, gigId: 'g', clientId: 'c', freelancerId: 'f',
  amount: 100 * n, currency: 'ZAR', status: 'completed', createdAt: `2026-06-0${n}T10:00:00.000Z`,
});

function chain(count) {
  const records = [];
  let prev = GENESIS;
  for (let n = 1; n <= count; n += 1) {
    const sealed = seal(base(n), prev);
    records.push(sealed);
    prev = sealed.hash;
  }
  return records;
}

test('an untouched chain verifies', () => {
  const r = verifyChain(chain(4));
  assert.equal(r.valid, true);
  assert.equal(r.verified, 4);
  assert.equal(r.legacy, 0);
  assert.equal(r.head.length, 64);
});

test('an empty ledger is valid', () => {
  assert.equal(verifyChain([]).valid, true);
});

test('editing an amount is detected', () => {
  const records = chain(3).map((rec, i) => (i === 1 ? { ...rec, amount: 1 } : rec));
  const r = verifyChain(records);
  assert.equal(r.valid, false);
  assert.equal(r.brokenAt.index, 1);
  assert.match(r.brokenAt.reason, /edited/);
});

test('editing the freelancer on a record is detected', () => {
  const records = chain(3).map((rec, i) => (i === 2 ? { ...rec, freelancerId: 'someone-else' } : rec));
  assert.equal(verifyChain(records).valid, false);
});

test('deleting a record in the middle is detected', () => {
  const records = chain(4);
  const r = verifyChain([records[0], records[2], records[3]]);
  assert.equal(r.valid, false);
  assert.equal(r.brokenAt.index, 1);
  assert.match(r.brokenAt.reason, /link broken/);
});

test('reordering records is detected', () => {
  const records = chain(3);
  assert.equal(verifyChain([records[1], records[0], records[2]]).valid, false);
});

test('recomputing a hash after editing still breaks the next link', () => {
  const records = chain(3);
  const forged = seal({ ...base(2), amount: 1 }, records[0].hash); // attacker re-seals record 2
  const r = verifyChain([records[0], forged, records[2]]);
  assert.equal(r.valid, false);
  assert.equal(r.brokenAt.index, 2);
});

test('records created before the ledger existed are counted as legacy', () => {
  const legacy = [{ id: 'old-1', amount: 5 }, { id: 'old-2', amount: 6 }];
  const r = verifyChain([...legacy, ...chain(2)]);
  assert.equal(r.valid, true);
  assert.equal(r.legacy, 2);
  assert.equal(r.verified, 2);
});

test('an unsealed record after sealed ones is flagged', () => {
  const r = verifyChain([...chain(2), { id: 'sneaky', amount: 1 }]);
  assert.equal(r.valid, false);
  assert.equal(r.brokenAt.id, 'sneaky');
});

test('appendTransaction links each new record to the previous hash', () => {
  const rows = [];
  const store = {
    all: () => rows,
    insert: (data, opts) => { const item = { ...data, id: opts.id, createdAt: opts.createdAt }; rows.push(item); return item; },
  };
  const payload = { bookingId: 'b', gigId: 'g', clientId: 'c', freelancerId: 'f', amount: 250, currency: 'ZAR', status: 'completed' };
  const first = appendTransaction(store, payload, { createdAt: '2026-06-01T08:00:00.000Z' });
  const second = appendTransaction(store, payload);
  assert.equal(first.prevHash, GENESIS);
  assert.equal(second.prevHash, first.hash);
  assert.equal(first.createdAt, '2026-06-01T08:00:00.000Z');
  assert.equal(verifyChain(rows).valid, true);
  rows[0].amount = 1;
  assert.equal(verifyChain(rows).valid, false);
});
