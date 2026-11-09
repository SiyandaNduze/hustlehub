const fs = require('fs');
const https = require('https');
const path = require('path');

const env = require('./src/config/env');
const logger = require('./src/utils/logger');
const app = require('./src/app');

const keyPath = path.resolve(env.sslKeyPath);
const certPath = path.resolve(env.sslCertPath);

// eslint-disable-next-line security/detect-non-literal-fs-filename -- paths come from server config
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error(
    'SSL certificate/key not found.\n' +
      `Expected key at: ${keyPath}\n` +
      `Expected cert at: ${certPath}\n\n` +
      'Generate a local self-signed certificate first - see certs/README.md for the exact command.'
  );
  process.exit(1);
}

const sslOptions = {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths come from server config
  key: fs.readFileSync(keyPath),
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths come from server config
  cert: fs.readFileSync(certPath),
};

const server = https.createServer(sslOptions, app).listen(env.port, () => {
  logger.info('server.started', {
    port: env.port,
    nodeEnv: env.nodeEnv,
    cloudLogging: logger.cloudEnabled,
    trustProxy: env.trustProxy,
  });
});

// Last-resort handlers: log the failure (and flush cloud logs) before exiting
const crash = (event) => (err) => {
  logger.error(event, { err });
  logger.flush().finally(() => process.exit(1));
};
process.on('uncaughtException', crash('process.uncaught_exception'));
process.on('unhandledRejection', crash('process.unhandled_rejection'));

// Graceful shutdown (docker stop sends SIGTERM)
const shutdown = (signal) => () => {
  logger.info('server.stopping', { signal });
  server.close(() => logger.flush().finally(() => process.exit(0)));
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));
