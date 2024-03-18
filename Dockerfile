# syntax=docker/dockerfile:1

# ---- deps: install with the lockfile only, so this layer caches ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: produce .next/standalone ----
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime: standalone server, non-root ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 tonearm \
 && adduser --system --uid 1001 --ingroup tonearm tonearm

# `output: 'standalone'` in next.config.mjs emits a server bundle with only the
# node_modules it actually needs; static assets are copied alongside it.
COPY --from=build --chown=tonearm:tonearm /app/.next/standalone ./
COPY --from=build --chown=tonearm:tonearm /app/.next/static ./.next/static
COPY --from=build --chown=tonearm:tonearm /app/public ./public

USER tonearm
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
