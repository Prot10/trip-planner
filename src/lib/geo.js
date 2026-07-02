/* Geo helpers: distances, optimal insertion of a stop, free road routing (OSRM) */

export function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Find the cheapest place to insert a new stop into the whole trip.
 * The trip is treated as one continuous chain of located stops (day after day);
 * for every gap we compute the extra distance the detour adds, and return the
 * day + item-array index of the best gap.
 */
export function bestInsertion(trip, point) {
  const chain = [] // { dayId, itemIndex, coord }
  trip.days.forEach((day) => {
    day.items.forEach((it, itemIndex) => {
      if (it.lat != null) chain.push({ dayId: day.id, itemIndex, coord: [it.lat, it.lng] })
    })
  })
  if (!chain.length) {
    const day = trip.days[0]
    return day ? { dayId: day.id, index: day.items.length, addedKm: 0 } : null
  }

  const p = [point.lat, point.lng]
  let best = null
  for (let k = 0; k < chain.length - 1; k++) {
    const a = chain[k]
    const b = chain[k + 1]
    const addedKm = haversineKm(a.coord, p) + haversineKm(p, b.coord) - haversineKm(a.coord, b.coord)
    if (best && addedKm >= best.addedKm) continue
    /* same-day gap → insert right after a; day boundary → attach to the nearer side */
    let dayId, index
    if (a.dayId === b.dayId || haversineKm(a.coord, p) <= haversineKm(p, b.coord)) {
      dayId = a.dayId
      index = a.itemIndex + 1
    } else {
      dayId = b.dayId
      index = b.itemIndex
    }
    best = { dayId, index, addedKm }
  }
  /* ends of the chain */
  const endpoints = [
    { node: chain[0], index: chain[0].itemIndex, addedKm: haversineKm(chain[0].coord, p) * 2 },
    { node: chain[chain.length - 1], index: chain[chain.length - 1].itemIndex + 1, addedKm: haversineKm(chain[chain.length - 1].coord, p) * 2 },
  ]
  for (const e of endpoints) {
    if (!best || e.addedKm < best.addedKm) best = { dayId: e.node.dayId, index: e.index, addedKm: e.addedKm }
  }
  return { ...best, addedKm: Math.round(best.addedKm) }
}

/**
 * Per-day coordinate chains forming one continuous round trip:
 * each day's leg starts where the previous located day ended (wrapping,
 * so day 1 begins at the end of the last day and the loop closes).
 */
export function chainedDayCoords(trip) {
  const layers = trip.days.map((day) => ({
    day,
    pts: day.items.filter((it) => it.lat != null).map((it) => [it.lat, it.lng]),
  }))
  const withPts = layers.filter((l) => l.pts.length > 0)
  return layers.map((l) => {
    const pos = withPts.indexOf(l)
    if (pos === -1 || withPts.length < 2) return { dayId: l.day.id, coords: l.pts }
    const prev = withPts[(pos - 1 + withPts.length) % withPts.length]
    return { dayId: l.day.id, coords: [prev.pts[prev.pts.length - 1], ...l.pts] }
  })
}

/* straight-line day length × road factor — fallback when OSRM hasn't answered */
export function estimateDayKm(coords) {
  let km = 0
  for (let i = 0; i < coords.length - 1; i++) km += haversineKm(coords[i], coords[i + 1])
  return km * 1.25
}

/* ---------- place search (Nominatim, free) ---------- */

export async function searchPlaces(q) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=it&q=${encodeURIComponent(q)}`,
  )
  if (!r.ok) return []
  const data = await r.json()
  return data.map((p) => ({
    lat: +(+p.lat).toFixed(5),
    lng: +(+p.lon).toFixed(5),
    name: p.display_name,
    short: p.display_name.split(',')[0],
  }))
}

/* ---------- turn-by-turn directions (OSRM, free) ---------- */

const MOD_IT = {
  left: 'a sinistra',
  right: 'a destra',
  'slight left': 'leggermente a sinistra',
  'slight right': 'leggermente a destra',
  'sharp left': 'decisamente a sinistra',
  'sharp right': 'decisamente a destra',
  straight: 'dritto',
  uturn: 'con inversione a U',
}

function stepText(s) {
  const type = s.maneuver?.type
  const mod = MOD_IT[s.maneuver?.modifier] ?? ''
  const name = s.name ? ` su ${s.name}` : ''
  switch (type) {
    case 'depart': return `Parti${name}`
    case 'arrive': return 'Arrivo a destinazione'
    case 'new name': return `Continua${name}`
    case 'merge': return `Immettiti ${mod}${name}`.trim()
    case 'on ramp': return `Prendi la rampa${name ? ` verso${name.slice(3)}` : ''}`
    case 'off ramp': return `Prendi l'uscita${name ? ` verso${name.slice(3)}` : ''}`
    case 'fork': return `Al bivio tieni ${mod}${name}`.trim()
    case 'roundabout':
    case 'rotary': return `Alla rotonda prendi la ${s.maneuver?.exit ?? 1}ª uscita${name}`
    case 'exit roundabout': return `Esci dalla rotonda${name}`
    case 'continue': return `Prosegui ${mod}${name}`.trim()
    case 'end of road': return `A fine strada svolta ${mod}${name}`.trim()
    case 'turn': return `Svolta ${mod}${name}`.trim()
    default: return `Prosegui${name}`
  }
}

export async function fetchDirections(a, b) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}` +
    `?overview=full&geometries=geojson&steps=true`
  const r = await fetch(url)
  if (!r.ok) return null
  const data = await r.json()
  const route = data?.routes?.[0]
  if (!route?.geometry?.coordinates) return null
  return {
    latlngs: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    km: route.distance / 1000,
    min: route.duration / 60,
    steps: (route.legs?.[0]?.steps ?? []).map((s) => ({
      text: stepText(s),
      km: s.distance / 1000,
    })),
  }
}

/* ---------- free road routing via the public OSRM demo server ---------- */

const OSRM_CACHE_KEY = 'osrm.v2'
let memCache = null
function loadCache() {
  if (!memCache) {
    try { memCache = JSON.parse(localStorage.getItem(OSRM_CACHE_KEY) || '{}') } catch { memCache = {} }
  }
  return memCache
}
function saveCache() {
  try {
    const keys = Object.keys(memCache)
    /* keep the cache bounded */
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach((k) => delete memCache[k])
    localStorage.setItem(OSRM_CACHE_KEY, JSON.stringify(memCache))
  } catch { /* quota — ignore */ }
}

let queue = Promise.resolve()

/**
 * Road-following route through the given [lat,lng] waypoints.
 * Returns { latlngs, km } or null on failure (caller falls back to straight lines).
 * Cached in localStorage; requests are queued to be gentle with the demo server.
 */
export function fetchRoadRoute(coords) {
  if (coords.length < 2) return Promise.resolve(null)
  const key = coords.map((c) => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join(';')
  const cache = loadCache()
  if (cache[key]) return Promise.resolve(cache[key])

  const run = async () => {
    const path = coords.map(([lat, lng]) => `${lng},${lat}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&steps=false`
    const r = await fetch(url)
    if (!r.ok) return null
    const data = await r.json()
    const route = data?.routes?.[0]
    if (!route?.geometry?.coordinates) return null
    const result = {
      latlngs: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      km: route.distance / 1000,
    }
    cache[key] = result
    saveCache()
    return result
  }

  const p = queue.then(run).catch(() => null)
  queue = p.then(() => new Promise((res) => setTimeout(res, 350)))
  return p
}
