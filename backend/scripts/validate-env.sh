#!/usr/bin/env bash
# scripts/validate-env.sh
# Run before deploying to ensure all required variables are set.
# Usage: bash scripts/validate-env.sh

set -euo pipefail

ENV_FILE="${1:-.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌  Environment file not found: $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

REQUIRED=(
  NODE_ENV
  PORT
  MONGODB_URI
  JWT_ACCESS_SECRET
  JWT_REFRESH_SECRET
  FIELD_ENCRYPTION_KEY
  CLIENT_URL
)

MISSING=()

for VAR in "${REQUIRED[@]}"; do
  if [[ -z "${!VAR:-}" ]]; then
    MISSING+=("$VAR")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "❌  Missing required environment variables:"
  for VAR in "${MISSING[@]}"; do
    echo "    • $VAR"
  done
  exit 1
fi

if [[ -z "${GEMINI_API_KEY:-}" && -z "${OPENAI_API_KEY:-}" ]]; then
  echo "❌  Set either GEMINI_API_KEY or OPENAI_API_KEY so the AI coach can use a real provider."
  exit 1
fi

# Validate FIELD_ENCRYPTION_KEY length (must be exactly 32 chars)
KEY_LEN=${#FIELD_ENCRYPTION_KEY}
if [[ $KEY_LEN -ne 32 ]]; then
  echo "❌  FIELD_ENCRYPTION_KEY must be exactly 32 characters (got $KEY_LEN)"
  exit 1
fi

echo "✅  All required environment variables are set."
