#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export NVM_DIR="${NVM_DIR:-$HOME/.config/nvm}"
export EXPO_NO_DEPENDENCY_VALIDATION="${EXPO_NO_DEPENDENCY_VALIDATION:-1}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # Load nvm so this command works even when the shell has not sourced it.
  # Expo 54/Metro needs Node 20+ because it uses Array.prototype.toReversed().
  unset npm_config_prefix
  . "$NVM_DIR/nvm.sh"
  nvm use 20 >/dev/null
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to run Expo." >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node $NODE_MAJOR is too old for Expo 54. Please use Node 20 or newer." >&2
  exit 1
fi

cd "$PROJECT_DIR"
exec npx expo start "$@"
