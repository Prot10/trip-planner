@echo off
rem Trip Planner - double-click launcher (Windows)
rem installs dependencies on first run, builds, starts the local server, opens the browser
title Trip Planner
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install Node.js 20.19 or newer from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

if not exist node_modules call npm install
call npm run build

netstat -ano | findstr ":5200" | findstr "LISTENING" >nul
if errorlevel 1 start "Trip Planner server" /min cmd /c "node server\index.mjs"

timeout /t 2 /nobreak >nul
start "" http://localhost:5200
