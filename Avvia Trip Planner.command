#!/bin/zsh
# Avvia il Trip Planner: build servita in locale + agent server AI
cd "$(dirname "$0")"
PORT=8741
[ -d dist ] || npm run build
if ! lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  (cd dist && python3 -m http.server $PORT >/dev/null 2>&1 &)
fi
if ! lsof -nP -iTCP:5200 -sTCP:LISTEN >/dev/null 2>&1; then
  (node server/index.mjs >/dev/null 2>&1 &)
fi
sleep 1
open "http://localhost:$PORT"
