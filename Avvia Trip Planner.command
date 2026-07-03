#!/bin/zsh
# Launch Trip Planner: production build + AI agent server, one port for both
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
npm run build
if ! lsof -nP -iTCP:5200 -sTCP:LISTEN >/dev/null 2>&1; then
  (node server/index.mjs >/dev/null 2>&1 &)
fi
sleep 1
open "http://localhost:5200"
