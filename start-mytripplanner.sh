#!/bin/sh
# MyTripPlanner — launcher (Linux)
# installs dependencies on first run, builds, starts the local server, opens the browser
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node.js 20.19 or newer from https://nodejs.org and run this again."
  exit 1
fi

[ -d node_modules ] || npm install
npm run build

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:5200 -sTCP:LISTEN >/dev/null 2>&1; then
  : # already running
else
  nohup node server/index.mjs >/dev/null 2>&1 &
fi
sleep 1
xdg-open "http://localhost:5200" 2>/dev/null || echo "Open http://localhost:5200 in your browser."
