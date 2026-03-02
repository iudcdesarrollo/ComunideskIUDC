# ──────────────────────────────────────────────────────────
# ComuniDesk IUDC — Frontend (Vite React + nginx)
# ──────────────────────────────────────────────────────────

# Stage 1: Build the React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code (excluding server/ via .dockerignore)
COPY . .

# Build for production
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
