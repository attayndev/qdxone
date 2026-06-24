# syntax=docker/dockerfile:1
# Multi-stage build for a Next.js (standalone) app on Fly.io.
# Runs the full Node.js runtime, so proxy.ts middleware works unchanged.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# ---- deps: install node_modules from the lockfile ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the app ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are INLINED into the client bundle at build time, so
# they must be present during `next build`. These are all PUBLIC values (URLs +
# the Supabase anon key, which ships to every browser anyway), so we bake them
# in as defaults — Cloudflare Containers builds this image directly, no build-arg
# plumbing required. Override per-build with `--build-arg` if ever needed.
#
# Server-only secrets (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, Resend,
# Telnyx, etc.) are deliberately NOT here — they're injected at RUNTIME from the
# Worker env into the container (see worker/index.ts) and never baked in.
#
# ↓↓↓ PASTE YOUR REAL SUPABASE ANON KEY (the public eyJ... browser key) ↓↓↓
ARG NEXT_PUBLIC_ROOT_DOMAIN="qdx.one"
ARG NEXT_PUBLIC_APP_URL="https://qdx.one"
ARG NEXT_PUBLIC_SUPABASE_URL="https://tctukuzzjxihmqqeoifz.supabase.co"
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_TOQOaltFGXMXBWNsyCM5YA_sszRKczH"
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- runner: minimal production image ----
FROM base AS runner
WORKDIR /app
# NEXT_PUBLIC_* are inlined into the bundle at BUILD time, but some server code
# reads them via a DYNAMIC lookup (process.env[name], e.g. requireEnv) which
# Next does NOT inline — so they must ALSO exist in the RUNTIME env here, or
# createClient() throws "Missing required env var" at request time. Public
# values, safe to bake.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_PUBLIC_ROOT_DOMAIN="qdx.one" \
    NEXT_PUBLIC_APP_URL="https://qdx.one" \
    NEXT_PUBLIC_SUPABASE_URL="https://tctukuzzjxihmqqeoifz.supabase.co" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_TOQOaltFGXMXBWNsyCM5YA_sszRKczH"

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output: server.js + the traced node_modules subset, plus the
# static assets and public/ folder it serves.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
