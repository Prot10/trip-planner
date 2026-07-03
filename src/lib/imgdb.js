/* User-uploaded images: stored as real files in the data folder through the
   local server (refs are plain URLs '/storage/images/<id>.ext', so <img>
   renders them directly). IndexedDB remains as the offline fallback and for
   legacy 'idb:<id>' refs. JSON export inlines everything as data URLs so a
   shared file carries its photos. */

import { storageApi } from './storageClient'

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

/* preferred path: land the photo on disk; fallback: IndexedDB (server down).
   Legacy idb refs get swept to disk by the one-time migration. */
export async function putImg(dataUrl) {
  try {
    const { ref } = await storageApi.putImage(dataUrl)
    return ref
  } catch { /* unconfigured or unreachable: keep it local */ }
  const id = 'i' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  await tx('readwrite', (s) => s.put(dataUrl, id))
  mem.set(id, dataUrl)
  return `idb:${id}`
}

export async function resolveRef(ref) {
  if (!ref) return null
  if (!ref.startsWith('idb:')) return ref // URLs (server refs included) pass through
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

/* ---------- compression ----------
   Principles: never degrade what is already light; keep EXIF orientation;
   preserve transparency (no JPEG flattening); prefer WebP when the browser
   can actually encode it; cap the output size with a quality ladder. */

const LIGHT_BYTES = 400 * 1024
const TARGET_BYTES = 600 * 1024
const MAX_SIDE = 1600

const dataUrlBytes = (u) => Math.floor(((u.length - u.indexOf(',') - 1) * 3) / 4)

let webpOk = null
function canEncodeWebp() {
  if (webpOk === null) {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    webpOk = c.toDataURL('image/webp').startsWith('data:image/webp')
  }
  return webpOk
}

function decode(file) {
  /* createImageBitmap applies EXIF orientation reliably */
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => decodeViaImage(file))
  }
  return decodeViaImage(file)
}

function decodeViaImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')) }
    img.src = url
  })
}

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

function hasAlpha(ctx, w, h) {
  /* sample a coarse grid: cheap and catches real transparency */
  const step = Math.max(1, Math.floor(Math.min(w, h) / 24))
  const data = ctx.getImageData(0, 0, w, h).data
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] < 255) return true
    }
  }
  return false
}

export async function compressImageFile(file, maxSide = MAX_SIDE) {
  const src = await decode(file)
  const w = src.width ?? src.naturalWidth
  const h = src.height ?? src.naturalHeight
  if (!w || !h) throw new Error('not an image')

  const supported = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  /* already light and small enough: keep the original bytes (and format) */
  if (supported && file.size <= LIGHT_BYTES && Math.max(w, h) <= maxSide) {
    return readAsDataUrl(file)
  }

  const scale = Math.min(1, maxSide / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
  src.close?.()

  /* transparency must survive: WebP keeps alpha, PNG is the safe fallback */
  const mayHaveAlpha = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif'
  if (mayHaveAlpha && hasAlpha(ctx, canvas.width, canvas.height)) {
    return canEncodeWebp() ? canvas.toDataURL('image/webp', 0.9) : canvas.toDataURL('image/png')
  }

  /* photos: WebP when encodable, else JPEG; step quality down to stay lean */
  const mime = canEncodeWebp() ? 'image/webp' : 'image/jpeg'
  for (const q of [0.82, 0.7, 0.6]) {
    const out = canvas.toDataURL(mime, q)
    if (dataUrlBytes(out) <= TARGET_BYTES || q === 0.6) return out
  }
}

/* export: replace refs (server files AND legacy idb) with inline data URLs */
export async function exportTripImages(trip) {
  const t = structuredClone(trip)
  for (const d of t.days) {
    for (const it of d.items) {
      if (!Array.isArray(it.imgs)) continue
      it.imgs = (await Promise.all(it.imgs.map(inlineRef))).filter(Boolean)
    }
  }
  return t
}

async function inlineRef(ref) {
  if (typeof ref !== 'string') return null
  if (ref.startsWith('data:')) return ref
  if (ref.startsWith('idb:')) return resolveRef(ref)
  if (ref.startsWith('/storage/images/')) {
    try {
      const blob = await (await fetch(ref)).blob()
      return await readAsDataUrl(blob)
    } catch {
      return null // unreadable ref: drop it from the export
    }
  }
  return ref // external http(s) URL: already portable
}

/* import: move inline data URLs to disk (or IndexedDB fallback) */
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
