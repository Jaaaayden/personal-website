# syntax=docker/dockerfile:1

# ---- Stage 1: install dependencies (cached until package*.json changes) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: build ----
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No secrets needed at build time: all env vars are read at request time and
# every feature degrades gracefully when unset.
RUN npm run build

# ---- Stage 3: minimal runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# The standalone bundle contains server.js plus a pruned node_modules
# (including sharp's linux-musl build, traced automatically by next build).
COPY --from=builder --chown=node:node /app/.next/standalone ./
# Standalone output does NOT include these two — copy them in manually:
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Built-in unprivileged user from the node image. --chown above lets the
# server write its runtime cache at /app/.next/cache.
USER node

EXPOSE 3000

# busybox wget ships with alpine; "/" is prerendered, so this is cheap and
# hits no external APIs.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/ || exit 1

# node (not npm) as PID 1 so SIGTERM reaches the server directly and Next's
# graceful-shutdown drain works.
CMD ["node", "server.js"]
