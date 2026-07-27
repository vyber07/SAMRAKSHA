# --- Build stage ---
# node:20-alpine is LTS — update periodically for OS-level security patches
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Use ci for reproducible installs from lockfile
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# --- Serve stage ---
# nginx:stable-alpine — pinned to stable channel for security-patched nginx releases
# Update this tag periodically: https://hub.docker.com/_/nginx/tags?name=stable-alpine
FROM nginx:stable-alpine
# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# nginx runs as root to bind :80; drop privileges via nginx worker_processes
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
