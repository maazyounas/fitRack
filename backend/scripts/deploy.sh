#!/usr/bin/env bash
# scripts/deploy.sh
# Full production deployment on a Linux server (EC2 / Render / VPS).
# Usage: bash scripts/deploy.sh

set -euo pipefail

echo "🚀  Starting FITRACK backend deployment at $(date)"

# 1. Validate environment
bash scripts/validate-env.sh .env.production

# 2. Install production dependencies
echo "📦  Installing dependencies..."
npm ci --only=production

# 3. Build TypeScript
echo "🔨  Building TypeScript..."
npm run build

# 4. Ensure log directory exists
mkdir -p logs

# 5. Start / reload with PM2
if pm2 describe fitrack-backend > /dev/null 2>&1; then
  echo "🔄  Reloading PM2 process (zero-downtime)..."
  pm2 reload pm2/ecosystem.config.js --env production
else
  echo "▶️   Starting PM2 process..."
  pm2 start pm2/ecosystem.config.js --env production
fi

# 6. Save PM2 process list (survives reboots)
pm2 save

echo "✅  Deployment complete at $(date)"
pm2 ls
