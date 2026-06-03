#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"

nvm install 22
nvm use 22

cd "$(dirname "$0")/.."

# Native bindings (rolldown) must be installed inside WSL/Linux
if [ ! -d node_modules/vite ] || [ ! -f node_modules/vite/node_modules/rolldown/package.json ]; then
  echo "Installing dependencies in WSL (Linux native modules)..."
  npm install
fi

echo ""
echo "Vite dev server starting..."
echo "Open: http://localhost:5173/"
echo ""

npm run dev -- --host 0.0.0.0 --port 5173
