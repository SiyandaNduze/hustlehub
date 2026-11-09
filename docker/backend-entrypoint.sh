#!/bin/sh
# Container start-up: create a TLS certificate if none exists, seed the admin, run the API.
set -e

if [ ! -f "$SSL_KEY_PATH" ] || [ ! -f "$SSL_CERT_PATH" ]; then
  echo "[entrypoint] generating self-signed certificate"
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$SSL_KEY_PATH" -out "$SSL_CERT_PATH" -days 365 \
    -subj "/CN=backend" -addext "subjectAltName=DNS:backend,DNS:localhost"
fi

if [ -n "$ADMIN_PASSWORD" ]; then
  node scripts/seedAdmin.js || echo "[entrypoint] admin seeding skipped"
fi

exec node server.js
