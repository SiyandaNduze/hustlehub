// Tiny file-backed collection (stand-in for MongoDB collections).
// Controllers only use this interface, so swapping in Mongoose later is a
// contained change. DATA_DIR lets Docker keep the data on a named volume.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');

const DATA_DIR = env.dataDir ? path.resolve(env.dataDir) : path.join(__dirname, '..', 'data');

function createCollection(fileName) {
  // The path is built from a constant file name and a configured directory,
  // never from request data, so non-literal fs paths are safe here.
  const file = path.join(DATA_DIR, fileName);

  const all = () => {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- server-controlled path
      return JSON.parse(fs.readFileSync(file, 'utf-8') || '[]');
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(`Failed to read ${fileName}:`, err.message);
      return [];
    }
  };

  const save = (items) => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- server-controlled path
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- server-controlled path
    fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf-8');
  };

  return {
    all,
    findById: (id) => all().find((item) => item.id === id),
    filter: (predicate) => all().filter(predicate),
    // `options` is for trusted internal callers only (ledger, demo seeding):
    // request bodies are never spread into it.
    insert(data, options = {}) {
      const items = all();
      const item = {
        ...data,
        id: options.id || crypto.randomUUID(),
        createdAt: options.createdAt || new Date().toISOString(),
      };
      save([...items, item]);
      return item;
    },
    update(id, patch) {
      let updated = null;
      const next = all().map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...patch, id, updatedAt: new Date().toISOString() };
        return updated;
      });
      if (!updated) return null;
      save(next);
      return updated;
    },
    remove(id) {
      const items = all();
      const next = items.filter((item) => item.id !== id);
      if (next.length === items.length) return false;
      save(next);
      return true;
    },
  };
}

module.exports = { createCollection };
