#!/bin/sh
set -e

echo "========================================="
echo "  ComuniDesk IUDC — Backend Startup"
echo "========================================="

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
