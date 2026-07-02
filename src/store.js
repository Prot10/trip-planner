import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import seedData from './data/seed.json'
import { normalizeTrip, uid, DAY_COLORS } from './lib/utils'

const seed = () => normalizeTrip(structuredClone(seedData))

const blankTrip = (title) =>
  normalizeTrip({
    title: title || 'Nuovo viaggio',
    subtitle: '',
    startDate: '',
    days: [{ title: 'Giorno 1', night: '', color: DAY_COLORS[0], items: [] }],
    checklist: [],
  })

/* default nightly prices used when migrating older saves without prices */
const LEGACY_HOTEL_PRICES = [180, 220, 230, 230, 250, 170, 0]

export const activeTrip = (s) => s.trips.find((t) => t.id === s.activeId)

/* apply fn to the active trip */
const upd = (s, fn) => ({ trips: s.trips.map((t) => (t.id === s.activeId ? fn(t) : t)) })

export const useTrip = create(
  persist(
    (set) => ({
      trips: [seed()],
      activeId: null,

      /* ---------- trips (dashboard) ---------- */
      openTrip: (id) => set({ activeId: id }),
      closeTrip: () => set({ activeId: null }),
      createTrip: (title) => {
        const t = blankTrip(title)
        set((s) => ({ trips: [...s.trips, t], activeId: t.id }))
        return t.id
      },
      deleteTrip: (id) =>
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),
      duplicateTrip: (id) =>
        set((s) => {
          const src = s.trips.find((t) => t.id === id)
          if (!src) return {}
          const copy = normalizeTrip({ ...structuredClone(src), id: undefined, title: `${src.title} (copia)` })
          copy.id = uid()
          copy.days.forEach((d) => { d.id = uid(); d.items.forEach((it) => { it.id = uid() }) })
          copy.checklist.forEach((c) => { c.id = uid() })
          return { trips: [...s.trips, copy] }
        }),
      importNewTrip: (raw) => {
        const t = normalizeTrip({ ...raw, id: undefined })
        t.id = uid()
        set((s) => ({ trips: [...s.trips, t] }))
        return t.id
      },

      /* ---------- trip meta ---------- */
      setTitle: (title) => set((s) => upd(s, (t) => ({ ...t, title: title.trim() || 'Il mio viaggio' }))),
      setStartDate: (startDate) => set((s) => upd(s, (t) => ({ ...t, startDate }))),
      setCar: (patch) => set((s) => upd(s, (t) => ({ ...t, car: { ...t.car, ...patch } }))),

      /* ---------- days ---------- */
      addDay: (data) =>
        set((s) => upd(s, (t) => ({
          ...t,
          days: [...t.days, {
            id: uid(),
            title: data.title || 'Nuovo giorno',
            night: data.night || '',
            color: data.color || DAY_COLORS[t.days.length % DAY_COLORS.length],
            items: [],
          }],
        }))),
      updateDay: (dayId, patch) =>
        set((s) => upd(s, (t) => ({
          ...t, days: t.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
        }))),
      removeDay: (dayId) =>
        set((s) => upd(s, (t) => ({ ...t, days: t.days.filter((d) => d.id !== dayId) }))),
      insertDayAt: (index, day) =>
        set((s) => upd(s, (t) => {
          const days = [...t.days]
          days.splice(Math.max(0, Math.min(index, days.length)), 0, day)
          return { ...t, days }
        })),
      moveDay: (dayId, dir) =>
        set((s) => upd(s, (t) => {
          const days = [...t.days]
          const i = days.findIndex((d) => d.id === dayId)
          const j = i + dir
          if (i < 0 || j < 0 || j >= days.length) return t
          ;[days[i], days[j]] = [days[j], days[i]]
          return { ...t, days }
        })),

      /* ---------- items ---------- */
      addItem: (dayId, item) =>
        set((s) => upd(s, (t) => ({
          ...t,
          days: t.days.map((d) => (d.id === dayId ? { ...d, items: [...d.items, { ...item, id: item.id ?? uid() }] } : d)),
        }))),
      insertItemAt: (dayId, index, item) =>
        set((s) => upd(s, (t) => ({
          ...t,
          days: t.days.map((d) => {
            if (d.id !== dayId) return d
            const items = [...d.items]
            items.splice(Math.max(0, Math.min(index, items.length)), 0, { ...item, id: item.id ?? uid() })
            return { ...d, items }
          }),
        }))),
      updateItem: (dayId, itemId, patch) =>
        set((s) => upd(s, (t) => ({
          ...t,
          days: t.days.map((d) =>
            d.id === dayId
              ? { ...d, items: d.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
              : d),
        }))),
      removeItem: (dayId, itemId) =>
        set((s) => upd(s, (t) => ({
          ...t,
          days: t.days.map((d) => (d.id === dayId ? { ...d, items: d.items.filter((it) => it.id !== itemId) } : d)),
        }))),
      removeSuggestionItem: (sugId) =>
        set((s) => upd(s, (t) => ({
          ...t,
          days: t.days.map((d) => ({ ...d, items: d.items.filter((it) => it.sug !== sugId) })),
        }))),
      toggleDone: (dayId, itemId) =>
        set((s) => upd(s, (t) => ({
          ...t,
          days: t.days.map((d) =>
            d.id === dayId
              ? { ...d, items: d.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)) }
              : d),
        }))),
      relocateItem: (itemId, targetDayId, targetIndex) =>
        set((s) => upd(s, (t) => {
          const days = t.days.map((d) => ({ ...d, items: [...d.items] }))
          const from = days.find((d) => d.items.some((it) => it.id === itemId))
          const to = days.find((d) => d.id === targetDayId)
          if (!from || !to) return t
          const idx = from.items.findIndex((it) => it.id === itemId)
          const [moved] = from.items.splice(idx, 1)
          to.items.splice(Math.max(0, Math.min(targetIndex, to.items.length)), 0, moved)
          return { ...t, days }
        })),

      /* ---------- checklist ---------- */
      addCheck: (text, id) =>
        set((s) => upd(s, (t) => ({
          ...t, checklist: [...t.checklist, { id: id ?? uid(), text, done: false, link: '' }],
        }))),
      insertCheckAt: (index, item) =>
        set((s) => upd(s, (t) => {
          const checklist = [...t.checklist]
          checklist.splice(Math.max(0, Math.min(index, checklist.length)), 0, item)
          return { ...t, checklist }
        })),
      toggleCheck: (id) =>
        set((s) => upd(s, (t) => ({
          ...t, checklist: t.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
        }))),
      removeCheck: (id) =>
        set((s) => upd(s, (t) => ({ ...t, checklist: t.checklist.filter((c) => c.id !== id) }))),

      /* ---------- import / reset (active trip) ---------- */
      importTrip: (raw) =>
        set((s) => upd(s, (t) => {
          const next = normalizeTrip({ ...raw, id: undefined })
          next.id = t.id
          return next
        })),
      resetTrip: () =>
        set((s) => upd(s, (t) => {
          const next = seed()
          next.id = t.id
          return next
        })),
    }),
    {
      name: 'tripplanner.v2',
      version: 5,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ trips: s.trips, activeId: s.activeId }),
      migrate: (persisted, fromVersion) => {
        /* v≤3 stored a single { trip } */
        let trips
        if (persisted?.trip) trips = [normalizeTrip(persisted.trip)]
        else trips = (persisted?.trips ?? [seedData]).map((t) => normalizeTrip(t))

        if (fromVersion < 3) {
          for (const t of trips) {
            const d1 = t.days[0]
            if (d1 && !d1.items.some((it) => it.title === 'Partenza da Pasadena')) {
              d1.items.unshift({
                id: uid(), type: 'activity', time: '06:45', dur: 15,
                title: 'Partenza da Pasadena',
                notes: "Punto di partenza e di arrivo dell'anello. Benzina piena, caffè in mano e via sulla US-101.",
                links: [], must: false, done: false,
                lat: 34.1478, lng: -118.1445, img: '', sug: null, price: 0,
              })
            }
            if (!t.startDate || t.startDate === '2026-07-02') t.startDate = '2026-07-25'
          }
        }
        if (fromVersion < 4) {
          /* give pre-existing hotel nights a sensible default price */
          for (const t of trips) {
            t.days.forEach((d, di) => {
              d.items.forEach((it) => {
                if (it.type === 'hotel' && !it.price) it.price = LEGACY_HOTEL_PRICES[di] ?? 0
              })
            })
          }
        }
        if (fromVersion < 5) {
          /* copy the seed's known fees/meal estimates onto matching items */
          const seedCosts = new Map()
          for (const d of seedData.days) for (const it of d.items) if (it.price) seedCosts.set(it.title, it.price)
          for (const t of trips) {
            for (const d of t.days) {
              for (const it of d.items) {
                if (!it.price && seedCosts.has(it.title)) it.price = seedCosts.get(it.title)
              }
            }
          }
        }
        return { trips, activeId: null }
      },
    },
  ),
)

/* road distances published by the map (dayId -> km, from OSRM) */
export const useRoutes = create(() => ({ byDay: {} }))

/* ---------- ephemeral UI state (not persisted) ---------- */
export const useUI = create((set) => ({
  tab: 'itinerary',            // itinerary | map | suggestions | checklist  (mobile tabs)
  setTab: (tab) => set({ tab }),

  mapFilter: null,
  setMapFilter: (mapFilter) => set({ mapFilter }),

  flyTo: null,
  setFlyTo: (flyTo) => set({ flyTo }),

  focusItemId: null,
  focusColor: null,
  setFocusItem: (focusItemId, focusColor) => set({ focusItemId, focusColor }),

  detail: null,                // { dayId, itemId } — item detail card with photo carousel
  openDetail: (dayId, itemId) => set({ detail: { dayId, itemId } }),
  closeDetail: () => set({ detail: null }),

  editor: null,                // { dayId, itemId|null, draft|null }
  openEditor: (dayId, itemId = null, draft = null) => set({ editor: { dayId, itemId, draft }, detail: null }),
  closeEditor: () => set({ editor: null, picking: false }),

  dayEditor: null,
  openDayEditor: (dayId = null) => set({ dayEditor: { dayId } }),
  closeDayEditor: () => set({ dayEditor: null }),

  picking: false,
  setPicking: (picking) => set({ picking }),

  confirm: null,
  ask: (message, onYes) => set({ confirm: { message, onYes } }),
  closeConfirm: () => set({ confirm: null }),

  toast: null,
  toastTimer: null,
}))

export function toast(message) {
  const { toastTimer } = useUI.getState()
  if (toastTimer) clearTimeout(toastTimer)
  const timer = setTimeout(() => useUI.setState({ toast: null, toastTimer: null }), 2600)
  useUI.setState({ toast: message, toastTimer: timer })
}
