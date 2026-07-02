/* Executes agent tool calls against the live zustand store — this is what
   makes every agent edit appear instantly in the UI. Runs in the browser,
   invoked by the WebSocket bridge (see socket.js). */

import { useTrip, useUI, useRoutes, activeTrip } from '../store'
import { bestInsertion, searchPlaces, chainedDayCoords, estimateDayKm } from '../lib/geo'
import { SUGGESTIONS } from '../data/suggestions'
import { dayDate, fmtDate, costByType, fuelCostUsd, uid } from '../lib/utils'
import { getPlaceImages } from '../components/ItemImage'

export const WRITE_TOOLS = new Set([
  'add_activity', 'update_activity', 'remove_activity', 'move_activity',
  'add_day', 'update_day', 'remove_day', 'move_day', 'set_trip_meta',
  'checklist_add', 'checklist_toggle', 'checklist_remove', 'toggle_suggestion',
])

const trip = () => {
  const t = activeTrip(useTrip.getState())
  if (!t) throw new Error('Nessun viaggio aperto: apri un viaggio dalla dashboard.')
  return t
}

const dayByNumber = (n) => {
  const d = trip().days[n - 1]
  if (!d) throw new Error(`Il giorno ${n} non esiste (il viaggio ha ${trip().days.length} giorni).`)
  return d
}

const findItem = (itemId) => {
  for (const [di, d] of trip().days.entries()) {
    const it = d.items.find((i) => i.id === itemId)
    if (it) return { day: d, dayNumber: di + 1, item: it }
  }
  throw new Error(`Attività ${itemId} non trovata: rileggi lo stato con get_trip.`)
}

const flash = (itemId, color) => useUI.getState().setFocusItem(itemId, color)

/* map agent-facing fields -> store item fields */
const toPatch = (a) => {
  const p = {}
  if (a.title !== undefined) p.title = a.title
  if (a.type !== undefined) p.type = a.type
  if (a.time !== undefined) p.time = a.time
  if (a.duration_min !== undefined) p.dur = a.duration_min
  if (a.price_usd !== undefined) p.price = a.price_usd
  if (a.notes !== undefined) p.notes = a.notes
  if (a.links !== undefined) p.links = a.links
  if (a.must_see !== undefined) p.must = a.must_see
  if (a.done !== undefined) p.done = a.done
  if (a.lat !== undefined) p.lat = a.lat
  if (a.lng !== undefined) p.lng = a.lng
  return p
}

const itemView = (it) => ({
  item_id: it.id,
  type: it.type,
  title: it.title,
  time: it.time || undefined,
  duration_min: it.dur || undefined,
  price_usd: it.price || undefined,
  must_see: it.must || undefined,
  done: it.done || undefined,
  lat: it.lat ?? undefined,
  lng: it.lng ?? undefined,
  notes: it.notes ? (it.notes.length > 160 ? it.notes.slice(0, 157) + '…' : it.notes) : undefined,
})

const EXECUTORS = {
  get_trip() {
    const t = trip()
    const costs = costByType(t)
    const km = chainedDayCoords(t).reduce((s, l) => {
      const road = useRoutes.getState().byDay[l.dayId]
      return s + (road ?? estimateDayKm(l.coords))
    }, 0)
    return {
      title: t.title,
      start_date: t.startDate || null,
      car: { l_per_100km: t.car.lPer100, gas_usd_per_gal: t.car.gasPerGal },
      budget_usd: { ...costs, fuel: Math.round(fuelCostUsd(km, t.car)), total: Math.round(costs.items + fuelCostUsd(km, t.car)) },
      total_km: Math.round(km),
      days: t.days.map((d, i) => ({
        day_number: i + 1,
        title: d.title,
        night: d.night || undefined,
        date: t.startDate ? fmtDate(dayDate(t.startDate, i), { weekday: 'short', day: 'numeric', month: 'short' }) : undefined,
        items: d.items.map(itemView),
      })),
      checklist: t.checklist.map((c) => ({ check_id: c.id, text: c.text, done: c.done })),
    }
  },

  add_activity(a) {
    const t = trip()
    const item = {
      id: uid(),
      type: a.type ?? 'activity',
      title: a.title,
      time: a.time ?? '',
      dur: a.duration_min ?? 0,
      notes: a.notes ?? '',
      links: a.links ?? [],
      must: !!a.must_see,
      done: false,
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      imgs: [],
      noWiki: false,
      sug: null,
      price: a.price_usd ?? 0,
    }
    let dayId, index
    const wantsOptimal = a.optimal_placement ?? a.day_number == null
    if (wantsOptimal && item.lat != null) {
      const spot = bestInsertion(t, { lat: item.lat, lng: item.lng })
      dayId = spot.dayId
      index = spot.index
    } else if (a.day_number != null) {
      const d = dayByNumber(a.day_number)
      dayId = d.id
      index = a.index ?? d.items.length
    } else {
      throw new Error('Serve day_number oppure lat/lng (con optimal_placement) per aggiungere la tappa.')
    }
    useTrip.getState().insertItemAt(dayId, index, item)
    const dayNumber = trip().days.findIndex((d) => d.id === dayId) + 1
    flash(item.id, trip().days[dayNumber - 1].color)
    return { ok: true, item_id: item.id, day_number: dayNumber, index }
  },

  update_activity(a) {
    const { day, item } = findItem(a.item_id)
    useTrip.getState().updateItem(day.id, item.id, toPatch(a))
    flash(item.id, day.color)
    return { ok: true, item: itemView({ ...item, ...toPatch(a) }) }
  },

  remove_activity(a) {
    const { day, item } = findItem(a.item_id)
    useTrip.getState().removeItem(day.id, item.id)
    return { ok: true, removed: item.title }
  },

  move_activity(a) {
    const { item } = findItem(a.item_id)
    let dayId, index
    if ((a.optimal_placement ?? a.day_number == null) && item.lat != null) {
      const spot = bestInsertion(trip(), { lat: item.lat, lng: item.lng })
      dayId = spot.dayId
      index = spot.index
    } else if (a.day_number != null) {
      const d = dayByNumber(a.day_number)
      dayId = d.id
      index = a.index ?? d.items.length
    } else {
      throw new Error('Serve day_number oppure optimal_placement (con posizione nota) per spostare la tappa.')
    }
    useTrip.getState().relocateItem(item.id, dayId, index)
    const dn = trip().days.findIndex((d) => d.id === dayId) + 1
    flash(item.id, trip().days[dn - 1].color)
    return { ok: true, day_number: dn, index }
  },

  add_day(a) {
    useTrip.getState().addDay({ title: a.title, night: a.night })
    return { ok: true, day_number: trip().days.length }
  },

  update_day(a) {
    const d = dayByNumber(a.day_number)
    const patch = {}
    if (a.title !== undefined) patch.title = a.title
    if (a.night !== undefined) patch.night = a.night
    useTrip.getState().updateDay(d.id, patch)
    return { ok: true }
  },

  remove_day(a) {
    const d = dayByNumber(a.day_number)
    useTrip.getState().removeDay(d.id)
    return { ok: true, removed: d.title }
  },

  move_day(a) {
    const d = dayByNumber(a.day_number)
    useTrip.getState().moveDay(d.id, a.direction === 'up' ? -1 : 1)
    return { ok: true }
  },

  set_trip_meta(a) {
    const s = useTrip.getState()
    if (a.title !== undefined) s.setTitle(a.title)
    if (a.start_date !== undefined) s.setStartDate(a.start_date)
    if (a.car_l_per_100km !== undefined) s.setCar({ lPer100: a.car_l_per_100km })
    if (a.car_gas_usd_per_gal !== undefined) s.setCar({ gasPerGal: a.car_gas_usd_per_gal })
    return { ok: true }
  },

  checklist_add(a) {
    useTrip.getState().addCheck(a.text)
    return { ok: true }
  },
  checklist_toggle(a) {
    if (!trip().checklist.some((c) => c.id === a.check_id)) throw new Error('Voce checklist non trovata.')
    useTrip.getState().toggleCheck(a.check_id)
    return { ok: true }
  },
  checklist_remove(a) {
    useTrip.getState().removeCheck(a.check_id)
    return { ok: true }
  },

  async search_places(a) {
    const results = await searchPlaces(a.query)
    if (!results.length) return { results: [], hint: 'Nessun risultato: prova ad aggiungere città o stato.' }
    return { results: results.slice(0, 5) }
  },

  async get_place_images(a) {
    const imgs = await getPlaceImages(a.lat, a.lng)
    if (!imgs.length) return { images: [], hint: 'Nessuna foto trovata per queste coordinate.' }
    return { images: imgs.slice(0, 5) }
  },

  list_suggestions() {
    const t = trip()
    const active = new Map()
    t.days.forEach((d, di) => d.items.forEach((it) => { if (it.sug) active.set(it.sug, di + 1) }))
    return {
      suggestions: SUGGESTIONS.map((s) => {
        const isOn = active.has(s.id)
        const spot = isOn ? null : bestInsertion(t, s)
        return {
          suggestion_id: s.id,
          title: s.title,
          type: s.type,
          duration_min: s.dur,
          recommended: !!s.must,
          active: isOn,
          day_number: isOn ? active.get(s.id) : t.days.findIndex((d) => d.id === spot?.dayId) + 1 || undefined,
          added_km: spot?.addedKm,
          notes: s.notes,
        }
      }),
    }
  },

  toggle_suggestion(a) {
    const sug = SUGGESTIONS.find((s) => s.id === a.suggestion_id)
    if (!sug) throw new Error(`Suggerimento "${a.suggestion_id}" inesistente: usa list_suggestions.`)
    const t = trip()
    const existing = t.days.flatMap((d) => d.items).find((i) => i.sug === sug.id)
    if (existing) {
      useTrip.getState().removeSuggestionItem(sug.id)
      return { ok: true, action: 'removed', title: sug.title }
    }
    const spot = bestInsertion(t, sug)
    const item = {
      id: uid(), type: sug.type, title: sug.title, time: '', dur: sug.dur, notes: sug.notes,
      links: sug.links ?? [], must: !!sug.must, done: false, lat: sug.lat, lng: sug.lng,
      imgs: [], noWiki: false, sug: sug.id, price: 0,
    }
    useTrip.getState().insertItemAt(spot.dayId, spot.index, item)
    const dn = trip().days.findIndex((d) => d.id === spot.dayId) + 1
    flash(item.id, trip().days[dn - 1].color)
    return { ok: true, action: 'added', title: sug.title, day_number: dn, added_km: spot.addedKm }
  },

  get_route_info() {
    const t = trip()
    const byDay = useRoutes.getState().byDay
    const chains = chainedDayCoords(t)
    const days = chains.map((l, i) => ({
      day_number: i + 1,
      road_km: Math.round(byDay[l.dayId] ?? estimateDayKm(l.coords)),
      declared_drive_min: t.days[i].items.filter((x) => x.type === 'drive').reduce((s, x) => s + (x.dur || 0), 0),
    }))
    return { days, total_km: days.reduce((s, d) => s + d.road_km, 0) }
  },
}

export async function executeTool(name, args) {
  const fn = EXECUTORS[name]
  if (!fn) throw new Error(`Tool sconosciuto: ${name}`)
  return await fn(args ?? {})
}
