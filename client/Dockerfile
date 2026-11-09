# ---- HustleHub frontend: build the React app, serve it with nginx over HTTPS ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache openssl curl
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/security-headers.conf
COPY docker/40-generate-cert.sh /docker-entrypoint.d/40-generate-cert.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-generate-cert.sh /etc/nginx/conf.d/default.conf /etc/nginx/security-headers.conf \
 && chmod +x /docker-entrypoint.d/40-generate-cert.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 443
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD curl -kfs https://localhost/ -o /dev/null || exit 1
