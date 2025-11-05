# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace configuration
COPY pnpm-workspace.yaml ./

# Copy all workspace packages
COPY packages ./packages

# Copy client app
COPY apps/client ./apps/client

# Copy lock file
COPY pnpm-lock.yaml ./

# Install dependencies
WORKDIR /app/apps/client
RUN pnpm install --frozen-lockfile

# Build the client application
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
