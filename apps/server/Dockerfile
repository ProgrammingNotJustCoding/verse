# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace configuration
COPY pnpm-workspace.yaml ./

# Copy all workspace packages
COPY packages ./packages

# Copy server app
COPY apps/server ./apps/server

# Copy lock file
COPY pnpm-lock.yaml ./

# Install dependencies
WORKDIR /app/apps/server
RUN pnpm install --frozen-lockfile

# Build the server application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy workspace packages
COPY packages ./packages

# Copy server package.json
COPY apps/server/package.json ./apps/server/

# Install production dependencies only
WORKDIR /app/apps/server
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/drizzle ./drizzle

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
