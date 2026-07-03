/* Executes agent tool calls against the live zustand store — this is what
   makes every agent edit appear instantly in the UI. Runs in the browser,
   invoked by the WebSocket bridge (see socket.js).

   Every write returns two extra fields, stripped before reaching the model:
   - `undo`: the inverse operation (applyUndoOp) for single-edit revert
   - `detail`: humanized field changes for the per-turn edit review list */

import { useTrip, useUI, useRoutes, activeTrip } from '../store'
import { bestInsertion, searchPlaces, chainedDayCoords, estimateDayKm, estimateTravel } from '../lib/geo'
import { dayDate, fmtDate, costByType, fuelCost, uid, GAS_UNITS } from '../lib/utils'
import { getPlaceImages } from '../components/ItemImage'

export const WRITE_TOOLS = new Set([
  'add_activity', 'update_activity', 'remove_activity', 'move_activity',
  'add_day', 'update_day', 'remove_day', 'move_day', 'set_trip_meta',
  'checklist_add', 'checklist_toggle', 'checklist_remove', 'toggle_suggestion',
  'add_suggestion', 'remove_suggestion',
])

/* an answered question the agent hasn't written to the notebook yet:
   the next ask_user is refused until update_notes runs (models forget
   soft reminders; a hard tool error is impossible to ignore) */
let notesPending = false

/* callbacks registered by socket.js (avoids a module cycle) */
export const hooks = { onProgress: null, onStartPlanning: null, onAskUser: null, onNotebook: null }

const FIELD_LABELS = {
  title: 'titolo', type: 'tipo', time: 'orario', dur: 'durata', price: 'costo',
  notes: 'note', links: 'link', must: 'imperdibile', done: 'fatto',
  lat: 'posizione', lng: 'posizione', night: 'notte', startDate: 'partenza',
  lPer100: 'consumo', gasPrice: 'carburante', gasUnit: 'unità carburante', model: 'auto',
}

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
    const idx = d.items.findIndex((i) => i.id === itemId)
    if (idx >= 0) return { day: d, dayNumber: di + 1, index: idx, item: d.items[idx] }
  }
  throw new Error(`Attività ${itemId} non trovata: rileggi lo stato con get_trip.`)
}

const flash = (itemId, color) => useUI.getState().setFocusItem(itemId, color)

const fmtVal = (field, v) => {
  if (v == null || v === '') return '—'
  if (field === 'dur') return `${v} min`
  if (field === 'price') return `$${v}`
  if (field === 'must' || field === 'done') return v ? 'sì' : 'no'
  if (field === 'links') return `${v.length} link`
  if (typeof v === 'number') return String(Math.round(v * 1000) / 1000)
  return String(v).length > 40 ? String(v).slice(0, 37) + '…' : String(v)
}

const diffDetail = (prev, patch) => {
  const rows = []
  const seen = new Set()
  for (const k of Object.keys(patch)) {
    const label = FIELD_LABELS[k] ?? k
    if (seen.has(label)) continue
    seen.add(label)
    if (JSON.stringify(prev[k]) === JSON.stringify(patch[k])) continue
    rows.push({ field: label, from: fmtVal(k, prev[k]), to: fmtVal(k, patch[k]) })
  }
  return rows
}

/* map agent-facing fields -> store item fields */
const toPatch = (a) => {
  const p = {}
  if (a.title !== undefined) p.title = a.title
  if (a.type !== undefined) p.type = a.type
  if (a.transport_mode !== undefined) p.mode = a.transport_mode
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
  get_trip(a) {
    const t = trip()
    const costs = costByType(t)
    const km = chainedDayCoords(t).reduce((s, l) => {
      const road = useRoutes.getState().byDay[l.dayId]
      return s + (road ?? estimateDayKm(l.coords))
    }, 0)
    const dayFilter = a?.day_number
    return {
      title: t.title,
      start_date: t.startDate || null,
      transport: t.transport,
      brief: t.brief || undefined,
      notes: t.notes || undefined,
      currency: t.currency ?? 'USD',
      car: { model: t.car.model || undefined, l_per_100km: t.car.lPer100, gas_price: t.car.gasPrice, gas_unit: t.car.gasUnit },
      budget: { ...costs, fuel: Math.round(fuelCost(km, t.car, t.currency ?? 'USD')), total: Math.round(costs.items + fuelCost(km, t.car, t.currency ?? 'USD')) },
      total_km: Math.round(km),
      days: t.days
        .map((d, i) => ({
          day_number: i + 1,
          title: d.title,
          night: d.night || undefined,
          date: t.startDate ? fmtDate(dayDate(t.startDate, i), { weekday: 'short', day: 'numeric', month: 'short' }) : undefined,
          items: dayFilter && dayFilter !== i + 1 ? undefined : d.items.map(itemView),
          item_count: d.items.length,
        }))
        .filter((d) => !dayFilter || d.day_number === dayFilter || true),
      checklist: dayFilter ? undefined : t.checklist.map((c) => ({ check_id: c.id, text: c.text, done: c.done })),
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
      mode: (a.type ?? 'activity') === 'drive' ? (a.transport_mode ?? 'car') : null,
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
    return {
      ok: true, item_id: item.id, day_number: dayNumber, index,
      undo: { op: 'remove_item', dayId, itemId: item.id },
      detail: [
        { field: 'tappa', from: '—', to: item.title },
        ...(item.time ? [{ field: 'orario', from: '—', to: item.time }] : []),
        ...(item.price ? [{ field: 'costo', from: '—', to: `$${item.price}` }] : []),
      ],
    }
  },

  update_activity(a) {
    const { day, dayNumber, item } = findItem(a.item_id)
    const patch = toPatch(a)
    const prevPatch = Object.fromEntries(Object.keys(patch).map((k) => [k, item[k]]))
    useTrip.getState().updateItem(day.id, item.id, patch)
    flash(item.id, day.color)
    return {
      ok: true, item_id: item.id, day_number: dayNumber, item: itemView({ ...item, ...patch }),
      undo: { op: 'update_item', dayId: day.id, itemId: item.id, patch: prevPatch },
      detail: diffDetail(item, patch),
      title: item.title,
    }
  },

  remove_activity(a) {
    const { day, dayNumber, index, item } = findItem(a.item_id)
    useTrip.getState().removeItem(day.id, item.id)
    return {
      ok: true, removed: item.title, day_number: dayNumber,
      undo: { op: 'insert_item', dayId: day.id, index, item: structuredClone(item) },
      detail: [{ field: 'rimossa', from: item.title, to: '—' }],
      lat: item.lat, lng: item.lng,
    }
  },

  move_activity(a) {
    const { day: fromDay, dayNumber: fromN, index: fromIndex, item } = findItem(a.item_id)
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
    return {
      ok: true, item_id: item.id, day_number: dn, index, title: item.title,
      undo: { op: 'relocate_item', itemId: item.id, dayId: fromDay.id, index: fromIndex },
      detail: [{ field: 'giorno', from: `Giorno ${fromN}`, to: `Giorno ${dn}` }],
    }
  },

  add_day(a) {
    useTrip.getState().addDay({ title: a.title, night: a.night })
    const t = trip()
    const day = t.days[t.days.length - 1]
    return {
      ok: true, day_number: t.days.length,
      undo: { op: 'remove_day', dayId: day.id },
      detail: [{ field: 'giorno', from: '—', to: a.title }],
    }
  },

  update_day(a) {
    const d = dayByNumber(a.day_number)
    const patch = {}
    if (a.title !== undefined) patch.title = a.title
    if (a.night !== undefined) patch.night = a.night
    if (a.color !== undefined) patch.color = a.color
    const prev = Object.fromEntries(Object.keys(patch).map((k) => [k, d[k]]))
    useTrip.getState().updateDay(d.id, patch)
    return {
      ok: true, day_number: a.day_number,
      undo: { op: 'update_day', dayId: d.id, patch: prev },
      detail: diffDetail(d, patch),
    }
  },

  remove_day(a) {
    const d = dayByNumber(a.day_number)
    const index = a.day_number - 1
    useTrip.getState().removeDay(d.id)
    return {
      ok: true, removed: d.title,
      undo: { op: 'insert_day', index, day: structuredClone(d) },
      detail: [{ field: 'giorno rimosso', from: d.title, to: '—' }],
    }
  },

  move_day(a) {
    const d = dayByNumber(a.day_number)
    useTrip.getState().moveDay(d.id, a.direction === 'up' ? -1 : 1)
    return {
      ok: true,
      undo: { op: 'move_day', dayId: d.id, dir: a.direction === 'up' ? 1 : -1 },
      detail: [{ field: 'ordine', from: `posizione ${a.day_number}`, to: a.direction === 'up' ? `posizione ${a.day_number - 1}` : `posizione ${a.day_number + 1}` }],
    }
  },

  set_trip_meta(a) {
    const t = trip()
    const s = useTrip.getState()
    const prev = { title: t.title, startDate: t.startDate, car: { ...t.car }, subtitle: t.subtitle, transport: t.transport }
    const detail = []
    if (a.title !== undefined) { detail.push({ field: 'titolo', from: t.title, to: a.title }); s.setTitle(a.title) }
    if (a.subtitle !== undefined) { detail.push({ field: 'sottotitolo', from: t.subtitle || '—', to: a.subtitle }); s.setSubtitle(a.subtitle) }
    if (a.transport !== undefined) { detail.push({ field: 'trasporto', from: t.transport, to: a.transport }); s.setTransport(a.transport) }
    if (a.currency !== undefined) { detail.push({ field: 'valuta', from: t.currency ?? '—', to: a.currency }); s.setCurrency(a.currency) }
    if (a.start_date !== undefined) { detail.push({ field: 'partenza', from: t.startDate || '—', to: a.start_date }); s.setStartDate(a.start_date) }
    if (a.car_l_per_100km !== undefined) { detail.push({ field: 'consumo', from: `${t.car.lPer100} L/100km`, to: `${a.car_l_per_100km} L/100km` }); s.setCar({ lPer100: a.car_l_per_100km }) }
    if (a.car_model !== undefined) { detail.push({ field: 'auto', from: t.car.model || '—', to: a.car_model }); s.setCar({ model: a.car_model }) }
    if (a.car_gas_price !== undefined) {
      const unit = GAS_UNITS[a.car_gas_unit] ? a.car_gas_unit : t.car.gasUnit
      detail.push({ field: 'carburante', from: `${t.car.gasPrice} ${GAS_UNITS[t.car.gasUnit].short}`, to: `${a.car_gas_price} ${GAS_UNITS[unit].short}` })
      s.setCar({ gasPrice: a.car_gas_price, gasUnit: unit })
    } else if (a.car_gas_usd_per_gal !== undefined) {
      detail.push({ field: 'carburante', from: `${t.car.gasPrice} ${GAS_UNITS[t.car.gasUnit].short}`, to: `${a.car_gas_usd_per_gal} $/gal` })
      s.setCar({ gasPrice: a.car_gas_usd_per_gal, gasUnit: 'usd_gal' })
    }
    return { ok: true, undo: { op: 'set_meta', prev }, detail }
  },

  checklist_add(a) {
    const id = uid()
    useTrip.getState().addCheck(a.text, id)
    return {
      ok: true, check_id: id,
      undo: { op: 'check_remove', id },
      detail: [{ field: 'checklist', from: '—', to: a.text }],
    }
  },
  checklist_toggle(a) {
    const c = trip().checklist.find((c) => c.id === a.check_id)
    if (!c) throw new Error('Voce checklist non trovata.')
    useTrip.getState().toggleCheck(a.check_id)
    return {
      ok: true,
      undo: { op: 'check_toggle', id: a.check_id },
      detail: [{ field: c.text.slice(0, 40), from: c.done ? 'fatto' : 'da fare', to: c.done ? 'da fare' : 'fatto' }],
    }
  },
  checklist_remove(a) {
    const t = trip()
    const index = t.checklist.findIndex((c) => c.id === a.check_id)
    if (index < 0) throw new Error('Voce checklist non trovata.')
    const item = structuredClone(t.checklist[index])
    useTrip.getState().removeCheck(a.check_id)
    return {
      ok: true,
      undo: { op: 'check_insert', index, item },
      detail: [{ field: 'checklist', from: item.text, to: '—' }],
    }
  },

  set_trip_brief(a) {
    useTrip.getState().setBrief(a.brief)
    return { ok: true }
  },

  /* the agent's per-trip notebook: full-replace markdown memory */
  update_notes(a) {
    notesPending = false
    useTrip.getState().setNotes(a.notes ?? '')
    hooks.onNotebook?.()
    return { ok: true }
  },

  add_suggestion(a) {
    const sug = {
      id: uid(),
      title: a.title,
      type: ['activity', 'food', 'hotel'].includes(a.type) ? a.type : 'activity',
      dur: a.duration_min ?? 60,
      notes: a.notes ?? '',
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      must: !!a.recommended,
      links: [],
    }
    useTrip.getState().addSuggestion(sug)
    return {
      ok: true, suggestion_id: sug.id,
      undo: { op: 'remove_suggestion', id: sug.id },
      detail: [{ field: 'consiglio', from: '—', to: sug.title }],
    }
  },

  remove_suggestion(a) {
    const t = trip()
    const sug = t.suggestions.find((s) => s.id === a.suggestion_id)
    if (!sug) throw new Error('Consiglio non trovato: usa list_suggestions.')
    useTrip.getState().removeSuggestion(sug.id)
    return {
      ok: true,
      undo: { op: 'add_suggestion', sug: structuredClone(sug) },
      detail: [{ field: 'consiglio', from: sug.title, to: '—' }],
    }
  },

  start_planning(a) {
    const s = useTrip.getState()
    if (a.title) s.setTitle(a.title)
    if (a.subtitle) s.setSubtitle(a.subtitle)
    if (a.transport) s.setTransport(a.transport)
    if (a.start_date) s.setStartDate(a.start_date)
    if (a.car_l_per_100km) s.setCar({ lPer100: a.car_l_per_100km })
    if (a.car_gas_usd_per_gal) s.setCar({ gasPrice: a.car_gas_usd_per_gal, gasUnit: 'usd_gal' })
    s.setPhase('active')
    hooks.onStartPlanning?.()
    return { ok: true, note: "Planner aperto: l'utente ora vede itinerario e mappa. Prosegui con la pianificazione completa usando report_progress ad ogni fase." }
  },

  report_progress(a) {
    if (Array.isArray(a.steps) && a.steps.length) {
      for (const step of a.steps) hooks.onProgress?.({ step, status: 'pending' })
    }
    if (a.step) hooks.onProgress?.(a)
    return { ok: true }
  },

  /* interactive question card: resolves when the user answers in the UI.
     The reminder rides on every result: the model updates the notebook far
     more reliably when nudged in-band than by the system prompt alone. */
  ask_user(a) {
    if (!hooks.onAskUser) throw new Error('Interfaccia domande non disponibile.')
    if (notesPending) {
      throw new Error(
        "Risposta precedente non ancora annotata: chiama PRIMA update_notes col blocco note completo aggiornato, POI rifai questa domanda con ask_user.",
      )
    }
    return new Promise((resolve) =>
      hooks.onAskUser(a, (res) => {
        if (res?.ok) {
          notesPending = true
          resolve({ ...res, promemoria: 'Aggiorna ORA il blocco note con update_notes includendo questa risposta, prima della prossima domanda.' })
        } else {
          resolve(res)
        }
      }),
    )
  },

  async estimate_travel(a) {
    return await estimateTravel({ lat: a.from_lat, lng: a.from_lng }, { lat: a.to_lat, lng: a.to_lng }, a.mode)
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
      suggestions: t.suggestions.map((s) => {
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
    const sug = trip().suggestions.find((s) => s.id === a.suggestion_id)
    if (!sug) throw new Error(`Suggerimento "${a.suggestion_id}" inesistente: usa list_suggestions.`)
    const t = trip()
    const found = (() => {
      for (const d of t.days) {
        const idx = d.items.findIndex((i) => i.sug === sug.id)
        if (idx >= 0) return { day: d, idx, item: d.items[idx] }
      }
      return null
    })()
    if (found) {
      useTrip.getState().removeSuggestionItem(sug.id)
      return {
        ok: true, action: 'removed', title: sug.title,
        undo: { op: 'insert_item', dayId: found.day.id, index: found.idx, item: structuredClone(found.item) },
        detail: [{ field: 'consiglio', from: sug.title, to: '—' }],
        lat: sug.lat, lng: sug.lng,
      }
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
    return {
      ok: true, action: 'added', title: sug.title, day_number: dn, added_km: spot.addedKm, item_id: item.id,
      undo: { op: 'remove_item', dayId: spot.dayId, itemId: item.id },
      detail: [{ field: 'consiglio', from: '—', to: sug.title }],
    }
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

/* revert one edit using the inverse op captured at execution time */
export function applyUndoOp(u) {
  const s = useTrip.getState()
  switch (u.op) {
    case 'remove_item': s.removeItem(u.dayId, u.itemId); break
    case 'insert_item': s.insertItemAt(u.dayId, u.index, u.item); break
    case 'update_item': s.updateItem(u.dayId, u.itemId, u.patch); break
    case 'relocate_item': s.relocateItem(u.itemId, u.dayId, u.index); break
    case 'remove_day': s.removeDay(u.dayId); break
    case 'insert_day': s.insertDayAt(u.index, u.day); break
    case 'update_day': s.updateDay(u.dayId, u.patch); break
    case 'move_day': s.moveDay(u.dayId, u.dir); break
    case 'set_meta':
      s.setTitle(u.prev.title)
      s.setStartDate(u.prev.startDate)
      s.setCar(u.prev.car)
      if (u.prev.subtitle !== undefined) s.setSubtitle(u.prev.subtitle)
      if (u.prev.transport !== undefined) s.setTransport(u.prev.transport)
      break
    case 'check_remove': s.removeCheck(u.id); break
    case 'add_suggestion': s.addSuggestion(u.sug); break
    case 'remove_suggestion': s.removeSuggestion(u.id); break
    case 'check_insert': s.insertCheckAt(u.index, u.item); break
    case 'check_toggle': s.toggleCheck(u.id); break
    default: throw new Error('Undo non supportato: ' + u.op)
  }
}
