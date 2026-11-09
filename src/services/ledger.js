// Tamper-evident transaction ledger (security feature).
// Every transaction stores `prevHash` (the previous record's hash) and `hash`
// = SHA-256 over its own financial fields + prevHash. Editing, reordering or
// deleting a record in the middle breaks the chain and is detected by
// verifyChain(), exposed to admins at GET /api/admin/ledger/verify.
// Each new hash is also written to the (cloud) log, which acts as an external
// anchor: an attacker who rewrites the whole file would also have to rewrite
// the remote logs to stay undetected.
const crypto = require('crypto');

const GENESIS = '0'.repeat(64);

const centsOf = (amount) => Math.round(Number(amount) * 100);

function canonical(record, prevHash) {
  return [
    prevHash,
    record.id,
    record.bookingId,
    record.gigId,
    record.clientId,
    record.freelancerId,
    centsOf(record.amount),
    record.currency,
    record.status,
    record.createdAt,
  ].join('|');
}

const computeHash = (record, prevHash) =>
  crypto.createHash('sha256').update(canonical(record, prevHash)).digest('hex');

// Returns the record with its chain fields attached.
function seal(record, prevHash) {
  return { ...record, prevHash, hash: computeHash(record, prevHash) };
}

// Constant-time comparison of two hex digests.
function sameDigest(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// Walks records in stored order. Records created before the ledger existed
// (no hash) are counted as `legacy` and may only appear before the first sealed record.
function verifyChain(records) {
  let expectedPrev = GENESIS;
  let verified = 0;
  let legacy = 0;
  let sealedSeen = false;

  for (const [index, record] of records.entries()) {
    if (!record.hash) {
      if (sealedSeen) {
        return { valid: false, total: records.length, verified, legacy, brokenAt: { index, id: record.id, reason: 'unsealed record inside chain' } };
      }
      legacy += 1;
      continue;
    }
    sealedSeen = true;

    if (!sameDigest(record.prevHash, expectedPrev)) {
      return { valid: false, total: records.length, verified, legacy, brokenAt: { index, id: record.id, reason: 'previous-hash link broken (record removed, inserted or reordered)' } };
    }
    if (!sameDigest(record.hash, computeHash(record, record.prevHash))) {
      return { valid: false, total: records.length, verified, legacy, brokenAt: { index, id: record.id, reason: 'record contents do not match their hash (edited)' } };
    }
    expectedPrev = record.hash;
    verified += 1;
  }

  return { valid: true, total: records.length, verified, legacy, head: expectedPrev };
}

// Store-backed helpers (kept lazy so the pure functions above stay testable without storage).
function appendTransaction(transactions, data, { createdAt } = {}) {
  const existing = transactions.all();
  const last = [...existing].reverse().find((t) => t.hash);
  const prevHash = last ? last.hash : GENESIS;
  const id = crypto.randomUUID();
  const stamp = createdAt || new Date().toISOString();
  const sealed = seal({ ...data, id, createdAt: stamp }, prevHash);
  return transactions.insert(sealed, { id, createdAt: stamp });
}

module.exports = { GENESIS, computeHash, seal, verifyChain, appendTransaction };
