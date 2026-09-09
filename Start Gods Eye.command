#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# Prefer a supported installed Node, then the runtime bundled with Codex.
node_bin="$(command -v node || true)"
supported_node() {
  [[ -n "$1" ]] && "$1" -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit((major === 24 && minor >= 14) || major === 26 ? 0 : 1)' 2>/dev/null
}
if ! supported_node "$node_bin"; then
  node_bin="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if ! supported_node "$node_bin"; then
  echo 'Gods Eye needs Node 24.14+ (version 24) or Node 26. Install it, then reopen this launcher.'
  read -r -p 'Press Enter to close.'
  exit 1
fi
if [[ ! -f node_modules/vite/bin/vite.js ]]; then
  echo 'Dependencies are missing. Run npm ci with a supported Node version first.'
  read -r -p 'Press Enter to close.'
  exit 1
fi

# Block metered services, while allowing optional free-account keys in .env.
export GEV_FREE_ONLY=1 GOOGLE_MAPS_API_KEY='' OPENAI_API_KEY=''
export OPENSKY_AUTH_MODE=anon HOST=localhost PORT=4173
echo 'Gods Eye — free services mode: http://localhost:4173'
echo 'Keep this window open. Press Control-C to stop.'
exec "$node_bin" node_modules/vite/bin/vite.js --host localhost --port 4173 --strictPort --open
