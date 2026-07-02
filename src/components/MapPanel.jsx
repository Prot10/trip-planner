import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  Maximize2, Search, X, Navigation, ArrowUpDown, Crosshair, Loader2, ChevronDown, Plus,
} from 'lucide-react'
import { useTrip, useUI, useRoutes, toast, activeTrip } from '../store'
import { fmtDur, fmtKm, gmapsUrl } from '../lib/utils'
import { fetchRoadRoute, searchPlaces, fetchDirections, bestInsertion } from '../lib/geo'

const CA_CENTER = [36.5, -120.5]

const fmtMin = (min) => {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `${h} h ${m} min` : `${m} min`
}

export default function MapPanel() {
  const trip = useTrip((s) => activeTrip(s))
  const insertItemAt = useTrip((s) => s.insertItemAt)
  const days = trip.days
  const mapFilter = useUI((s) => s.mapFilter)
  const setMapFilter = useUI((s) => s.setMapFilter)
  const picking = useUI((s) => s.picking)
  const markerRefs = useRef(new Map())
  const mapRef = useRef(null)
  const [roads, setRoads] = useState({}) // dayId -> road-following [lat,lng][]

  /* --- place search + directions (Google-Maps-style) --- */
  const [place, setPlace] = useState(null)              // searched place marker
  const [dir, setDir] = useState({ open: false, a: null, b: null })
  const [route, setRoute] = useState(null)              // { latlngs, km, min, steps }
  const [routing, setRouting] = useState(false)
  const [dirPick, setDirPick] = useState(null)          // 'a' | 'b' — next map click sets it

  useEffect(() => {
    if (!dir.a || !dir.b) { setRoute(null); return }
    let dead = false
    setRouting(true)
    fetchDirections(dir.a, dir.b)
      .then((r) => {
        if (dead) return
        setRoute(r)
        if (!r) toast('Percorso non trovato')
        else mapRef.current?.fitBounds(r.latlngs, { padding: [60, 60] })
      })
      .finally(() => !dead && setRouting(false))
    return () => { dead = true }
  }, [dir.a, dir.b])

  const addPlaceToTrip = (p) => {
    const spot = bestInsertion(trip, p)
    if (!spot) return
    const dayIndex = days.findIndex((d) => d.id === spot.dayId)
    insertItemAt(spot.dayId, spot.index, {
      type: 'activity', title: p.short || p.name, time: '', dur: 60, notes: '',
      links: [], must: false, done: false, lat: p.lat, lng: p.lng, imgs: [], noWiki: false, sug: null, price: 0,
    })
    setPlace(null)
    toast(`Aggiunto al Giorno ${dayIndex + 1} nel punto ottimale del percorso`)
  }

  const directionsTo = (target) => {
    setDir((d) => ({ ...d, open: true, b: target }))
    setPlace(null)
  }

  /* every day with its numbered, located points */
  const layersAll = useMemo(() => {
    return days.map((day, dayIndex) => {
      let n = 0
      const points = day.items
        .filter((it) => it.lat != null)
        .map((it) => ({ item: it, n: it.type === 'hotel' ? null : ++n }))
      return { day, dayIndex, points }
    })
  }, [days])

  /* one continuous round trip: each day's leg starts where the previous
     day (with stops) ended, and day 1 starts from the end of the last day */
  const chained = useMemo(() => {
    const withPts = layersAll.filter((l) => l.points.length > 0)
    return layersAll.map((l) => {
      const pts = l.points.map((p) => [p.item.lat, p.item.lng])
      const pos = withPts.indexOf(l)
      if (pos === -1 || withPts.length < 2) return { ...l, coords: pts }
      const prev = withPts[(pos - 1 + withPts.length) % withPts.length]
      const prevLast = prev.points[prev.points.length - 1]
      return { ...l, coords: [[prevLast.item.lat, prevLast.item.lng], ...pts] }
    })
  }, [layersAll])

  /* fetch real driving geometry (free OSRM); falls back to straight lines */
  const routeSignature = useMemo(
    () => JSON.stringify(chained.map((l) => [l.day.id, l.coords])),
    [chained],
  )
  useEffect(() => {
    let dead = false
    setRoads({})
    useRoutes.setState({ byDay: {} })
    ;(async () => {
      for (const l of chained) {
        if (l.coords.length < 2) continue
        const road = await fetchRoadRoute(l.coords)
        if (dead) return
        if (road) {
          setRoads((r) => ({ ...r, [l.day.id]: road.latlngs }))
          /* publish real road km so the header budget badges use it */
          useRoutes.setState((s) => ({ byDay: { ...s.byDay, [l.day.id]: road.km } }))
        }
      }
    })()
    return () => { dead = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSignature])

  const layers = chained.filter((l) => !mapFilter || l.day.id === mapFilter)
  const allCoords = layers.flatMap((l) => l.points.map((p) => [p.item.lat, p.item.lng]))

  return (
    <div className={`relative h-full w-full ${picking ? '[&_.leaflet-container]:cursor-crosshair' : ''}`}>
      <MapContainer center={CA_CENTER} zoom={6} zoomControl={false} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <MapAutosize />
        <MapRef mapRef={mapRef} />
        <FitOnChange coords={allCoords} depKey={mapFilter ?? 'all'} />
        <FlyToConsumer markerRefs={markerRefs} />
        <PickConsumer />
        <DirPickConsumer dirPick={dirPick} setDirPick={setDirPick} setDir={setDir} />

        {/* searched place */}
        {place && (
          <Marker
            position={[place.lat, place.lng]}
            icon={searchIcon}
            ref={(m) => m?.openPopup()}
          >
            <Popup>
              <div className="min-w-48 max-w-60">
                <div className="font-display text-[13.5px] font-bold text-ink-900">{place.short}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] text-ink-500">{place.name}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => addPlaceToTrip(place)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-600"
                  >
                    <Plus size={11} strokeWidth={3} /> Aggiungi al viaggio
                  </button>
                  <button
                    onClick={() => directionsTo(place)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold !text-blue-700 ring-1 ring-blue-600/20 transition hover:bg-blue-100"
                  >
                    <Navigation size={11} /> Indicazioni
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* directions route + endpoints */}
        {route && (
          <Polyline positions={route.latlngs} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.9, dashArray: null }} />
        )}
        {dir.a && <Marker position={[dir.a.lat, dir.a.lng]} icon={dirIcon('A', '#16a34a')} />}
        {dir.b && <Marker position={[dir.b.lat, dir.b.lng]} icon={dirIcon('B', '#dc2626')} />}

        {layers.map(({ day, dayIndex, points, coords }) => {
          const road = roads[day.id]
          return (
            <div key={day.id}>
              {coords.length > 1 && (
                <Polyline
                  positions={road ?? coords}
                  pathOptions={
                    road
                      /* dashArray must be explicitly nulled: Leaflet's setStyle
                         merges options and never removes a previous dash */
                      ? { color: day.color, weight: 4, opacity: 0.75, dashArray: null }
                      : { color: day.color, weight: 3.5, opacity: 0.55, dashArray: '6 9' }
                  }
                />
              )}
              {points.map(({ item, n }) => (
                <PinMarker
                  key={item.id}
                  item={item}
                  n={n}
                  day={day}
                  dayIndex={dayIndex}
                  markerRefs={markerRefs}
                  onDirTo={directionsTo}
                />
              ))}
            </div>
          )
        })}
      </MapContainer>

      {/* search + directions (Google-Maps-style) */}
      <SearchOverlay
        place={place}
        setPlace={setPlace}
        dir={dir}
        setDir={setDir}
        route={route}
        routing={routing}
        dirPick={dirPick}
        setDirPick={setDirPick}
        mapRef={mapRef}
      />

      {/* legend / day filter */}
      <div className="nice-scroll absolute left-3 right-3 top-[60px] z-[500] flex gap-1.5 overflow-x-auto pb-1 lg:right-[344px] lg:top-3 lg:flex-wrap">
        <LegChip active={!mapFilter} color="#334155" onClick={() => setMapFilter(null)}>
          Tutto il viaggio
        </LegChip>
        {days.map((d, i) => (
          <LegChip
            key={d.id}
            active={mapFilter === d.id}
            color={d.color}
            onClick={() => setMapFilter(mapFilter === d.id ? null : d.id)}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ background: d.color }} />
            G{i + 1}
          </LegChip>
        ))}
      </div>

      {/* fit-all */}
      <button
        onClick={() => setMapFilter(null)}
        title="Inquadra tutto il viaggio"
        className="absolute bottom-6 left-3 z-[500] flex items-center gap-2 rounded-xl border border-ink-200 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-ink-700 shadow-lg backdrop-blur transition hover:border-brand-400 hover:text-brand-600"
      >
        <Maximize2 size={14} />
        <span className="hidden sm:inline">Inquadra viaggio</span>
      </button>
    </div>
  )
}

/* ---------- markers ---------- */

function PinMarker({ item, n, day, dayIndex, markerRefs, onDirTo }) {
  const setFocusItem = useUI((s) => s.setFocusItem)
  const setTab = useUI((s) => s.setTab)

  /* inline lucide "bed-double" path — hotel pins get an icon, stops get their number */
  const BED_SVG =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 17h20"/></svg>'

  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div class="map-pin${item.type === 'hotel' ? ' pin-hotel' : ''}" style="--pin:${day.color}"><span>${
          item.type === 'hotel' ? BED_SVG : n
        }</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 26],
        popupAnchor: [0, -22],
      }),
    [day.color, n, item.type],
  )

  return (
    <Marker
      position={[item.lat, item.lng]}
      icon={icon}
      ref={(m) => {
        if (m) markerRefs.current.set(item.id, m)
        else markerRefs.current.delete(item.id)
      }}
    >
      <Popup>
        <div className="min-w-44">
          <div className="font-display text-[13.5px] font-bold text-ink-900">{item.title}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-500">
            Giorno {dayIndex + 1}
            {item.time ? ` · ${item.time}` : ''}
            {item.dur ? ` · ${fmtDur(item.dur)}` : ''}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => { setFocusItem(item.id, day.color); if (window.innerWidth < 1024) setTab('itinerary') }}
              className="rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-ink-700"
            >
              Vedi nel programma
            </button>
            <button
              onClick={() => onDirTo({ lat: item.lat, lng: item.lng, name: item.title, short: item.title })}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold !text-blue-700 ring-1 ring-blue-600/20 transition hover:bg-blue-100"
            >
              <Navigation size={11} /> Indicazioni
            </button>
            <a
              href={gmapsUrl(item.lat, item.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-ink-100 px-2.5 py-1.5 text-[11px] font-bold !text-ink-600 ring-1 ring-ink-500/10 transition hover:bg-ink-200"
            >
              Google Maps
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

/* ---------- map behaviours ---------- */

/* Leaflet doesn't notice container size changes (mobile tab switch, resize) */
function MapAutosize() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [map])
  return null
}

/* fit bounds on mount, when the day filter changes, and when the map first
   becomes visible (on mobile it mounts inside a hidden tab at size 0) */
function FitOnChange({ coords, depKey }) {
  const map = useMap()
  const coordsRef = useRef(coords)
  coordsRef.current = coords

  useEffect(() => {
    if (coordsRef.current.length && map.getSize().x > 50) {
      map.fitBounds(coordsRef.current, { padding: [48, 48] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, map])

  useEffect(() => {
    const onResize = (e) => {
      const wasHidden = !e.oldSize || e.oldSize.x < 50
      if (wasHidden && e.newSize.x >= 50 && coordsRef.current.length) {
        map.fitBounds(coordsRef.current, { padding: [48, 48] })
      }
    }
    map.on('resize', onResize)
    return () => map.off('resize', onResize)
  }, [map])
  return null
}

/* consume flyTo requests from item cards */
function FlyToConsumer({ markerRefs }) {
  const map = useMap()
  const flyTo = useUI((s) => s.flyTo)
  const setFlyTo = useUI((s) => s.setFlyTo)
  useEffect(() => {
    if (!flyTo) return
    map.flyTo([flyTo.lat, flyTo.lng], Math.max(map.getZoom(), 12), { duration: 0.9 })
    const t = setTimeout(() => {
      markerRefs.current.get(flyTo.itemId)?.openPopup()
      setFlyTo(null)
    }, 950)
    return () => clearTimeout(t)
  }, [flyTo, map, setFlyTo, markerRefs])
  return null
}

/* pick-a-location mode: next map click lands in the item editor draft */
function PickConsumer() {
  const picking = useUI((s) => s.picking)
  useMapEvents({
    click(e) {
      if (!picking) return
      const { editor, openEditor, setPicking, setTab } = useUI.getState()
      if (!editor) { setPicking(false); return }
      const draft = editor.draft ?? {}
      openEditor(editor.dayId, editor.itemId, {
        ...draft,
        lat: +e.latlng.lat.toFixed(5),
        lng: +e.latlng.lng.toFixed(5),
      })
      setPicking(false)
      if (window.innerWidth < 1024) setTab('itinerary')
      toast('Posizione impostata')
    },
  })
  return null
}

/* ---------- search + directions overlay ---------- */

const SEARCH_SVG =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>'
const searchIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin" style="--pin:#2563eb"><span>${SEARCH_SVG}</span></div>`,
  iconSize: [28, 28], iconAnchor: [14, 26], popupAnchor: [0, -22],
})
const dirIcon = (letter, color) =>
  L.divIcon({
    className: '',
    html: `<div class="dir-pin" style="--c:${color}">${letter}</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13],
  })

function MapRef({ mapRef }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map, mapRef])
  return null
}

/* while choosing A/B, the next map click becomes that endpoint */
function DirPickConsumer({ dirPick, setDirPick, setDir }) {
  useMapEvents({
    click(e) {
      if (!dirPick) return
      const p = {
        lat: +e.latlng.lat.toFixed(5),
        lng: +e.latlng.lng.toFixed(5),
        name: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
        short: 'Punto sulla mappa',
      }
      setDir((d) => ({ ...d, [dirPick]: p }))
      setDirPick(null)
    },
  })
  return null
}

function SearchOverlay({ place, setPlace, dir, setDir, route, routing, dirPick, setDirPick, mapRef }) {
  const [showSteps, setShowSteps] = useState(false)

  const selectPlace = (p) => {
    setPlace(p)
    mapRef.current?.flyTo([p.lat, p.lng], Math.max(mapRef.current.getZoom(), 13), { duration: 0.8 })
  }

  const closeDirections = () => {
    setDir({ open: false, a: null, b: null })
    setDirPick(null)
    setShowSteps(false)
  }

  return (
    <div className="absolute right-3 top-3 z-[520] w-80 max-w-[calc(100vw-24px)]">
      <div className="nice-scroll max-h-[calc(100dvh-150px)] overflow-y-auto rounded-2xl border border-ink-200 bg-white shadow-lg">
        {!dir.open ? (
          /* --- simple place search --- */
          <div className="flex items-start gap-1 p-1.5">
            <PlaceSearch
              placeholder="Cerca un luogo sulla mappa…"
              onSelect={selectPlace}
              autoClear={false}
            />
            <button
              onClick={() => setDir((d) => ({ ...d, open: true }))}
              title="Indicazioni stradali"
              aria-label="Indicazioni stradali"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
            >
              <Navigation size={15} />
            </button>
          </div>
        ) : (
          /* --- directions panel --- */
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 font-display text-[13px] font-bold text-ink-900">
                <Navigation size={13} className="text-blue-600" /> Indicazioni
              </h4>
              <button onClick={closeDirections} aria-label="Chiudi indicazioni" className="grid size-7 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100">
                <X size={15} />
              </button>
            </div>

            <div className="flex items-stretch gap-2">
              <div className="flex flex-col items-center justify-center gap-1 py-1">
                <span className="size-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span className="w-px flex-1 border-l-2 border-dotted border-ink-300" />
                <span className="size-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Endpoint
                  value={dir.a}
                  placeholder="Partenza…"
                  picking={dirPick === 'a'}
                  onPick={() => setDirPick(dirPick === 'a' ? null : 'a')}
                  onSelect={(p) => setDir((d) => ({ ...d, a: p }))}
                  onClear={() => setDir((d) => ({ ...d, a: null }))}
                />
                <Endpoint
                  value={dir.b}
                  placeholder="Arrivo…"
                  picking={dirPick === 'b'}
                  onPick={() => setDirPick(dirPick === 'b' ? null : 'b')}
                  onSelect={(p) => setDir((d) => ({ ...d, b: p }))}
                  onClear={() => setDir((d) => ({ ...d, b: null }))}
                />
              </div>
              <button
                onClick={() => setDir((d) => ({ ...d, a: d.b, b: d.a }))}
                title="Inverti partenza e arrivo"
                aria-label="Inverti partenza e arrivo"
                className="grid w-8 shrink-0 place-items-center self-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              >
                <ArrowUpDown size={15} />
              </button>
            </div>

            {dirPick && (
              <p className="mt-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700">
                Clicca sulla mappa per impostare {dirPick === 'a' ? 'la partenza' : "l'arrivo"}
              </p>
            )}

            {routing && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-500">
                <Loader2 size={14} className="animate-spin text-blue-600" /> Calcolo percorso…
              </div>
            )}

            {route && !routing && (
              <div className="mt-3 border-t border-ink-100 pt-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-extrabold text-blue-700">{fmtMin(route.min)}</span>
                  <span className="text-xs font-semibold text-ink-500">({fmtKm(route.km)})</span>
                </div>
                <button
                  onClick={() => setShowSteps((s) => !s)}
                  className="mt-1 flex items-center gap-1 text-[11.5px] font-bold text-blue-600 hover:underline"
                >
                  <ChevronDown size={12} className={`transition-transform ${showSteps ? 'rotate-180' : ''}`} />
                  {showSteps ? 'Nascondi indicazioni' : `Mostra indicazioni (${route.steps.length} svolte)`}
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    showSteps ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <ol className="nice-scroll mt-2 max-h-56 overflow-y-auto">
                      {route.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 border-b border-ink-100 py-1.5 last:border-0">
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[10px] font-bold text-ink-500">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 text-xs leading-snug text-ink-700">{s.text}</span>
                          {s.km >= 0.05 && (
                            <span className="shrink-0 text-[10.5px] font-semibold tabular-nums text-ink-400">
                              {s.km < 1 ? `${Math.round(s.km * 1000)} m` : `${s.km.toFixed(1)} km`}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* one endpoint (A/B): search input until set, then a chip with clear */
function Endpoint({ value, placeholder, picking, onPick, onSelect, onClear }) {
  if (value) {
    return (
      <div className="flex h-9 min-w-0 items-center gap-1.5 rounded-xl bg-ink-50 px-2.5 ring-1 ring-ink-200">
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-800" title={value.name}>
          {value.short || value.name}
        </span>
        <button onClick={onClear} aria-label="Rimuovi" className="shrink-0 text-ink-400 transition hover:text-rose-600">
          <X size={13} strokeWidth={2.8} />
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-1">
      <PlaceSearch placeholder={placeholder} onSelect={onSelect} autoClear small />
      <button
        onClick={onPick}
        title="Scegli sulla mappa"
        aria-label={`Scegli sulla mappa: ${placeholder}`}
        className={`grid size-8 shrink-0 place-items-center rounded-lg transition ${
          picking ? 'bg-blue-600 text-white' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700'
        }`}
      >
        <Crosshair size={14} />
      </button>
    </div>
  )
}

/* Nominatim search box with a results dropdown */
function PlaceSearch({ placeholder, onSelect, autoClear, small }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    const query = q.trim()
    if (!query) return
    setBusy(true)
    try {
      const r = await searchPlaces(query)
      setResults(r)
      if (!r.length) toast('Nessun risultato — prova ad aggiungere la città o lo stato')
    } catch {
      toast('Errore di rete nella ricerca')
    } finally {
      setBusy(false)
    }
  }

  const pick = (p) => {
    setResults(null)
    setQ(autoClear ? '' : p.short)
    onSelect(p)
  }

  return (
    <div className="min-w-0 flex-1">
      <div className={`flex items-center gap-1.5 rounded-xl bg-ink-50 px-2.5 ring-1 ring-ink-200 transition focus-within:ring-blue-400 ${small ? 'h-8' : 'h-9'}`}>
        <Search size={13} className="shrink-0 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run() } }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-ink-800 outline-none placeholder:font-normal placeholder:text-ink-400"
        />
        {busy
          ? <Loader2 size={13} className="shrink-0 animate-spin text-blue-600" />
          : q && (
            <button onClick={() => { setQ(''); setResults(null) }} aria-label="Pulisci" className="shrink-0 text-ink-300 hover:text-ink-600">
              <X size={12} strokeWidth={3} />
            </button>
          )}
      </div>
      {/* results expand the panel in-flow with a smooth height animation
          (an absolute dropdown would be clipped by the card's overflow) */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          results?.length ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="nice-scroll mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-ink-100 bg-ink-50/50 p-1">
            {(results ?? []).map((p, i) => (
              <button
                key={i}
                onClick={() => pick(p)}
                className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-white hover:shadow-sm"
              >
                <Search size={11} className="mt-0.5 shrink-0 text-ink-300" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-ink-800">{p.short}</span>
                  <span className="line-clamp-1 text-[10.5px] text-ink-400">{p.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LegChip({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border bg-white/95 px-3 py-1.5 text-[11.5px] font-bold shadow-sm backdrop-blur transition ${
        active ? 'text-ink-900' : 'border-ink-200 text-ink-500 hover:text-ink-800'
      }`}
      style={active ? { borderColor: color, boxShadow: `0 0 0 1px ${color}` } : {}}
    >
      {children}
    </button>
  )
}
