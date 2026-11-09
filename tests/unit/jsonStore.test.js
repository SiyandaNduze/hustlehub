const fs = require('fs');
const os = require('os');
const path = require('path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hustlehub-'));
process.env.DATA_DIR = dir;
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createCollection } = require('../../src/models/jsonStore');

test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

test('insert, find, filter, update and remove work against DATA_DIR', () => {
  const c = createCollection('things.json');
  assert.deepEqual(c.all(), []);
  const a = c.insert({ name: 'a' });
  const b = c.insert({ name: 'b' });
  assert.ok(fs.existsSync(path.join(dir, 'things.json')));
  assert.equal(c.findById(a.id).name, 'a');
  assert.equal(c.filter((x) => x.name === 'b').length, 1);
  assert.equal(c.update(b.id, { name: 'bb' }).name, 'bb');
  assert.equal(c.update('missing', { name: 'z' }), null);
  assert.equal(c.remove(a.id), true);
  assert.equal(c.remove(a.id), false);
  assert.equal(c.all().length, 1);
});

test('callers cannot override id or createdAt through the data object', () => {
  const c = createCollection('safe.json');
  const item = c.insert({ id: 'hacked', createdAt: 'yesterday', name: 'x' });
  assert.notEqual(item.id, 'hacked');
  assert.notEqual(item.createdAt, 'yesterday');
  const updated = c.update(item.id, { id: 'nope', name: 'y' });
  assert.equal(updated.id, item.id);
});

test('trusted callers can set id and createdAt through options', () => {
  const c = createCollection('trusted.json');
  const item = c.insert({ name: 'x' }, { id: 'fixed-id', createdAt: '2026-01-01T00:00:00.000Z' });
  assert.equal(item.id, 'fixed-id');
  assert.equal(item.createdAt, '2026-01-01T00:00:00.000Z');
});
