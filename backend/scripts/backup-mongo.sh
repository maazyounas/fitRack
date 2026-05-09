#!/usr/bin/env bash
# scripts/backup-mongo.sh
# Creates a gzipped mongodump and uploads it to S3.
# Run via cron: 0 3 * * * /app/scripts/backup-mongo.sh >> /app/logs/backup.log 2>&1

set -euo pipefail

# ─── Config ─────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fitrack_${TIMESTAMP}.gz"
TMP_DIR="/tmp/fitrack-backup-${TIMESTAMP}"
S3_PATH="s3://${S3_BUCKET_NAME}/mongo-backups/${BACKUP_NAME}"

# ─── Validate dependencies ───────────────────────────────────────────────────
command -v mongodump >/dev/null 2>&1 || { echo "❌  mongodump not found"; exit 1; }
command -v aws >/dev/null 2>&1       || { echo "❌  aws-cli not found"; exit 1; }

echo "🔵  Starting backup at $(date)"

# ─── Dump ───────────────────────────────────────────────────────────────────
mkdir -p "$TMP_DIR"
mongodump \
  --uri="${MONGODB_URI}" \
  --gzip \
  --archive="${TMP_DIR}/${BACKUP_NAME}"

echo "✅  Dump complete: ${BACKUP_NAME} ($(du -sh "${TMP_DIR}/${BACKUP_NAME}" | cut -f1))"

# ─── Upload ─────────────────────────────────────────────────────────────────
aws s3 cp "${TMP_DIR}/${BACKUP_NAME}" "$S3_PATH" \
  --region "${AWS_REGION:-us-east-1}" \
  --storage-class STANDARD_IA

echo "✅  Uploaded to ${S3_PATH}"

# ─── Cleanup ────────────────────────────────────────────────────────────────
rm -rf "$TMP_DIR"

# ─── Prune old backups (keep last 30 days) ──────────────────────────────────
CUTOFF=$(date -d "30 days ago" +%Y%m%d 2>/dev/null || date -v-30d +%Y%m%d)
aws s3 ls "s3://${S3_BUCKET_NAME}/mongo-backups/" \
  | awk '{print $4}' \
  | grep "^fitrack_" \
  | while read -r file; do
      FILE_DATE=$(echo "$file" | grep -oP '\d{8}')
      if [[ "$FILE_DATE" < "$CUTOFF" ]]; then
        aws s3 rm "s3://${S3_BUCKET_NAME}/mongo-backups/${file}" \
          --region "${AWS_REGION:-us-east-1}"
        echo "🗑️   Pruned old backup: $file"
      fi
    done

echo "🟢  Backup job finished at $(date)"
