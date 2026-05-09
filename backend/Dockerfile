# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm ci
COPY . .
RUN npm run build

# ─── Production image ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -S fitrack && adduser -S fitrack -G fitrack
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --ignore-scripts

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
USER fitrack
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "dist/server.js"]
