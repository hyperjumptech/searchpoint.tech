# -----------------------------------------------------------------------------
# Multi-stage build:
#   - Bun is used only for dependency installation and building.
#   - The production runtime uses Node.js 24 LTS (pinned to the security release
#     from 21 October 2026: 24.22.1) to inherit the upstream security fixes.
#   - Next.js runs from its standalone output via `node server.js`.
# -----------------------------------------------------------------------------

ARG BUN_VERSION=1.3.14
ARG NODE_VERSION=24.22.1

# Use Bun's official image for install/build tooling
FROM oven/bun:${BUN_VERSION}-alpine AS base

WORKDIR /app

# Install dependencies with bun
FROM base AS deps
COPY package.json bun.lock* ./
COPY patches ./patches
RUN bun install --no-save --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Production image: run the standalone server on Node.js 24 LTS
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "./server.js"]
