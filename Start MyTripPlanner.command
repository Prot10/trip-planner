#!/bin/zsh
# MyTripPlanner — double-click launcher (macOS)
# installs dependencies on first run, builds, starts the local server, opens the browser
cd "$(dirname "$0")"
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"

if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "Node.js not found" message "Install Node.js 20.19 or newer from nodejs.org, then double-click this file again."'
  exit 1
fi

[ -d node_modules ] || npm install
npm run build

if ! lsof -nP -iTCP:5200 -sTCP:LISTEN >/dev/null 2>&1; then
  (node server/index.mjs >/dev/null 2>&1 &)
fi
sleep 1
open "http://localhost:5200"
