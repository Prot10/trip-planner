import { useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  MapPinned, X, Landmark, UtensilsCrossed, Coffee, BedDouble, TreePine, FerrisWheel, Loader2, Plus, Check,
} from 'lucide-react'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { bestInsertion } from '../lib/geo'

/* ---------- categories: color, icons (lucide, inlined for divIcon) ---------- */

const CATS = {
  attraction: {
    label: 'Attrazioni', Icon: FerrisWheel, color: '#8b5cf6',
    svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v4m6.8-1.2-2.9 2.9M22 12h-4m1.2 6.8-2.9-2.9M12 22v-4m-6.8 1.2 2.9-2.9M2 12h4M4.8 5.2l2.9 2.9"/>',
    osm: ['node[tourism=attraction]', 'node[tourism=viewpoint]', 'way[tourism=attraction]'],
  },
  museum: {
    label: 'Musei', Icon: Landmark, color: '#f59e0b',
    svg: '<path d="M3 22h18M6 18v-7m4 7v-7m4 7v-7m4 7v-7M12 2l8 5H4z"/>',
    osm: ['node[tourism=museum]', 'node[tourism=gallery]', 'way[tourism=museum]'],
  },
  restaurant: {
    label: 'Ristoranti', Icon: UtensilsCrossed, color: '#f43f5e',
    svg: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    osm: ['node[amenity=restaurant]'],
  },
  cafe: {
    label: 'Caffè & bar', Icon: Coffee, color: '#b45309',
    svg: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>',
    osm: ['node[amenity=cafe]', 'node[amenity=bar]'],
  },
  hotel: {
    label: 'Hotel', Icon: BedDouble, color: '#0ea5e9',
    svg: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M2 17h20"/>',
    osm: ['node[tourism=hotel]', 'node[tourism=guest_house]', 'way[tourism=hotel]'],
  },
  park: {
    label: 'Natura', Icon: TreePine, color: '#10b981',
    svg: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17ZM12 22v-3"/>',
    osm: ['node[leisure=park]', 'way[leisure=park]', 'node[tourism=zoo]'],
  },
}
const CAT_KEYS = Object.keys(CATS)
const ITEM_CAT = { food: 'restaurant', hotel: 'hotel', activity: 'attraction' }

export const usePoi = create((set) => ({
  enabled: false,
  source: 'all', // all | trip | suggestions
  cats: { attraction: true, museum: true, restaurant: true, cafe: false, hotel: true, park: false },
  results: [],
  loading: false,
  zoomHint: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  setSource: (source) => set({ source }),
  toggleCat: (k) => set((s) => ({ cats: { ...s.cats, [k]: !s.cats[k] } })),
}))

/* ---------- Overpass (OSM) discovery, cached per view+cats ---------- */

if (import.meta.env.DEV && typeof window !== 'undefined') window.__poi = usePoi

const cache = new Map()
async function fetchPois(bounds, cats) {
  const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()]
    .map((v) => v.toFixed(3)).join(',')
  const key = `${bbox}|${cats.join(',')}`
  if (cache.has(key)) return cache.get(key)
  const selectors = cats.flatMap((c) => CATS[c].osm.map((sel) => `${sel}(${bbox});`)).join('')
  const query = `[out:json][timeout:20];(${selectors});out center 80;`
  /* the public Overpass instances rate-limit independently: rotate on failure */
  const MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ]
  let data = null
  for (const url of MIRRORS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      })
      if (!r.ok) continue
      data = await r.json()
      break
    } catch { /* next mirror */ }
  }
  if (!data) throw new Error('overpass')
  const seen = new Set()
  const out = (data.elements ?? [])
    .map((el) => ({
      id: `osm-${el.type}-${el.id}`,
      name: el.tags?.name,
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
      cat: CAT_KEYS.find((c) =>
        CATS[c].osm.some((sel) => {
          const m = sel.match(/\[(\w+)=(\w+)\]/)
          return m && el.tags?.[m[1]] === m[2]
        })) ?? 'attraction',
    }))
    .filter((p) => p.name && p.lat != null && !seen.has(p.name) && seen.add(p.name))
  cache.set(key, out)
  return out
}

const poiIcon = (cat) =>
  L.divIcon({
    className: '',
    html: `<div class="poi-pin" style="--poi:${CATS[cat].color}"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${CATS[cat].svg}</svg></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

/* ---------- markers (inside the MapContainer) ---------- */

export function PoiMarkers() {
  const map = useMap()
  const { enabled, source, cats, results } = usePoi()
  const trip = useTrip((s) => activeTrip(s))
  const insertItemAt = useTrip((s) => s.insertItemAt)
  const debounce = useRef(null)

  const load = () => {
    if (!usePoi.getState().enabled || usePoi.getState().source !== 'all') return
    if (map.getZoom() < 12) { usePoi.setState({ results: [], zoomHint: true }); return }
    usePoi.setState({ zoomHint: false, loading: true })
    const active = CAT_KEYS.filter((k) => usePoi.getState().cats[k])
    fetchPois(map.getBounds(), active)
      .then((r) => usePoi.setState({ results: r }))
      .catch(() => toast('Ricerca luoghi non disponibile, riprova tra poco'))
      .finally(() => usePoi.setState({ loading: false }))
  }

  useMapEvents({
    moveend() {
      clearTimeout(debounce.current)
      debounce.current = setTimeout(load, 500)
    },
  })
  useEffect(() => { load() /* on toggle/source/cats change */ }, [enabled, source, JSON.stringify(cats)]) // eslint-disable-line react-hooks/exhaustive-deps

  const markers = useMemo(() => {
    if (!enabled) return []
    if (source === 'trip') {
      return trip.days.flatMap((d) =>
        d.items
          .filter((it) => it.lat != null && ITEM_CAT[it.type])
          .map((it) => ({ id: `t-${it.id}`, name: it.title, lat: it.lat, lng: it.lng, cat: ITEM_CAT[it.type], inTrip: true })),
      ).filter((p) => cats[p.cat])
    }
    if (source === 'suggestions') {
      return trip.suggestions
        .filter((s) => s.lat != null && ITEM_CAT[s.type])
        .map((s) => ({ id: `s-${s.id}`, name: s.title, lat: s.lat, lng: s.lng, cat: ITEM_CAT[s.type], sug: true }))
        .filter((p) => cats[p.cat])
    }
    return results.filter((p) => cats[p.cat])
  }, [enabled, source, cats, results, trip])

  const addToTrip = (p) => {
    const spot = bestInsertion(trip, p)
    if (!spot) return
    const dayIndex = trip.days.findIndex((d) => d.id === spot.dayId)
    insertItemAt(spot.dayId, spot.index, {
      type: p.cat === 'restaurant' || p.cat === 'cafe' ? 'food' : p.cat === 'hotel' ? 'hotel' : 'activity',
      title: p.name, time: '', dur: 60, notes: '', links: [], must: false, done: false,
      lat: p.lat, lng: p.lng, imgs: [], noWiki: false, sug: null, price: 0,
    })
    toast(`Aggiunto al Giorno ${dayIndex + 1} nel punto ottimale del percorso`)
  }

  if (!enabled) return null
  return markers.map((p) => (
    <Marker key={p.id} position={[p.lat, p.lng]} icon={poiIcon(p.cat)}>
      <Popup>
        <div className="min-w-40 max-w-56">
          <div className="font-display text-[13px] font-bold text-ink-900">{p.name}</div>
          <div className="mt-0.5 text-[11px] text-ink-500">{CATS[p.cat].label}{p.inTrip ? ' · già nel viaggio' : p.sug ? ' · nei consigli' : ''}</div>
          {!p.inTrip && (
            <button
              onClick={() => addToTrip(p)}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-600"
            >
              <Plus size={11} strokeWidth={3} /> Aggiungi al viaggio
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  ))
}

/* ---------- control (overlay, next to the fit button) ---------- */

export function PoiControl() {
  const { enabled, source, cats, loading, zoomHint, toggle, setSource, toggleCat } = usePoi()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className="pointer-events-auto relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!enabled) toggle() }}
        title="Mostra luoghi sulla mappa"
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold shadow-lg backdrop-blur transition ${
          enabled ? 'border-violet-400 bg-white text-violet-700' : 'border-ink-200 bg-white/95 text-ink-700 hover:border-violet-400 hover:text-violet-600'
        }`}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <MapPinned size={14} />}
        <span className="hidden sm:inline">Luoghi</span>
      </button>

      {open && (
        <div className="anim-fade-up absolute bottom-[calc(100%+8px)] left-0 z-[600] w-64 rounded-2xl border border-ink-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-display text-[12.5px] font-bold text-ink-900">Luoghi sulla mappa</h4>
            <button
              onClick={() => { toggle(); if (enabled) setOpen(false) }}
              className={`rounded-lg px-2 py-1 text-[10.5px] font-bold transition ${enabled ? 'bg-violet-100 text-violet-700' : 'bg-ink-100 text-ink-500'}`}
            >
              {enabled ? 'Attivo' : 'Spento'}
            </button>
          </div>

          {/* source */}
          <div className="mb-2.5 flex rounded-lg bg-ink-100 p-0.5">
            {[['all', 'Tutti'], ['trip', 'Nel viaggio'], ['suggestions', 'Consigli']].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setSource(k)}
                className={`flex-1 rounded-md py-1 text-[10.5px] font-bold transition ${
                  source === k ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* categories */}
          <div className="flex flex-col gap-0.5">
            {CAT_KEYS.map((k) => {
              const c = CATS[k]
              const on = cats[k]
              return (
                <button key={k} onClick={() => toggleCat(k)} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-ink-50">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md text-white" style={{ background: on ? c.color : '#cbd5e1' }}>
                    <c.Icon size={13} />
                  </span>
                  <span className={`flex-1 text-[12px] font-semibold ${on ? 'text-ink-800' : 'text-ink-400'}`}>{c.label}</span>
                  <span className={`grid size-4 place-items-center rounded border-[1.5px] transition ${on ? 'border-violet-500 bg-violet-500 text-white' : 'border-ink-300 text-transparent'}`}>
                    <Check size={10} strokeWidth={3.5} />
                  </span>
                </button>
              )
            })}
          </div>

          {zoomHint && source === 'all' && (
            <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[10.5px] font-semibold leading-snug text-amber-700">
              Avvicina la mappa per scoprire i luoghi della zona
            </p>
          )}
        </div>
      )}
    </div>
  )
}
