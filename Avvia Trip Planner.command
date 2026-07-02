#!/bin/zsh
# Avvia il Trip Planner: serve la build e apre il browser
cd "$(dirname "$0")"
PORT=8741
[ -d dist ] || npm run build
if ! lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  (cd dist && python3 -m http.server $PORT >/dev/null 2>&1 &)
  sleep 1
fi
open "http://localhost:$PORT"
