# Trip Planner

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Free APIs only](https://img.shields.io/badge/APIs-100%25_free-22c55e)](#tech-stack)

A polished, self-hosted road-trip planner. Build day-by-day itineraries with a drag-and-drop timeline, see the whole route as one continuous loop on an interactive map, track your budget per category, and get Google-Maps-style directions — all powered exclusively by **free APIs**, with no accounts and no keys.

**[Website](https://prot10.github.io/trip-planner/)** · **[Live demo](https://prot10.github.io/trip-planner/demo/)** — the real app in your browser, with a scripted Ulisse that interviews you and builds an Iceland itinerary in front of your eyes. Nothing to install.

Ships pre-loaded with a real 7-day / 6-night California loop (Pasadena → Big Sur → San Francisco → Yosemite → Sequoia → Pasadena), complete with timings, drive legs, nightly hotels, entry fees, practical warnings and official booking links.

![Trip planner](docs/planner.png)

## Features

### AI travel assistant — Ulisse
- **Agent-built trips** — a new trip starts as a full-screen conversation: Ulisse interviews you **one interactive question card at a time** (single choice, multi choice or free text), confirms a brief, then **researches online and builds the entire itinerary live** — a progress stepper shows each phase while days, stops, transfers and hotels appear in real time, ending with a summary and concrete improvement proposals. Anti-hallucination rules: coordinates only from geocoding, transfer durations from real routing, opening hours/prices verified via web search with cited sources.
- **A live notebook** — Ulisse takes structured notes after every single answer (enforced at the tool layer, not just prompted) and the notebook card fills in next to the chat in real time; it is re-injected on every turn as persistent per-trip memory, for both engines.
- **Trip currency** — pick EUR or USD before the first message; every price in the app and in the agent's work uses it (the fuel estimate converts through a daily-refreshed exchange rate).
- **@-mentions** — type `@` in the chat to tag any activity from a live-filtered menu: it becomes an inline chip and the agent receives the exact item id, so instructions like "move @Louvre after lunch" are unambiguous.
- **Upfront plan** — when building starts, the whole todo-list appears immediately in a sticky stepper (pending → running → done), with a large animated globe in the itinerary while the first stops are being researched; the map opens already centered on the chosen destination.
- **Multi-modal transport** — every transfer has a mode (car, walk, bus, train, plane, ferry) with its own icon; car/bus legs follow real roads, walking uses pedestrian routing, trains/flights/ferries are drawn as dashed lines; the fuel estimate only appears when a car is involved.
- **In-app chat** (floating panel over the map on desktop, its own tab on mobile) with **two subscription-powered engines**: Claude (Agent SDK, Pro/Max login) and **Codex** (OpenAI Codex CLI, ChatGPT sign-in). No API keys. A custom system prompt turns them into travel-planning experts, restricted to 20+ purpose-built trip tools plus web search for fresh info (no file or shell access).
- **One-click guided sign-in** — if an engine isn't connected, the chat shows a card with a single button: the local server runs the CLI login for you (the browser consent page opens by itself; Claude additionally asks to paste back a one-time code) and your message is retried automatically on success. A terminal fallback stays available.
- **Model lists that never go stale** — the ChatGPT model picker mirrors the Codex CLI's own model cache (stale saved choices self-heal), while Claude's aliases (Sonnet/Opus/Haiku) always resolve to the newest model of each family — the picker shows the exact model id currently behind the alias.
- The agent can read the whole trip, **add / edit / move / remove activities and days**, set dates and budgets, search real places (never inventing coordinates), toggle curated suggestions, and place new stops at the **route-optimal position**.
- Every tool call is executed **in the browser against the live store**, so each edit appears instantly in the timeline (with a highlight flash). The per-turn review panel lists **every single change with a field-level diff and a mini route-map preview**, each individually revertible — or undo the whole turn at once.
- **Conversations are saved per trip** and can be reopened later with their full agent context (session resume), streamed token-by-token with markdown and photo carousels in replies.
- Architecture: a small local Node server (`server/`) bridges both engines to the open tab over WebSocket; the browser stays the source of truth. The same 18 tools are also exposed as a standard **MCP server over HTTP** (`/mcp`) — Codex consumes it today, and any MCP client (Claude Desktop, ChatGPT connectors) can use it tomorrow.

### Itinerary
- **Multi-trip dashboard** — create, duplicate, delete and import trips; each card shows a cover photo, dates, stop count and estimated distance and budget.
- **Day-by-day timeline** with five activity types (stop, drive, food, hotel, info), times, durations, notes, multiple links, must-see flags and check-off during the trip.
- **Smooth drag & drop** to reorder activities, including across days (dnd-kit).
- **Calendar-aware days** — pick a start date in a custom calendar popover that highlights the whole trip span; every day card shows its real date.
- **Pre-trip checklist** with progress bar, seeded with the critical bookings and road-condition checks.

### Map
- **One continuous route** — every day's leg starts where the previous one ended, drawn on **real roads** (OSRM routing, cached locally) and color-coded per day with numbered pins. No leg is invented: the trip only loops back if the itinerary itself ends at the start (Ulisse asks whether you want a round trip or a one-way route).
- **Place search** (Nominatim) with one-click *"Add to trip"* that inserts the stop **at the route-optimal position** — the gap that adds the fewest extra kilometres.
- **Directions like Google Maps** — pick A and B by search, by clicking the map, or from any trip pin: blue route overlay, duration, distance and localized turn-by-turn steps, in a panel that expands with a smooth animation.
- **Clickable route legs** — click any leg (solid or dashed) for a popup with the transport mode, day, endpoints, real distance and estimated duration, plus a *"show in itinerary"* jump that highlights the matching entry.
- **Places layer** — a "Luoghi" layer shows the trip's stops and Ulisse's extra suggestions as category-colored pins (attractions, museums, restaurants, cafés, hotels, nature): pick the categories, filter by source (all / in the itinerary / suggestions) and activate any suggested place straight from its popup, inserted at the route-optimal point.
- Per-day filtering, fly-to from any activity, and deep links into the real Google Maps for navigation.

### Budget
- **Cost field on every activity** (nightly price on hotels, tickets/parking/tolls elsewhere), with a chip on each card.
- **Budget badge** in the header showing the grand total; hover or click reveals a breakdown by category — hotels, food, activities, extras and an **automatic fuel estimate** computed from the real road distance and your car's settings.
- **Your car, for real** — set make and model (a photo of the car appears via Wikipedia), consumption, and the pump price **in the local unit** ($/gal, $/L or €/L with a daily-refreshed EUR/USD rate); one button asks Ulisse to research the current average fuel price at the destination and fill everything in.

### Photos
- **Automatic imagery** — every located stop shows photos of the nearest Wikipedia articles (free geosearch API, lazily fetched and cached), browsable in a **carousel** inside each activity's detail card.
- **Personal galleries** — drag & drop photos from your computer into the editor (compressed client-side, saved as real files in your data folder), add by URL, remove, pick the cover, or opt out of the automatic photos per activity.

### Suggestions
- A per-trip catalog of extra stops with photos, notes and links — Ulisse fills it with the good ideas that didn't make the itinerary. A single toggle inserts each one **automatically at the optimal point of the route** (with the estimated detour in km) — and removes it just as cleanly.

### Sharing
- **Export / import JSON** — your own photos are inlined into the export, so the file you send carries everything. Data lives in your own local folder (see *Your data*) plus a fast browser cache; nothing ever leaves your machine.

### Languages
- **Fully internationalized** (i18next): Italian and English out of the box, picked from the browser on first visit and switchable anytime from the language selector (dashboard, planner header, interview composer). Dates, numbers and currencies follow the locale (`it-IT` / `en-US`).
- **Ulisse speaks your language natively** — the system prompts, the interview, the notebook and every suggestion exist per language (`server/prompts/<lang>/`), and even the demo trip ships in both languages. Adding a language = one locale JSON + one prompts folder + one registry entry.

![Dashboard](docs/dashboard.png)

## Tech stack

| | |
|---|---|
| UI | React 19 · Tailwind CSS 4 · lucide-react |
| i18n | i18next · react-i18next (it/en, extensible) |
| State | zustand (persisted, versioned migrations) |
| Map | Leaflet / react-leaflet · CARTO Voyager tiles |
| Drag & drop | dnd-kit |
| Build | Vite |

**Free services used at runtime** (no keys, no accounts): OpenStreetMap/CARTO tiles, [Nominatim](https://nominatim.org) geocoding, [OSRM](http://project-osrm.org) routing & directions, Wikipedia geosearch for imagery. All responses are cached client-side to stay polite with the public endpoints.

## Getting started

The only prerequisite is **Node.js ≥ 20.19** (an `.nvmrc` is included). Every CLI the AI agent needs (Claude Code, Codex) is pinned by npm — nothing else to install.

```sh
git clone https://github.com/Prot10/trip-planner.git
cd trip-planner
npm install
npm start        # builds the app and serves everything at http://localhost:5200
```

That's it: one port runs the web app, the agent WebSocket and the MCP endpoint.

For development, with hot reload:

```sh
npm run dev      # Vite dev server (http://localhost:5199) + agent server (5200)
```

### No terminal: double-click to launch

Prefer not to touch a terminal? The repo ships a launcher per platform — double-click it and it installs the dependencies (first run only), builds, starts the local server and opens the browser:

| Platform | File |
|---|---|
| macOS | `Start Trip Planner.command` |
| Windows | `Start Trip Planner.bat` |
| Linux | `start-trip-planner.sh` |

The only prerequisite is still Node.js — if it's missing, the launcher tells you instead of failing silently. Launching twice is safe: an already-running server is reused.

### Install it as a desktop app

Trip Planner is an installable web app (PWA). With the server running, open it in Chrome or Edge and click the **Install** icon in the address bar (or *menu → Install Trip Planner*): you get a standalone window with its own dock/taskbar icon, like a native app. From then on: double-click the launcher (starts the server), then open the installed app.

### Docker

```sh
docker compose up --build    # http://localhost:5200
```

The data folder is bind-mounted (`~/Documents/Ulisse` by default), so the container reads and writes the same files as a local run. One caveat: the guided **Claude** sign-in works fully inside Docker (open the link, paste the code); the **ChatGPT/Codex** OAuth callback can't reach into a container, so log in once on the host (`npx codex login`) and uncomment the `~/.codex` mount in `docker-compose.yml`.

### Your data

Everything lives in a folder you own — by default **`Documents/Ulisse`** (resolved per platform and language: on Windows the real Documents folder is asked to the system, OneDrive redirection included; on Linux the localized XDG folder, e.g. `~/Documenti`, is used):

```
Documents/Ulisse/
  trips/weekend-in-rome--abc123.json   one readable JSON per trip
  images/i8f3ka9x2c4e.webp             your photos, as real files
  chats/abc123.json                    saved conversations with Ulisse
  auth.json                            sign-in token
```

The folder is created automatically on first launch — zero questions asked; a one-time toast tells you where it is. Delete a trip file and the trip is gone; delete the folder and the app starts fresh. Change the location anytime from the dashboard footer — pointing it at an existing Ulisse folder adopts it, e.g. a restored backup. The browser keeps a fast local copy, so the app opens instantly and works even if the local server is briefly down; everything reconciles to disk automatically. `ULISSE_DATA_DIR` overrides the folder via environment.

Note for Windows: storage and the app itself work; the one-click guided *Claude* sign-in currently relies on a Unix pty, so on Windows run `npx claude setup-token` in a terminal instead.

### AI assistant prerequisites

A **Claude subscription** (Pro/Max) and/or a **ChatGPT subscription** (Plus) — no API keys. You don't need the terminal: the first time an engine isn't connected the chat offers a **one-click guided sign-in** that drives the CLI login for you (the CLIs themselves ship with the repo's npm dependencies). The agent server reuses those logins — a personal, self-hosted setup; usage counts against your plans' limits. Without them, the whole app works normally and the chat reports what's missing.

Ports are configurable: `AGENT_PORT` for the agent server, `VITE_AGENT_PORT` to point the web app at it (both default to 5200).

## Project structure

```
src/
  App.jsx                  layout, tabs, overlays
  store.js                 zustand stores: trips (persisted + migrations), routes, UI
  data/
    seed.it.json           the pre-loaded California itinerary (incl. its suggestions)
    seed.en.json           the same demo trip, English edition
  i18n/
    index.js               i18next init, browser detection, persisted choice
    langs.js               language registry (add a language here)
  locales/
    it/common.json         every UI string, Italian (source language)
    en/common.json         every UI string, English
  lib/
    utils.js               dates, durations, costs, fuel units, trip normalization
    storageSync.js         browser <-> disk sync (hydrate, debounced write-through)
    storageClient.js       /storage API wrappers
    geo.js                 haversine, optimal insertion, OSRM routing & turn-by-turn
    imgdb.js               photo upload to disk (IndexedDB fallback), compression, portable export
    fx.js                  daily-cached EUR/USD rate for fuel prices
  agent/
    socket.js              WebSocket client, chat store, saved chats, guided auth
    toolExecutors.js       agent tools executed against the live store, per-edit undo
  components/
    Dashboard.jsx          multi-trip home
    Header.jsx             title, stats, budget breakdown, car settings, export/import
    ItineraryPanel.jsx     day list + cross-day drag & drop
    DayCard.jsx            day header + timeline
    ItemCard.jsx           activity card with chips, links, photo thumb
    ItemDetail.jsx         detail card with photo carousel
    ItemEditor.jsx         full editor: gallery, cost, links, location search
    DayEditor.jsx          day title, night stop, color
    MapPanel.jsx           map, road routes, place search, directions
    Suggestions.jsx        toggleable curated stops
    Checklist.jsx          pre-trip checklist
    DatePicker.jsx         calendar popover with trip-range highlight
    ItemImage.jsx          Wikipedia + personal photo resolution
    InterviewView.jsx      full-screen interview with gliding composer + live notebook
    QuestionCard.jsx       interactive one-question-at-a-time answer cards
    ChatPanel.jsx          in-app agent chat (stream, edits review, saved chats)
    chatShared.jsx         tool chips, model picker, guided sign-in cards
    LanguageSwitcher.jsx   language picker popover
    PoiLayer.jsx           category pins for trip stops and suggestions
server/
  index.mjs                local agent server (WebSocket + MCP over HTTP)
  storage.mjs              the on-disk data folder: trips/photos/chats as files
  agent.mjs                Claude Agent SDK + Codex CLI engines, dynamic models
  auth.mjs                 guided in-app sign-in flows for both engines
  bridge.mjs               browser bridge: tool calls in, live edits out
  tools.mjs                shared tool definitions (SDK + MCP)
  prompts/<lang>/          persona, interview and planning rules, per language
  codex-workspace/<lang>/  AGENTS.md generated at boot from the prompts
```

## Notes

- The itinerary and all edits live in your own data folder (see *Your data*), with the browser as a fast cache. Use **Export** to share a trip; the recipient imports the file and sees exactly your plan, photos included.
- Road distances and the fuel estimate refine themselves progressively as OSRM answers; straight dashed lines are shown as a fallback if routing is unavailable.

## Support

If this project is useful to you, consider supporting its development:

- ☕ [Buy Me a Coffee](https://buymeacoffee.com/prot10)
- 💛 [PayPal](https://paypal.me/andreaprotani99)

## License

This project is licensed under the **GNU Affero General Public License v3.0** — see [LICENSE](LICENSE).

In short: you are free to use, study, modify and share it, but any distributed or network-served derivative **must remain open source under the same license**. This deliberately prevents closed-source commercial repackaging.
