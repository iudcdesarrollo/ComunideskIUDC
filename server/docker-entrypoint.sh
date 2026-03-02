#!/bin/sh
set -e

echo "========================================="
echo "  ComuniDesk IUDC — Backend Startup"
echo "========================================="

# ─── Wait for database ────────────────────────────────
echo "⏳ Waiting for database to be ready..."
for i in $(seq 1 30); do
  if echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1; then
    echo "✅ Database connection established"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "❌ Database not reachable after 60 seconds. Exiting."
    exit 1
  fi
  echo "   Retrying... ($i/30)"
  sleep 2
done

# ─── Run Prisma Migrations ────────────────────────────
echo ""
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy
echo "✅ Migrations applied successfully"

# ─── Seed Database (idempotent) ───────────────────────
echo ""
echo "🌱 Seeding database..."
npx prisma db seed || echo "⚠️  Seed skipped (may already be seeded)"

# ─── Start Server ─────────────────────────────────────
echo ""
echo "🚀 Starting ComuniDesk backend on port ${PORT:-3001}..."
exec node src/index.js
