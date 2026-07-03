import { eurUsd } from './fx'

export const DAY_COLORS = [
  '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981',
  '#ea580c', '#d946ef', '#22c55e', '#3b82f6', '#e11d48',
]

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function fmtDur(min) {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h}h ${String(m).padStart(2, '0')}` : `${h}h`
}

export function dayDate(startDate, index) {
  if (!startDate) return null
  const d = new Date(`${startDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  d.setDate(d.getDate() + index)
  return d
}

export function fmtDate(d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return d.toLocaleDateString('it-IT', opts)
}

export function dayDriveMin(day) {
  return day.items.filter((i) => i.type === 'drive').reduce((s, i) => s + (i.dur || 0), 0)
}

export function tripStats(trip) {
  const stops = trip.days.reduce(
    (s, d) => s + d.items.filter((i) => i.type !== 'drive' && i.type !== 'info').length, 0)
  const driveMin = trip.days.reduce((s, d) => s + dayDriveMin(d), 0)
  return { days: trip.days.length, stops, driveMin }
}

export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return 'link' }
}

export function gmapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function fmtMoney(v, currency = 'USD') {
  const n = Math.round(v).toLocaleString('it-IT')
  return currency === 'EUR' ? `${n} €` : '$' + n
}

export function fmtKm(v) {
  return Math.round(v).toLocaleString('it-IT') + ' km'
}

/* fuel price units: how the user (or the agent) expressed the pump price */
export const GAS_UNITS = {
  usd_gal: { label: '$ / gallone', short: '$/gal', toUsdPerLiter: (p) => p / 3.78541 },
  usd_l: { label: '$ / litro', short: '$/L', toUsdPerLiter: (p) => p },
  eur_l: { label: '€ / litro', short: '€/L', toUsdPerLiter: (p) => p * eurUsd() },
}

/* fuel cost from car settings, in the trip currency: L/100km consumption +
   pump price in any unit (converted through the live EUR/USD rate) */
export function fuelCost(km, car, currency = 'USD') {
  const liters = (km / 100) * (car?.lPer100 || 0)
  const unit = GAS_UNITS[car?.gasUnit] ?? GAS_UNITS.usd_gal
  const usd = liters * unit.toUsdPerLiter(car?.gasPrice || 0)
  return currency === 'EUR' ? usd / eurUsd() : usd
}

/* does this trip involve driving at all? (controls fuel badge + car settings) */
export function tripUsesCar(trip) {
  if (trip.transport === 'car' || trip.transport === 'mixed') return true
  return trip.days.some((d) => d.items.some((i) => i.type === 'drive' && (i.mode ?? 'car') === 'car'))
}

/* item costs grouped by category: hotel, food, activity, extra (drive tolls + info fees) */
export function costByType(trip) {
  const acc = { hotel: 0, food: 0, activity: 0, extra: 0 }
  for (const d of trip.days) {
    for (const it of d.items) {
      const v = it.price || 0
      if (!v) continue
      if (it.type === 'hotel') acc.hotel += v
      else if (it.type === 'food') acc.food += v
      else if (it.type === 'activity') acc.activity += v
      else acc.extra += v
    }
  }
  acc.items = acc.hotel + acc.food + acc.activity + acc.extra
  return acc
}

export const TRANSPORT_MODES = ['car', 'walk', 'bus', 'train', 'plane', 'boat']

export function normalizeTrip(raw) {
  const t = structuredClone(raw)
  t.id ||= uid()
  t.title ||= 'Il mio viaggio'
  t.subtitle ||= ''
  t.startDate ||= ''
  t.phase = t.phase === 'interview' ? 'interview' : 'active'
  t.brief ||= ''
  t.notes ||= ''
  t.transport = ['car', 'walk', 'transit', 'mixed'].includes(t.transport) ? t.transport : 'car'
  /* interview trips choose their currency before the first message */
  t.currency = t.currency === 'EUR' || t.currency === 'USD' ? t.currency : t.phase === 'interview' ? null : 'USD'
  t.suggestions = Array.isArray(t.suggestions)
    ? t.suggestions.map((s) => ({
        id: s.id ?? uid(),
        title: s.title ?? '',
        type: ['activity', 'food', 'hotel'].includes(s.type) ? s.type : 'activity',
        dur: Number(s.dur) || 60,
        notes: s.notes ?? '',
        lat: typeof s.lat === 'number' ? s.lat : null,
        lng: typeof s.lng === 'number' ? s.lng : null,
        must: !!s.must,
        links: Array.isArray(s.links) ? s.links : [],
      }))
    : []
  /* legacy gasPerGal → gasPrice + explicit unit */
  t.car = {
    lPer100: Number(t.car?.lPer100) || 8.5,
    gasPrice: Number(t.car?.gasPrice) || Number(t.car?.gasPerGal) || 4.8,
    gasUnit: Object.keys(GAS_UNITS).includes(t.car?.gasUnit) ? t.car.gasUnit : 'usd_gal',
    model: typeof t.car?.model === 'string' ? t.car.model : '',
  }
  t.days = Array.isArray(t.days) ? t.days : []
  t.checklist = Array.isArray(t.checklist) ? t.checklist : []
  t.days.forEach((d, i) => {
    d.id ||= uid()
    d.title ||= 'Nuovo giorno'
    d.night ||= ''
    d.color ||= DAY_COLORS[i % DAY_COLORS.length]
    d.items = Array.isArray(d.items) ? d.items : []
    d.items.forEach((it) => {
      it.id ||= uid()
      it.type = ['drive', 'activity', 'food', 'hotel', 'info'].includes(it.type) ? it.type : 'activity'
      it.title ||= ''
      it.time ||= ''
      it.dur = Number(it.dur) || 0
      it.notes ||= ''
      it.links = Array.isArray(it.links) ? it.links.filter((l) => l && l.url) : []
      it.must = !!it.must
      it.done = !!it.done
      it.mode = it.type === 'drive' ? (TRANSPORT_MODES.includes(it.mode) ? it.mode : 'car') : null
      /* legacy single `img` → gallery array `imgs` */
      it.imgs = Array.isArray(it.imgs) ? it.imgs.filter((x) => typeof x === 'string') : []
      if (it.img && !it.imgs.length) it.imgs = [it.img]
      delete it.img
      it.noWiki = !!it.noWiki
      it.sug ||= null
      it.price = Number(it.price) || 0
      if (typeof it.lat !== 'number' || typeof it.lng !== 'number') { it.lat = null; it.lng = null }
    })
  })
  t.checklist.forEach((c) => { c.id ||= uid(); c.done = !!c.done; c.text ||= ''; c.link ||= '' })
  return t
}
