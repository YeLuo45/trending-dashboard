#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22
cd "$(dirname "$0")/.."
rm -rf node_modules
npm install
