import { useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { MapPinned, Plus, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { bestInsertion } from '../lib/geo'
import { CATS, CAT_KEYS, classify } from '../lib/categories'
import i18n from '../i18n'

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
  const { t } = useTranslation()
  const { enabled, source, cats } = usePoi()
  const trip = useTrip((s) => activeTrip(s))
  const insertItemAt = useTrip((s) => s.insertItemAt)
  const setFocusItem = useUI((s) => s.setFocusItem)
  const revealList = useUI((s) => s.revealList)

  const markers = useMemo(() => {
    if (!enabled) return []
    const out = []
    if (source !== 'suggestions') {
      trip.days.forEach((d, di) => {
        for (const it of d.items) {
          if (it.lat == null || it.type === 'drive' || it.type === 'info') continue
          out.push({
            id: `t-${it.id}`, name: it.title, lat: it.lat, lng: it.lng,
            cat: it.category ?? classify(it.type, it.title), inTrip: true, itemId: it.id, dayIndex: di, color: d.color,
          })
        }
      })
    }
    if (source !== 'trip') {
      /* an activated suggestion already shows as a trip stop: skip its double */
      const activeSugs = new Set(trip.days.flatMap((d) => d.items.map((it) => it.sug).filter(Boolean)))
      for (const s of trip.suggestions) {
        if (s.lat == null || activeSugs.has(s.id)) continue
        out.push({ id: `s-${s.id}`, name: s.title, lat: s.lat, lng: s.lng, cat: s.category ?? classify(s.type, s.title), sug: s })
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
      links: sug.links ?? [], must: !!sug.must, done: false, lat: sug.lat, lng: sug.lng,
      sug: sug.id, category: sug.category ?? classify(sug.type, sug.title),
    })
    toast(i18n.t('toasts.addedOptimal', { n: dayIndex + 1 }))
  }

  if (!enabled) return null
  return markers.map((p) => (
    <Marker key={p.id} position={[p.lat, p.lng]} icon={poiIcon(p.cat)}>
      <Popup>
        <div className="min-w-40 max-w-56">
          <div className="font-display text-[13px] font-bold text-ink-900">{p.name}</div>
          <div className="mt-0.5 text-[11px] text-ink-500">
            {t(CATS[p.cat].labelKey)}{p.inTrip ? ` · ${t('common.dayN', { n: p.dayIndex + 1 })}` : ` · ${t('map.poi.inSuggestions')}`}
          </div>
          {p.inTrip ? (
            <button
              onClick={() => { setFocusItem(p.itemId, p.color); revealList('itinerary') }}
              className="mt-2 rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-ink-700"
            >
              {t('common.seeInItinerary')}
            </button>
          ) : (
            <button
              onClick={() => addSugToTrip(p.sug)}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-600"
            >
              <Plus size={11} strokeWidth={3} /> {t('common.addToTrip')}
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  ))
}

/* ---------- control (overlay, next to the fit button) ---------- */

export function PoiControl() {
  const { t } = useTranslation()
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
        title={t('map.poi.showTitle')}
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold shadow-lg backdrop-blur transition ${
          enabled ? 'border-violet-400 bg-white text-violet-700' : 'border-ink-200 bg-white/95 text-ink-700 hover:border-violet-400 hover:text-violet-600'
        }`}
      >
        <MapPinned size={14} />
        <span className="hidden sm:inline">{t('map.poi.button')}</span>
      </button>

      {open && (
        <div className="anim-fade-up absolute bottom-[calc(100%+8px)] left-0 z-[600] w-64 rounded-2xl border border-ink-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-display text-[12.5px] font-bold text-ink-900">{t('map.poi.title')}</h4>
            <button
              onClick={() => { toggle(); if (enabled) setOpen(false) }}
              className={`rounded-lg px-2 py-1 text-[10.5px] font-bold transition ${enabled ? 'bg-violet-100 text-violet-700' : 'bg-ink-100 text-ink-500'}`}
            >
              {enabled ? t('map.poi.on') : t('map.poi.off')}
            </button>
          </div>

          {/* source */}
          <div className="mb-2.5 flex rounded-lg bg-ink-100 p-0.5">
            {[['all', t('map.poi.srcAll')], ['trip', t('map.poi.srcTrip')], ['suggestions', t('map.poi.srcSuggestions')]].map(([k, label]) => (
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
                  <span className={`flex-1 text-[12px] font-semibold ${on ? 'text-ink-800' : 'text-ink-400'}`}>{t(c.labelKey)}</span>
                  <span className={`grid size-4 place-items-center rounded border-[1.5px] transition ${on ? 'border-violet-500 bg-violet-500 text-white' : 'border-ink-300 text-transparent'}`}>
                    <Check size={10} strokeWidth={3.5} />
                  </span>
                </button>
              )
            })}
          </div>

          {source !== 'trip' && nSuggestions === 0 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[10.5px] font-semibold leading-snug text-amber-700">
              {t('map.poi.emptyHint')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
