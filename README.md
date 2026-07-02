# Trip Planner

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Free APIs only](https://img.shields.io/badge/APIs-100%25_free-22c55e)](#tech-stack)

A polished, fully client-side road-trip planner. Build day-by-day itineraries with a drag-and-drop timeline, see the whole route as one continuous loop on an interactive map, track your budget per category, and get Google-Maps-style directions — all powered exclusively by **free APIs**, with no accounts and no keys.

Ships pre-loaded with a real 7-day / 6-night California loop (Pasadena → Big Sur → San Francisco → Yosemite → Sequoia → Pasadena), complete with timings, drive legs, nightly hotels, entry fees, practical warnings and official booking links.

![Trip planner](docs/planner.png)

## Features

### Itinerary
- **Multi-trip dashboard** — create, duplicate, delete and import trips; each card shows a cover photo, dates, stop count and estimated distance and budget.
- **Day-by-day timeline** with five activity types (stop, drive, food, hotel, info), times, durations, notes, multiple links, must-see flags and check-off during the trip.
- **Smooth drag & drop** to reorder activities, including across days (dnd-kit).
- **Calendar-aware days** — pick a start date in a custom calendar popover that highlights the whole trip span; every day card shows its real date.
- **Pre-trip checklist** with progress bar, seeded with the critical bookings and road-condition checks.

### Map
- **One continuous round trip** — every day's leg starts where the previous one ended and the loop closes back at the origin, drawn on **real roads** (OSRM routing, cached locally) and color-coded per day with numbered pins.
- **Place search** (Nominatim) with one-click *"Add to trip"* that inserts the stop **at the route-optimal position** — the gap that adds the fewest extra kilometres.
- **Directions like Google Maps** — pick A and B by search, by clicking the map, or from any trip pin: blue route overlay, duration, distance and localized turn-by-turn steps, in a panel that expands with a smooth animation.
- Per-day filtering, fly-to from any activity, and deep links into the real Google Maps for navigation.

### Budget
- **Cost field on every activity** (nightly price on hotels, tickets/parking/tolls elsewhere), with a chip on each card.
- **Budget badge** in the header showing the grand total; hover or click reveals a breakdown by category — hotels, food, activities, extras and an **automatic fuel estimate** computed from the real road distance and your car's consumption and local fuel price (both configurable).

### Photos
- **Automatic imagery** — every located stop shows photos of the nearest Wikipedia articles (free geosearch API, lazily fetched and cached), browsable in a **carousel** inside each activity's detail card.
- **Personal galleries** — drag & drop photos from your computer into the editor (compressed client-side, stored in IndexedDB), add by URL, remove, pick the cover, or opt out of the automatic photos per activity.

### Suggestions
- A curated catalog of extra stops along the route with photos, notes and links. A single toggle inserts each one **automatically at the optimal point of the route** (with the estimated detour in km) — and removes it just as cleanly.

### Sharing
- **Export / import JSON** — your own photos are inlined into the export, so the file you send carries everything. Data persists locally (localStorage + IndexedDB); nothing ever leaves the browser.

![Dashboard](docs/dashboard.png)

## Tech stack

| | |
|---|---|
| UI | React 19 · Tailwind CSS 4 · lucide-react |
| State | zustand (persisted, versioned migrations) |
| Map | Leaflet / react-leaflet · CARTO Voyager tiles |
| Drag & drop | dnd-kit |
| Build | Vite |

**Free services used at runtime** (no keys, no accounts): OpenStreetMap/CARTO tiles, [Nominatim](https://nominatim.org) geocoding, [OSRM](http://project-osrm.org) routing & directions, Wikipedia geosearch for imagery. All responses are cached client-side to stay polite with the public endpoints.

## Getting started

```sh
npm install
npm run dev      # development server on http://localhost:5199
npm run build    # production build in dist/
```

On macOS you can also double-click `Avvia Trip Planner.command`, which serves the production build and opens the browser.

## Project structure

```
src/
  App.jsx                  layout, tabs, overlays
  store.js                 zustand stores: trips (persisted + migrations), routes, UI
  data/
    seed.json              the pre-loaded California itinerary
    suggestions.js         curated extra stops with coordinates
  lib/
    utils.js               dates, durations, costs, trip normalization
    geo.js                 haversine, optimal insertion, OSRM routing & turn-by-turn
    imgdb.js               IndexedDB photo store, compression, portable export
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
```

## Notes

- The itinerary and all edits live entirely in your browser. Use **Export** for backups or to share a trip; the recipient imports the file and sees exactly your plan, photos included.
- Road distances and the fuel estimate refine themselves progressively as OSRM answers; straight dashed lines are shown as a fallback if routing is unavailable.

## Support

If this project is useful to you, consider supporting its development:

- ☕ [Buy Me a Coffee](https://buymeacoffee.com/prot10)
- 💛 [PayPal](https://paypal.me/andreaprotani99)

## License

This project is licensed under the **GNU Affero General Public License v3.0** — see [LICENSE](LICENSE).

In short: you are free to use, study, modify and share it, but any distributed or network-served derivative **must remain open source under the same license**. This deliberately prevents closed-source commercial repackaging.
