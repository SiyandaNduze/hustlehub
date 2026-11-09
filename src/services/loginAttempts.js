// Per-account login lockout (security feature).
// Tracks failed logins by normalised e-mail address - for EXISTING AND
// NON-EXISTING accounts alike - so the lockout response never reveals whether
// an account exists. After `maxFailures` failures inside `windowMs` the key is
// locked for `lockMs`. Complements the per-IP rate limiter: IP limits stop one
// machine, this stops a distributed guessing attack on one account.
// State is in memory (resets on restart) and capped so it cannot be used to
// exhaust memory by spraying random e-mail addresses.
function createLoginAttemptTracker({
  maxFailures = 5,
  windowMs = 15 * 60 * 1000,
  lockMs = 15 * 60 * 1000,
  maxEntries = 10000,
  now = () => Date.now(),
} = {}) {
  const entries = new Map(); // key -> { failures: number[], lockedUntil: number }

  const prune = () => {
    const t = now();
    for (const [key, entry] of entries) {
      const recent = entry.failures.filter((ts) => t - ts < windowMs);
      if (recent.length === 0 && entry.lockedUntil <= t) entries.delete(key);
      else entries.set(key, { failures: recent, lockedUntil: entry.lockedUntil });
    }
    while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
  };

  const status = (key) => {
    const entry = entries.get(key);
    const t = now();
    if (entry && entry.lockedUntil > t) {
      return { locked: true, retryAfterSec: Math.ceil((entry.lockedUntil - t) / 1000) };
    }
    return { locked: false, retryAfterSec: 0 };
  };

  return {
    check: status,
    recordFailure(key) {
      prune();
      const t = now();
      const entry = entries.get(key) || { failures: [], lockedUntil: 0 };
      const failures = [...entry.failures.filter((ts) => t - ts < windowMs), t];
      const lockedUntil = failures.length >= maxFailures ? t + lockMs : entry.lockedUntil;
      entries.set(key, { failures: lockedUntil > t ? [] : failures, lockedUntil });
      return { ...status(key), failures: failures.length };
    },
    recordSuccess(key) {
      entries.delete(key);
    },
    size: () => entries.size,
  };
}

module.exports = { createLoginAttemptTracker };
