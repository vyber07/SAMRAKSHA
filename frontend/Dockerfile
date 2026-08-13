# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and install
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner

# Copy build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with our SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx.conf server block
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
