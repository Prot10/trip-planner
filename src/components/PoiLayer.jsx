import { useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  MapPinned, Landmark, UtensilsCrossed, Coffee, BedDouble, TreePine, FerrisWheel, Plus, Check,
} from 'lucide-react'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { bestInsertion } from '../lib/geo'

/* ---------- categories: color, icons (lucide, inlined for divIcon) ---------- */

const CATS = {
  attraction: {
    label: 'Attrazioni', Icon: FerrisWheel, color: '#8b5cf6',
    svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v4m6.8-1.2-2.9 2.9M22 12h-4m1.2 6.8-2.9-2.9M12 22v-4m-6.8 1.2 2.9-2.9M2 12h4M4.8 5.2l2.9 2.9"/>',
  },
  museum: {
    label: 'Musei', Icon: Landmark, color: '#f59e0b',
    svg: '<path d="M3 22h18M6 18v-7m4 7v-7m4 7v-7m4 7v-7M12 2l8 5H4z"/>',
  },
  restaurant: {
    label: 'Ristoranti', Icon: UtensilsCrossed, color: '#f43f5e',
    svg: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  },
  cafe: {
    label: 'Caffè & bar', Icon: Coffee, color: '#b45309',
    svg: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>',
  },
  hotel: {
    label: 'Hotel', Icon: BedDouble, color: '#0ea5e9',
    svg: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M2 17h20"/>',
  },
  park: {
    label: 'Natura', Icon: TreePine, color: '#10b981',
    svg: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17ZM12 22v-3"/>',
  },
}
const CAT_KEYS = Object.keys(CATS)

/* the trip stores only activity/food/hotel: the finer category comes from the title */
const CAFE_RE = /caff|café|cafe\b|coffee|bar\b|pasticc|bakery|gelat|pub\b|birreria|enoteca/i
const MUSEUM_RE = /museo|museum|galleria|gallery|pinacoteca|mostra|exhibition/i
const PARK_RE = /parco|park\b|giardin|garden|bosco|forest|lago|lake\b|cascat|falls|spiaggia|beach|sentiero|trail|monte|mount|riserva|oasi|zoo\b|acquario|aquarium/i
function classify(type, title = '') {
  if (type === 'hotel') return 'hotel'
  if (type === 'food') return CAFE_RE.test(title) ? 'cafe' : 'restaurant'
  if (MUSEUM_RE.test(title)) return 'museum'
  if (PARK_RE.test(title)) return 'park'
  return 'attraction'
}

export const usePoi = create((set) => ({
  enabled: false,
  source: 'all', // all | trip | suggestions
  cats: { attraction: true, museum: true, restaurant: true, cafe: true, hotel: true, park: true },
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  setSource: (source) => set({ source }),
  toggleCat: (k) => set((s) => ({ cats: { ...s.cats, [k]: !s.cats[k] } })),
}))

if (import.meta.env.DEV && typeof window !== 'undefined') window.__poi = usePoi

const poiIcon = (cat) =>
  L.divIcon({
    className: '',
    html: `<div class="poi-pin" style="--poi:${CATS[cat].color}"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${CATS[cat].svg}</svg></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

/* ---------- markers (inside the MapContainer) ---------- */

export function PoiMarkers() {
  const { enabled, source, cats } = usePoi()
  const trip = useTrip((s) => activeTrip(s))
  const insertItemAt = useTrip((s) => s.insertItemAt)
  const setFocusItem = useUI((s) => s.setFocusItem)
  const setTab = useUI((s) => s.setTab)

  const markers = useMemo(() => {
    if (!enabled) return []
    const out = []
    if (source !== 'suggestions') {
      trip.days.forEach((d, di) => {
        for (const it of d.items) {
          if (it.lat == null || it.type === 'drive' || it.type === 'info') continue
          out.push({
            id: `t-${it.id}`, name: it.title, lat: it.lat, lng: it.lng,
            cat: classify(it.type, it.title), inTrip: true, itemId: it.id, dayIndex: di, color: d.color,
          })
        }
      })
    }
    if (source !== 'trip') {
      /* an activated suggestion already shows as a trip stop: skip its double */
      const activeSugs = new Set(trip.days.flatMap((d) => d.items.map((it) => it.sug).filter(Boolean)))
      for (const s of trip.suggestions) {
        if (s.lat == null || activeSugs.has(s.id)) continue
        out.push({ id: `s-${s.id}`, name: s.title, lat: s.lat, lng: s.lng, cat: classify(s.type, s.title), sug: s })
      }
    }
    return out.filter((p) => cats[p.cat])
  }, [enabled, source, cats, trip])

  /* activating from the map mirrors the Consigli panel (tracked via item.sug) */
  const addSugToTrip = (sug) => {
    const spot = bestInsertion(trip, sug)
    if (!spot) return
    const dayIndex = trip.days.findIndex((d) => d.id === spot.dayId)
    insertItemAt(spot.dayId, spot.index, {
      type: sug.type, title: sug.title, time: '', dur: sug.dur, notes: sug.notes,
      links: sug.links ?? [], must: !!sug.must, done: false, lat: sug.lat, lng: sug.lng, sug: sug.id,
    })
    toast(`Aggiunto al Giorno ${dayIndex + 1} nel punto ottimale del percorso`)
  }

  if (!enabled) return null
  return markers.map((p) => (
    <Marker key={p.id} position={[p.lat, p.lng]} icon={poiIcon(p.cat)}>
      <Popup>
        <div className="min-w-40 max-w-56">
          <div className="font-display text-[13px] font-bold text-ink-900">{p.name}</div>
          <div className="mt-0.5 text-[11px] text-ink-500">
            {CATS[p.cat].label}{p.inTrip ? ` · Giorno ${p.dayIndex + 1}` : ' · nei consigli'}
          </div>
          {p.inTrip ? (
            <button
              onClick={() => { setFocusItem(p.itemId, p.color); if (window.innerWidth < 1024) setTab('itinerary') }}
              className="mt-2 rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-ink-700"
            >
              Vedi nel programma
            </button>
          ) : (
            <button
              onClick={() => addSugToTrip(p.sug)}
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
  const { enabled, source, cats, toggle, setSource, toggleCat } = usePoi()
  const nSuggestions = useTrip((s) => activeTrip(s)?.suggestions.length ?? 0)
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
        <MapPinned size={14} />
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

          {source !== 'trip' && nSuggestions === 0 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[10.5px] font-semibold leading-snug text-amber-700">
              Nessun consiglio ancora: chiedi a Ulisse idee extra e le vedrai qui sulla mappa
            </p>
          )}
        </div>
      )}
    </div>
  )
}
