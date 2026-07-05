import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  Maximize2, Search, X, Navigation, ArrowUpDown, Crosshair, Loader2, ChevronDown, Plus,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTrip, useUI, useRoutes, toast, activeTrip } from '../store'
import { useAgentChat } from '../agent/socket'
import { fmtDur, fmtKm, fmtMoney, gmapsUrl } from '../lib/utils'
import { fetchRoadRoute, searchPlaces, fetchDirections, bestInsertion, haversineKm } from '../lib/geo'
import { MODE_META } from './typeMeta'
import { PoiMarkers, PoiControl } from './PoiLayer'

const WORLD_CENTER = [30, 10] // neutral fallback: no stops and no destination yet

const fmtMin = (min, t) => {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? t('map.leg.hm', { h, m }) : t('map.leg.m', { m })
}

export default function MapPanel() {
  const { t } = useTranslation()
  const trip = useTrip((s) => activeTrip(s))
  const insertItemAt = useTrip((s) => s.insertItemAt)
  const days = trip.days
  const mapFilter = useUI((s) => s.mapFilter)
  const setMapFilter = useUI((s) => s.setMapFilter)
  const picking = useUI((s) => s.picking)
  const hotelPreview = useUI((s) => s.hotelPreview)
  const markerRefs = useRef(new Map())
  const mapRef = useRef(null)
  const [roads, setRoads] = useState({}) // dayId -> road-following [lat,lng][]

  /* --- place search + directions (Google-Maps-style) --- */
  const [place, setPlace] = useState(null)              // searched place marker
  const [dir, setDir] = useState({ open: false, a: null, b: null })
  const [route, setRoute] = useState(null)              // { latlngs, km, min, steps }
  const [routing, setRouting] = useState(false)
  const [dirPick, setDirPick] = useState(null)          // 'a' | 'b' — next map click sets it
  const [fitNonce, setFitNonce] = useState(0)           // fit-all must refit even when unfiltered

  useEffect(() => {
    if (!dir.a || !dir.b) { setRoute(null); return }
    let dead = false
    setRouting(true)
    fetchDirections(dir.a, dir.b)
      .then((r) => {
        if (dead) return
        setRoute(r)
        if (!r) toast(t('map.toasts.routeNotFound'))
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
    toast(t('toasts.addedOptimal', { n: dayIndex + 1 }))
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

  /* the itinerary broken into LEGS between consecutive located stops; each
     leg carries the transport mode of the drive item between them (car/bus →
     real roads, walk → foot routing, train/plane/boat → straight dashed).
     No implicit return leg: a round trip only closes if the itinerary itself
     ends where it started (Ulisse asks the user how the trip should end). */
  const legs = useMemo(() => {
    const defaultMode = trip.transport === 'walk' ? 'walk' : 'car'
    const out = []
    let last = null
    let pendingMode = null
    let pendingDriveId = null
    days.forEach((day, dayIndex) => {
      for (const it of day.items) {
        if (it.type === 'drive') { pendingMode = it.mode ?? defaultMode; pendingDriveId = it.id; continue }
        if (it.lat == null) continue
        const stop = { coord: [it.lat, it.lng], dayId: day.id, title: it.title, id: it.id }
        if (last) {
          out.push({
            id: `${day.id}|${out.length}`, from: last.coord, to: stop.coord, dayId: day.id,
            dayN: dayIndex + 1, mode: pendingMode ?? defaultMode, fromTitle: last.title, toTitle: stop.title,
            driveId: pendingDriveId, toId: stop.id,
          })
        }
        last = stop
        pendingMode = null
        pendingDriveId = null
      }
    })
    return out
  }, [days, trip.transport])

  const ROAD_MODES = { car: 'driving', bus: 'driving', walk: 'foot' }

  /* fetch real geometry per leg (cached per pair+profile); publish day km */
  const legSignature = useMemo(() => JSON.stringify(legs.map((l) => [l.from, l.to, l.mode])), [legs])
  useEffect(() => {
    let dead = false
    setRoads({})
    const kmByLeg = {}
    const publish = () => {
      const byDay = {}
      for (const l of legs) {
        const km = kmByLeg[l.id] ?? haversineKm(l.from, l.to) * (ROAD_MODES[l.mode] ? 1.25 : 1)
        byDay[l.dayId] = (byDay[l.dayId] ?? 0) + km
      }
      useRoutes.setState({ byDay })
    }
    publish()
    ;(async () => {
      for (const l of legs) {
        const profile = ROAD_MODES[l.mode]
        if (!profile) continue
        const road = await fetchRoadRoute([l.from, l.to], profile)
        if (dead) return
        if (road) {
          kmByLeg[l.id] = road.km
          setRoads((r) => ({ ...r, [l.id]: road }))
          publish()
        }
      }
    })()
    return () => { dead = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legSignature])

  const layers = layersAll.filter((l) => !mapFilter || l.day.id === mapFilter)
  const visibleLegs = legs.filter((l) => !mapFilter || l.dayId === mapFilter)
  const dayColor = useMemo(() => Object.fromEntries(days.map((d) => [d.id, d.color])), [days])
  const allCoords = layers.flatMap((l) => l.points.map((p) => [p.item.lat, p.item.lng]))

  /* shift map overlays left while the floating chat covers the right side */
  const chatShift = useAgentChat((s) => (s.open ? s.panelW : 0))

  return (
    <div
      style={{ '--chat-w': `${chatShift ? chatShift + 12 : 0}px` }}
      className={`relative h-full w-full ${picking ? '[&_.leaflet-container]:cursor-crosshair' : ''}`}
    >
      <MapContainer
        center={trip.center ? [trip.center.lat, trip.center.lng] : WORLD_CENTER}
        zoom={trip.center ? 11 : 3}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <MapAutosize />
        <MapRef mapRef={mapRef} />
        {/* empty trip with a chosen destination: stay centered there (also
            covers the trip switch and start_planning while already mounted) */}
        <CenterOnDestination center={trip.center} hasStops={layersAll.some((l) => l.points.length > 0)} tripId={trip.id} />
        {/* re-fit when the filter changes OR the trip's anchor point moves
            (e.g. the agent starts building a brand-new destination) */}
        <FitOnChange
          coords={allCoords}
          depKey={`${mapFilter ?? 'all'}|${fitNonce}|${allCoords[0] ? allCoords[0].map((v) => v.toFixed(1)).join(',') : 'none'}`}
        />
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
                    <Plus size={11} strokeWidth={3} /> {t('common.addToTrip')}
                  </button>
                  <button
                    onClick={() => directionsTo(place)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold !text-blue-700 ring-1 ring-blue-600/20 transition hover:bg-blue-100"
                  >
                    <Navigation size={11} /> {t('map.dir.directions')}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* hotel proposed in chat: preview pin with price + link */}
        {hotelPreview && <HotelPreviewMarker p={hotelPreview} />}

        {/* directions route + endpoints */}
        {route && (
          <Polyline positions={route.latlngs} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.9, dashArray: null }} />
        )}
        {dir.a && <Marker position={[dir.a.lat, dir.a.lng]} icon={dirIcon('A', '#16a34a')} />}
        {dir.b && <Marker position={[dir.b.lat, dir.b.lng]} icon={dirIcon('B', '#dc2626')} />}

        {/* route legs, styled by transport mode — click one for the details */}
        {visibleLegs.map((leg) => {
          const road = roads[leg.id]
          const color = dayColor[leg.dayId] ?? '#f97316'
          /* dashArray must be explicitly nulled: Leaflet's setStyle merges
             options and never removes a previous dash */
          const style = road
            ? leg.mode === 'walk'
              ? { color, weight: 3.5, opacity: 0.85, dashArray: '1 7' }
              : { color, weight: 4, opacity: 0.75, dashArray: null }
            : ROAD_MODES[leg.mode]
              ? { color, weight: 3.5, opacity: 0.55, dashArray: '6 9' }
              : { color, weight: 3, opacity: 0.55, dashArray: '10 10' } /* train/plane/boat */
          return (
            <Polyline key={leg.id} positions={road?.latlngs ?? [leg.from, leg.to]} pathOptions={style}>
              <Popup>
                <LegPopup leg={leg} road={road} color={color} />
              </Popup>
            </Polyline>
          )
        })}

        <PoiMarkers />

        {layers.map(({ day, dayIndex, points }) => (
          <div key={day.id}>
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
        ))}
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
      <div className="no-scrollbar absolute left-3 right-3 top-[calc(var(--hdr-b,96px)+48px)] z-[500] -m-1.5 flex gap-1.5 overflow-x-auto p-1.5 transition-[right,left] duration-200 max-lg:[mask-image:linear-gradient(to_right,transparent,black_10px,black_calc(100%-10px),transparent)] lg:nice-scroll lg:left-[calc(0.75rem+var(--left-w,0px))] lg:right-[calc(21.5rem+var(--chat-w,0px))] lg:top-[var(--hdr-b,96px)] lg:flex-wrap">
        <LegChip active={!mapFilter} color="#334155" onClick={() => setMapFilter(null)}>
          {t('map.legend.all')}
        </LegChip>
        {days.map((d, i) => (
          <LegChip
            key={d.id}
            active={mapFilter === d.id}
            color={d.color}
            onClick={() => setMapFilter(mapFilter === d.id ? null : d.id)}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ background: d.color }} />
            {t('map.legend.dayShort', { n: i + 1 })}
          </LegChip>
        ))}
      </div>

      {/* fit-all + POI discovery */}
      <div className="absolute bottom-[calc(var(--sheet-peek,0px)+12px)] left-3 z-[500] flex items-center gap-2 lg:bottom-3 lg:left-[calc(0.75rem+var(--left-w,0px))]">
        <button
          onClick={() => { setMapFilter(null); setFitNonce((n) => n + 1) }}
          title={t('map.legend.fitAll')}
          className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-ink-700 shadow-lg backdrop-blur transition hover:border-brand-400 hover:text-brand-600"
        >
          <Maximize2 size={14} />
          <span className="hidden sm:inline">{t('map.legend.fit')}</span>
        </button>
        <PoiControl />
      </div>
    </div>
  )
}

/* click details for a route leg: mode, stops, real distance and duration */
function LegPopup({ leg, road, color }) {
  const { t } = useTranslation()
  const meta = MODE_META[leg.mode] ?? MODE_META.car
  const setFocusItem = useUI((s) => s.setFocusItem)
  const revealList = useUI((s) => s.revealList)
  const km = road?.km ?? haversineKm(leg.from, leg.to)
  return (
    <div className="min-w-44 max-w-60">
      <div className="flex items-center gap-1.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-lg text-white" style={{ background: color }}>
          <meta.Icon size={13} />
        </span>
        <span className="font-display text-[13px] font-bold text-ink-900">
          {t(meta.labelKey)} · {t('common.dayN', { n: leg.dayN })}
        </span>
      </div>
      <div className="mt-1.5 text-[11.5px] leading-snug text-ink-600">
        <span className="font-semibold text-ink-800">{leg.fromTitle}</span>
        {' → '}
        <span className="font-semibold text-ink-800">{leg.toTitle}</span>
      </div>
      <div className="mt-1.5 text-[12px] font-bold text-ink-900">
        {fmtKm(km)}
        {road?.min ? <span className="font-semibold text-ink-500"> · ~{fmtMin(road.min, t)}</span> : null}
        {!road && <span className="font-medium text-ink-400"> {t('map.leg.straightLine')}</span>}
      </div>
      <button
        onClick={() => {
          setFocusItem(leg.driveId ?? leg.toId, color)
          revealList('itinerary')
        }}
        className="mt-2 rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-ink-700"
      >
        {t('common.seeInItinerary')}
      </button>
    </div>
  )
}

/* ---------- markers ---------- */

function PinMarker({ item, n, day, dayIndex, markerRefs, onDirTo }) {
  const { t } = useTranslation()
  const setFocusItem = useUI((s) => s.setFocusItem)
  const revealList = useUI((s) => s.revealList)

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
            {t('common.dayN', { n: dayIndex + 1 })}
            {item.time ? ` · ${item.time}` : ''}
            {item.dur ? ` · ${fmtDur(item.dur)}` : ''}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => { setFocusItem(item.id, day.color); revealList('itinerary') }}
              className="rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-ink-700"
            >
              {t('common.seeInItinerary')}
            </button>
            <button
              onClick={() => onDirTo({ lat: item.lat, lng: item.lng, name: item.title, short: item.title })}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold !text-blue-700 ring-1 ring-blue-600/20 transition hover:bg-blue-100"
            >
              <Navigation size={11} /> {t('map.dir.directions')}
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

/* while the itinerary has no located stop, keep the view on the destination
   chosen in the interview instead of a stale default */
function CenterOnDestination({ center, hasStops, tripId }) {
  const map = useMap()
  useEffect(() => {
    if (!hasStops && center) map.setView([center.lat, center.lng], 11)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, center?.lat, center?.lng, hasStops, map])
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

/* preview pin for a hotel proposed in chat: fly there and pop up the card */
function HotelPreviewMarker({ p }) {
  const { t } = useTranslation()
  const map = useMap()
  useEffect(() => {
    map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 13), { duration: 0.9 })
  }, [p.lat, p.lng, map])
  return (
    <Marker position={[p.lat, p.lng]} icon={hotelIcon} ref={(m) => m?.openPopup()}>
      <Popup>
        <div className="min-w-44 max-w-60">
          <div className="font-display text-[13.5px] font-bold text-ink-900">{p.name}</div>
          <div className="mt-0.5 text-[11.5px] font-semibold text-ink-500">
            {p.price_per_night != null && <>{fmtMoney(p.price_per_night, p.currency ?? 'EUR')}{t('hotels.perNight')}</>}
            {p.review_score != null && <> · {p.review_score.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</>}
          </div>
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-bold !text-white transition hover:bg-violet-700"
            >
              Booking.com
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  )
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
  const { t } = useTranslation()
  const picking = useUI((s) => s.picking)
  useMapEvents({
    click(e) {
      if (!picking) return
      const { editor, openEditor, setPicking } = useUI.getState()
      if (!editor) { setPicking(false); return }
      const draft = editor.draft ?? {}
      openEditor(editor.dayId, editor.itemId, {
        ...draft,
        lat: +e.latlng.lat.toFixed(5),
        lng: +e.latlng.lng.toFixed(5),
      })
      setPicking(false) /* restores the sheet snap it parked */
      toast(t('map.toasts.positionSet'))
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
const BED_SVG =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 17h20"/></svg>'
const hotelIcon = L.divIcon({
  className: '',
  html: `<div class="map-pin" style="--pin:#7c3aed"><span>${BED_SVG}</span></div>`,
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
  useEffect(() => {
    mapRef.current = map
    if (import.meta.env.DEV) window.__map = map
  }, [map, mapRef])
  return null
}

/* while choosing A/B, the next map click becomes that endpoint */
function DirPickConsumer({ dirPick, setDirPick, setDir }) {
  const { t } = useTranslation()
  useMapEvents({
    click(e) {
      if (!dirPick) return
      const p = {
        lat: +e.latlng.lat.toFixed(5),
        lng: +e.latlng.lng.toFixed(5),
        name: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
        short: t('map.dir.mapPoint'),
      }
      setDir((d) => ({ ...d, [dirPick]: p }))
      setDirPick(null)
    },
  })
  return null
}

function SearchOverlay({ place, setPlace, dir, setDir, route, routing, dirPick, setDirPick, mapRef }) {
  const { t } = useTranslation()
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
    <div className="absolute right-[calc(0.75rem+var(--chat-w,0px))] top-[var(--hdr-b,96px)] z-[520] w-80 max-w-[calc(100vw-24px)] transition-[right] duration-200 lg:top-[var(--hdr-b,96px)]">
      <div className="nice-scroll max-h-[calc(100dvh-150px)] overflow-y-auto rounded-2xl border border-ink-200 bg-white shadow-lg">
        {!dir.open ? (
          /* --- simple place search --- */
          <div className="flex items-start gap-1 p-1.5">
            <PlaceSearch
              placeholder={t('map.search.placeholder')}
              onSelect={selectPlace}
              autoClear={false}
            />
            <button
              onClick={() => setDir((d) => ({ ...d, open: true }))}
              title={t('map.dir.roadDirections')}
              aria-label={t('map.dir.roadDirections')}
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
                <Navigation size={13} className="text-blue-600" /> {t('map.dir.directions')}
              </h4>
              <button onClick={closeDirections} aria-label={t('map.dir.close')} className="grid size-7 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100">
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
                  placeholder={t('map.dir.fromPlaceholder')}
                  picking={dirPick === 'a'}
                  onPick={() => setDirPick(dirPick === 'a' ? null : 'a')}
                  onSelect={(p) => setDir((d) => ({ ...d, a: p }))}
                  onClear={() => setDir((d) => ({ ...d, a: null }))}
                />
                <Endpoint
                  value={dir.b}
                  placeholder={t('map.dir.toPlaceholder')}
                  picking={dirPick === 'b'}
                  onPick={() => setDirPick(dirPick === 'b' ? null : 'b')}
                  onSelect={(p) => setDir((d) => ({ ...d, b: p }))}
                  onClear={() => setDir((d) => ({ ...d, b: null }))}
                />
              </div>
              <button
                onClick={() => setDir((d) => ({ ...d, a: d.b, b: d.a }))}
                title={t('map.dir.swap')}
                aria-label={t('map.dir.swap')}
                className="grid w-8 shrink-0 place-items-center self-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              >
                <ArrowUpDown size={15} />
              </button>
            </div>

            {dirPick && (
              <p className="mt-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700">
                {dirPick === 'a' ? t('map.dir.clickToSetStart') : t('map.dir.clickToSetEnd')}
              </p>
            )}

            {routing && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-500">
                <Loader2 size={14} className="animate-spin text-blue-600" /> {t('map.dir.calculating')}
              </div>
            )}

            {route && !routing && (
              <div className="mt-3 border-t border-ink-100 pt-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-extrabold text-blue-700">{fmtMin(route.min, t)}</span>
                  <span className="text-xs font-semibold text-ink-500">({fmtKm(route.km)})</span>
                </div>
                <button
                  onClick={() => setShowSteps((s) => !s)}
                  className="mt-1 flex items-center gap-1 text-[11.5px] font-bold text-blue-600 hover:underline"
                >
                  <ChevronDown size={12} className={`transition-transform ${showSteps ? 'rotate-180' : ''}`} />
                  {showSteps ? t('map.dir.hideSteps') : t('map.dir.showSteps', { count: route.steps.length })}
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
  const { t } = useTranslation()
  if (value) {
    return (
      <div className="flex h-9 min-w-0 items-center gap-1.5 rounded-xl bg-ink-50 px-2.5 ring-1 ring-ink-200">
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-800" title={value.name}>
          {value.short || value.name}
        </span>
        <button onClick={onClear} aria-label={t('map.dir.remove')} className="shrink-0 text-ink-400 transition hover:text-rose-600">
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
        title={t('map.dir.pickOnMap')}
        aria-label={`${t('map.dir.pickOnMap')}: ${placeholder}`}
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
  const { t } = useTranslation()
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
      if (!r.length) toast(t('map.search.noResults'))
    } catch {
      toast(t('map.search.networkError'))
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
            <button onClick={() => { setQ(''); setResults(null) }} aria-label={t('map.search.clear')} className="shrink-0 text-ink-300 hover:text-ink-600">
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
