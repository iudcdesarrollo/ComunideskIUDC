# ──────────────────────────────────────────────────────────
# ComuniDesk IUDC — Backend (Express + Prisma)
# ──────────────────────────────────────────────────────────

# Stage 1: Install dependencies and generate Prisma Client
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (better caching)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for prisma CLI)
RUN npm ci

# Generate Prisma Client with the correct binary for Alpine Linux
RUN npx prisma generate

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl (required by Prisma at runtime on Alpine)
RUN apk add --no-cache openssl

# Copy only production node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY . .

# Ensure entrypoint script is executable
RUN chmod +x docker-entrypoint.sh

# Remove dev files from the final image
RUN rm -rf src/tests vitest.config.js

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
