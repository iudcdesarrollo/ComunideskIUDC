# ──────────────────────────────────────────────────────────
# ComuniDesk IUDC — Railway Deployment (Single Service)
# Frontend (Vite) + Backend (Express + Prisma)
# ──────────────────────────────────────────────────────────

# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend

WORKDIR /app/frontend
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Setup backend + serve frontend
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy backend dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY server/prisma ./prisma/
RUN npx prisma generate

# Copy backend source
COPY server/src ./src/

# Copy entrypoint
COPY server/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy built frontend from stage 1
COPY --from=frontend /app/frontend/dist ./dist/

# Railway provides PORT env var
EXPOSE ${PORT:-3001}

ENTRYPOINT ["./docker-entrypoint.sh"]
