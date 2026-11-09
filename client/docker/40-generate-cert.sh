#!/bin/sh
# nginx image runs every executable /docker-entrypoint.d/*.sh before starting nginx.
set -e
mkdir -p /etc/nginx/certs
if [ ! -f /etc/nginx/certs/tls.crt ]; then
  echo "[cert] generating self-signed certificate for localhost"
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout /etc/nginx/certs/tls.key -out /etc/nginx/certs/tls.crt -days 365 \
    -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi
