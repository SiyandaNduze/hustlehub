// Ships log entries to a cloud logging platform over HTTPS.
// Format follows Better Stack's HTTP ingestion API (POST a JSON array with a
// Bearer source token; `dt` = event time, `message` = text) but any platform
// that accepts a JSON array with Bearer auth works. It batches entries,
// never throws, and never blocks a request.
function createHttpShipper({
  url,
  token,
  batchSize = 20,
  intervalMs = 5000,
  maxQueue = 1000,
  fetchImpl = globalThis.fetch,
  onError = () => {},
} = {}) {
  if (!url || !token || typeof fetchImpl !== 'function') return null;
  if (!/^https:\/\//i.test(url)) {
    onError(new Error('LOG_HTTP_URL must start with https:// - cloud log shipping disabled'));
    return null;
  }

  let queue = [];
  let timer = null;
  let sending = Promise.resolve();

  const send = (batch) =>
    fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(batch),
    })
      .then((res) => {
        if (!res.ok) onError(new Error(`log platform responded ${res.status}`));
      })
      .catch((err) => onError(err));

  const flush = () => {
    if (queue.length === 0) return sending;
    const batch = queue;
    queue = [];
    sending = sending.then(() => send(batch));
    return sending;
  };

  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, intervalMs);
    if (typeof timer.unref === 'function') timer.unref(); // never keep the process alive
  };

  return {
    push(entry) {
      if (queue.length >= maxQueue) queue.shift(); // drop oldest rather than grow without bound
      queue.push(entry);
      if (queue.length >= batchSize) flush();
      else schedule();
    },
    flush,
  };
}

module.exports = { createHttpShipper };
