/* User-uploaded images live in IndexedDB (localStorage is too small for photos).
   Items reference them as 'idb:<id>'; plain http(s)/data URLs pass through.
   JSON export inlines them as data URLs so a shared file carries its photos. */

const DB_NAME = 'tripplanner-img'
const STORE = 'imgs'

let dbPromise = null
function db() {
  dbPromise ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(mode, fn) {
  return db().then(
    (d) =>
      new Promise((resolve, reject) => {
        const t = d.transaction(STORE, mode)
        const req = fn(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

const mem = new Map()

export async function putImg(dataUrl) {
  const id = 'i' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  await tx('readwrite', (s) => s.put(dataUrl, id))
  mem.set(id, dataUrl)
  return `idb:${id}`
}

export async function resolveRef(ref) {
  if (!ref) return null
  if (!ref.startsWith('idb:')) return ref
  const id = ref.slice(4)
  if (mem.has(id)) return mem.get(id)
  try {
    const v = await tx('readonly', (s) => s.get(id))
    if (v) mem.set(id, v)
    return v ?? null
  } catch {
    return null
  }
}

/* downscale + JPEG-compress a dropped file so IndexedDB stays lean */
export function compressImageFile(file, maxSide = 1000, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')) }
    img.src = url
  })
}

/* export: replace idb refs with inline data URLs (portable JSON) */
export async function exportTripImages(trip) {
  const t = structuredClone(trip)
  for (const d of t.days) {
    for (const it of d.items) {
      if (!Array.isArray(it.imgs)) continue
      it.imgs = (await Promise.all(it.imgs.map(resolveRef))).filter(Boolean)
    }
  }
  return t
}

/* import: move inline data URLs into IndexedDB so localStorage stays small */
export async function internTripImages(trip) {
  for (const d of trip.days ?? []) {
    for (const it of d.items ?? []) {
      if (!Array.isArray(it.imgs)) continue
      it.imgs = await Promise.all(
        it.imgs.map((ref) => (typeof ref === 'string' && ref.startsWith('data:') ? putImg(ref) : ref)),
      )
    }
  }
  return trip
}
