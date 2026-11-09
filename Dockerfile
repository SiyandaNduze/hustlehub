# ---- HustleHub API (Node + Express over HTTPS) --------------------------------
FROM node:26-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Production dependencies only. `npm ci` when a lockfile exists (reproducible), else `npm install`.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:26-alpine
# openssl: the entrypoint creates a self-signed certificate on first start
RUN apk add --no-cache openssl
ENV NODE_ENV=production \
    PORT=5443 \
    DATA_DIR=/data \
    LOG_DIR=/logs \
    SSL_KEY_PATH=/app/certs/key.pem \
    SSL_CERT_PATH=/app/certs/cert.pem
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json server.js ./
COPY src ./src
COPY scripts ./scripts
COPY docker/backend-entrypoint.sh /usr/local/bin/entrypoint.sh
# Strip any Windows CR characters, make executable, and give the unprivileged user its writable dirs
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
 && chmod +x /usr/local/bin/entrypoint.sh \
 && mkdir -p /data /logs /app/certs \
 && chown -R node:node /data /logs /app/certs
USER node
EXPOSE 5443
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "require('https').get({host:'localhost',port:5443,path:'/api/health',rejectUnauthorized:false},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
