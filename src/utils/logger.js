// Structured (JSON-lines) logger.
//   * console (stdout)   -> `docker logs`, local debugging
//   * file (LOG_DIR)     -> persistent audit trail
//   * HTTPS shipper      -> cloud log platform (LOG_HTTP_URL / LOG_HTTP_TOKEN)
// Secrets are redacted before anything is written, and e-mail addresses are masked.
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { createHttpShipper } = require('./logShipper');

const LEVELS = new Map([
  ['debug', 10],
  ['info', 20],
  ['warn', 30],
  ['error', 40],
]);
const SENSITIVE_KEY = /^(password|confirmpassword|passwordhash|token|authorization|secret|jwt|cookie|set-cookie)$/i;

function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) return '[invalid]';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

function redact(value, depth = 0) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) return depth > 6 ? '[truncated]' : value.map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    if (depth > 6) return '[truncated]';
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? '[REDACTED]' : redact(v, depth + 1)])
    );
  }
  return value;
}

function createLogger({ level = env.logLevel, sinks = [], base = {} } = {}) {
  const threshold = level === 'silent' ? Infinity : (LEVELS.get(level) ?? LEVELS.get('info'));

  function write(lvl, event, fields = {}) {
    if (LEVELS.get(lvl) < threshold) return;
    const entry = {
      dt: new Date().toISOString(),
      level: lvl,
      event,
      message: typeof fields.message === 'string' ? fields.message : event,
      ...base,
      ...redact(fields),
    };
    for (const sink of sinks) {
      try {
        sink(entry);
      } catch {
        // a failing sink must never break the request that triggered the log
      }
    }
  }

  // Context (requestId, ip, userId) is read when the log is written, so it
  // includes the user once authentication has run.
  const forRequest = (req) => {
    const ctx = () => ({
      requestId: req.id,
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: req.user ? req.user.id : undefined,
    });
    return {
      debug: (event, f) => write('debug', event, { ...ctx(), ...f }),
      info: (event, f) => write('info', event, { ...ctx(), ...f }),
      warn: (event, f) => write('warn', event, { ...ctx(), ...f }),
      error: (event, f) => write('error', event, { ...ctx(), ...f }),
    };
  };

  return {
    debug: (event, f) => write('debug', event, f),
    info: (event, f) => write('info', event, f),
    warn: (event, f) => write('warn', event, f),
    error: (event, f) => write('error', event, f),
    forRequest,
  };
}

// ---- default application logger -------------------------------------------
const sinks = [];
let shipper = null;

if (env.logLevel !== 'silent') {
  sinks.push((entry) => process.stdout.write(`${JSON.stringify(entry)}\n`));

  if (env.logToFile) {
    try {
      const dir = path.resolve(env.logDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- configured directory
      fs.mkdirSync(dir, { recursive: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- configured directory
      const stream = fs.createWriteStream(path.join(dir, 'app.log'), { flags: 'a' });
      stream.on('error', () => {});
      sinks.push((entry) => stream.write(`${JSON.stringify(entry)}\n`));
    } catch (err) {
      process.stderr.write(`Log file disabled: ${err.message}\n`);
    }
  }

  shipper = createHttpShipper({
    url: env.logHttpUrl,
    token: env.logHttpToken,
    onError: (err) => process.stderr.write(`[log-shipper] ${err.message}\n`),
  });
  if (shipper) sinks.push((entry) => shipper.push(entry));
}

const logger = createLogger({ sinks, base: { service: env.serviceName, env: env.nodeEnv } });
logger.flush = () => (shipper ? shipper.flush() : Promise.resolve());
logger.cloudEnabled = Boolean(shipper);

module.exports = logger;
module.exports.createLogger = createLogger;
module.exports.maskEmail = maskEmail;
module.exports.redact = redact;
