/* Disk storage: the local server owns a user-visible data folder
   (default <Documents>/Ulisse) holding one readable JSON per trip, photos
   as real image files, chats and the auth token. The browser reads/writes
   through the /storage/* endpoints; localStorage stays a warm cache.

   Layout:
     trips/<slug>--<id>.json   images/<id>.{jpg|webp|png}
     chats/<tripId>.json       auth.json     .backups/<file>.json */

import {
  readFileSync, writeFileSync, renameSync, unlinkSync, mkdirSync, readdirSync,
  existsSync, statSync, copyFileSync, cpSync, createReadStream, watch,
  accessSync, constants as fsConstants,
} from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve, dirname, basename, isAbsolute } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/* ---------- platform-aware defaults ---------- */

/* The REAL Documents folder, whatever the OS language calls it:
   - macOS: ~/Documents is the physical path ("Documenti" is display-only)
   - Windows: ask the shell (handles OneDrive redirection and moved folders)
   - Linux: XDG user dirs — there the localized name IS the physical path */
export function documentsDir() {
  const home = homedir()
  if (process.platform === 'win32') {
    try {
      const out = execFileSync(
        'powershell', ['-NoProfile', '-Command', "[Environment]::GetFolderPath('MyDocuments')"],
        { encoding: 'utf8', timeout: 5000, windowsHide: true },
      ).trim()
      if (out && isAbsolute(out)) return out
    } catch { /* fall through */ }
    return join(home, 'Documents')
  }
  if (process.platform === 'linux') {
    try {
      const conf = readFileSync(
        join(process.env.XDG_CONFIG_HOME || join(home, '.config'), 'user-dirs.dirs'), 'utf8')
      const m = conf.match(/^\s*XDG_DOCUMENTS_DIR="([^"]+)"/m)
      if (m) {
        const p = m[1].replace(/^\$HOME/, home)
        if (isAbsolute(p)) return p
      }
    } catch { /* no xdg config */ }
    const docs = join(home, 'Documents')
    return existsSync(docs) ? docs : home
  }
  return join(home, 'Documents') // macOS
}

const defaultDataDir = () => join(documentsDir(), 'Ulisse')

/* config pointer lives OUTSIDE the data dir (survives moving it) */
function configPath() {
  const base = process.platform === 'win32'
    ? (process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'))
    : (process.env.XDG_CONFIG_HOME || join(homedir(), '.config'))
  return join(base, 'ulisse', 'config.json')
}

const expandHome = (p) => (p.startsWith('~') ? join(homedir(), p.slice(1)) : p)

/* ---------- small fs helpers ---------- */

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

function writeJsonAtomic(file, data) {
  const tmp = join(dirname(file), `.tmp-${basename(file)}`)
  writeFileSync(tmp, JSON.stringify(data, null, 2))
  renameSync(tmp, file) // same-dir rename: atomic on APFS/ext4/NTFS
}

const slugify = (s) =>
  (s || 'trip').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'trip'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const IMG_MIME = { jpg: 'image/jpeg', webp: 'image/webp', png: 'image/png' }
const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }
const IMG_FILE_RE = /^[a-z0-9]+\.(jpg|webp|png)$/

/* ---------- storage ---------- */

export function createStorage(bridge) {
  let dataDir = null
  /* self-echo suppression for the fs watcher */
  const ownWrites = new Map() // filename -> expiry ts
  const markOwn = (file) => ownWrites.set(basename(file), Date.now() + 2000)
  const isOwn = (name) => (ownWrites.get(name) ?? 0) > Date.now()
  /* serialize writes per trip id */
  const writeQueues = new Map()
  const serialize = (id, fn) => {
    const q = (writeQueues.get(id) ?? Promise.resolve()).then(fn, fn)
    writeQueues.set(id, q)
    return q
  }
  let watcher = null

  /* boot: env override wins, else the pointer file, else self-configure on
     the platform default — a fresh install owns a real data folder without
     being asked anything (change it later from the dashboard footer) */
  if (process.env.ULISSE_DATA_DIR) {
    dataDir = resolve(expandHome(process.env.ULISSE_DATA_DIR))
    ensureLayout(dataDir)
  } else {
    try {
      const cfg = readJson(configPath())
      if (cfg.dataDir && existsSync(cfg.dataDir)) dataDir = cfg.dataDir
      else if (cfg.dataDir) { ensureLayout(cfg.dataDir); dataDir = cfg.dataDir }
    } catch { /* not configured yet */ }
    if (!dataDir) {
      try {
        const dir = defaultDataDir()
        ensureLayout(dir)
        accessSync(dir, fsConstants.W_OK)
        mkdirSync(dirname(configPath()), { recursive: true })
        writeJsonAtomic(configPath(), { dataDir: dir })
        dataDir = dir
        console.log(`[storage] data folder created at ${dir}`)
      } catch { /* unwritable default: the app falls back to the setup card */ }
    }
  }
  if (dataDir) {
    adoptLegacyAuth()
    try { gc() } catch { /* best effort */ }
    startWatcher()
  }

  function ensureLayout(dir) {
    for (const sub of ['trips', 'chats', 'images', '.backups']) mkdirSync(join(dir, sub), { recursive: true })
  }

  /* one-time: bring the token saved by older versions into the data dir */
  function adoptLegacyAuth() {
    const legacy = join(__dirname, '.auth.json')
    const target = join(dataDir, 'auth.json')
    if (existsSync(legacy) && !existsSync(target)) {
      try { copyFileSync(legacy, target) } catch { /* keep legacy */ }
    }
  }

  const tripsDir = () => join(dataDir, 'trips')
  const chatsDir = () => join(dataDir, 'chats')
  const imagesDir = () => join(dataDir, 'images')
  const backupsDir = () => join(dataDir, '.backups')

  function listTripFiles() {
    try { return readdirSync(tripsDir()).filter((f) => f.endsWith('.json') && !f.startsWith('.')) } catch { return [] }
  }

  function scanTrips() {
    const trips = []
    const errors = []
    const seen = new Map() // id -> { file, mtime }
    for (const f of listTripFiles()) {
      const full = join(tripsDir(), f)
      try {
        const t = readJson(full)
        if (!t || typeof t.id !== 'string') throw new Error('missing trip id')
        const prev = seen.get(t.id)
        const mtime = statSync(full).mtimeMs
        if (prev && prev.mtime >= mtime) {
          console.warn(`[storage] duplicate trip id ${t.id}: keeping ${prev.file}, ignoring ${f}`)
          continue
        }
        if (prev) console.warn(`[storage] duplicate trip id ${t.id}: ${f} is newer than ${prev.file}`)
        seen.set(t.id, { file: f, mtime, trip: t })
      } catch (e) {
        errors.push({ file: `trips/${f}`, error: String(e?.message ?? e) })
      }
    }
    for (const { trip } of seen.values()) trips.push(trip)
    return { trips, errors }
  }

  const fileForId = (id) => listTripFiles().find((f) => f.endsWith(`--${id}.json`) || f === `${id}.json`)
      ?? listTripFiles().find((f) => { try { return readJson(join(tripsDir(), f)).id === id } catch { return false } })

  function saveTrip(trip) {
    const safeId = String(trip.id).replace(/[^a-z0-9-]/gi, '')
    const name = `${slugify(trip.title)}--${safeId}.json`
    const target = join(tripsDir(), name)
    const existing = fileForId(trip.id)
    /* rotate the previous content into .backups before overwriting */
    if (existing) {
      try { copyFileSync(join(tripsDir(), existing), join(backupsDir(), existing)) } catch { /* best effort */ }
    }
    markOwn(target)
    writeJsonAtomic(target, trip)
    if (existing && existing !== name) {
      markOwn(join(tripsDir(), existing))
      try { unlinkSync(join(tripsDir(), existing)) } catch { /* already gone */ }
    }
    return `trips/${name}`
  }

  function deleteTrip(id) {
    const f = fileForId(id)
    if (f) { markOwn(join(tripsDir(), f)); try { unlinkSync(join(tripsDir(), f)) } catch { /* gone */ } }
    for (const dir of [chatsDir(), backupsDir()]) {
      try {
        for (const c of readdirSync(dir)) {
          if (c === `${id}.json` || c.endsWith(`--${id}.json`)) unlinkSync(join(dir, c))
        }
      } catch { /* missing dir */ }
    }
  }

  /* unreferenced images older than 24h (protects fresh editor-draft uploads)
     + chat files whose trip is gone */
  function gc() {
    const { trips } = scanTrips()
    const refs = new Set()
    for (const t of trips) {
      for (const d of t.days ?? []) {
        for (const it of d.items ?? []) {
          for (const ref of it.imgs ?? []) {
            const m = typeof ref === 'string' && ref.match(/\/storage\/images\/([a-z0-9.]+)$/)
            if (m) refs.add(m[1])
          }
        }
      }
    }
    let removedImages = 0
    const dayAgo = Date.now() - 24 * 3600 * 1000
    try {
      for (const f of readdirSync(imagesDir())) {
        if (!IMG_FILE_RE.test(f) || refs.has(f)) continue
        if (statSync(join(imagesDir(), f)).mtimeMs > dayAgo) continue
        unlinkSync(join(imagesDir(), f))
        removedImages++
      }
    } catch { /* missing dir */ }
    let removedChats = 0
    const tripIds = new Set(trips.map((t) => t.id))
    try {
      for (const f of readdirSync(chatsDir())) {
        const id = f.replace(/\.json$/, '')
        if (f.endsWith('.json') && !tripIds.has(id)) { unlinkSync(join(chatsDir(), f)); removedChats++ }
      }
    } catch { /* missing dir */ }
    if (removedImages || removedChats) console.log(`[storage] gc: ${removedImages} images, ${removedChats} chats removed`)
    return { removedImages, removedChats }
  }

  /* best-effort live reconcile when the user touches files by hand;
     the boot re-scan remains the source of truth */
  function startWatcher() {
    try {
      watcher?.close()
      let timer = null
      watcher = watch(tripsDir(), (event, name) => {
        if (!name || name.startsWith('.') || isOwn(name)) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          const { trips } = scanTrips()
          bridge.broadcast({ type: 'storage_changed', tripIds: trips.map((t) => t.id) })
        }, 400)
      })
    } catch { /* watch unsupported: fine */ }
  }

  /* ---------- http ---------- */

  const send = (res, code, obj) => {
    res.writeHead(code, { 'content-type': 'application/json' })
    res.end(JSON.stringify(obj))
  }
  const readBody = (req, limit = 12 * 1024 * 1024) =>
    new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (c) => {
        body += c
        if (body.length > limit) { reject(new Error('payload too large')); req.destroy() }
      })
      req.on('end', () => resolve(body))
      req.on('error', reject)
    })

  async function handle(req, res) {
    const url = req.url.split('?')[0]
    if (!url.startsWith('/storage')) return false
    try {
      /* config is the only route that works before setup */
      if (url === '/storage/config' && req.method === 'GET') {
        send(res, 200, {
          configured: !!dataDir,
          dataDir,
          defaultDir: defaultDataDir(),
          hasTrips: dataDir ? listTripFiles().length > 0 : false,
        })
        return true
      }
      if (url === '/storage/config' && req.method === 'POST') {
        const { dataDir: wanted, mode } = JSON.parse(await readBody(req) || '{}')
        let dir = resolve(expandHome(String(wanted || defaultDataDir()).trim()))
        if (!isAbsolute(dir)) { send(res, 400, { error: 'absolute path required' }); return true }
        if (dir === resolve('/')) { send(res, 400, { error: 'refusing filesystem root' }); return true }
        /* auto mode: a folder that already holds trips gets adopted as-is
           (restored backup / synced folder); an empty one inherits a copy */
        const targetHasTrips = existsSync(join(dir, 'trips')) && readdirSync(join(dir, 'trips')).some((f) => f.endsWith('.json'))
        const effMode = mode ?? (targetHasTrips || !dataDir || dataDir === dir ? 'adopt' : 'copy')
        ensureLayout(dir)
        /* write-probe */
        const probe = join(dir, '.write-probe')
        writeFileSync(probe, 'ok'); unlinkSync(probe)
        if (effMode === 'copy' && dataDir && dataDir !== dir) {
          cpSync(dataDir, dir, { recursive: true }) // old dir stays as a backup
        }
        dataDir = dir
        if (!process.env.ULISSE_DATA_DIR) {
          mkdirSync(dirname(configPath()), { recursive: true })
          writeJsonAtomic(configPath(), { dataDir })
        }
        adoptLegacyAuth()
        startWatcher()
        send(res, 200, { ok: true, dataDir, hasTrips: listTripFiles().length > 0 })
        return true
      }

      if (!dataDir) { send(res, 409, { error: 'unconfigured' }); return true }

      if (url === '/storage/trips' && req.method === 'GET') {
        send(res, 200, scanTrips())
        return true
      }
      const tripM = url.match(/^\/storage\/trips\/([a-z0-9-]+)$/i)
      if (tripM && req.method === 'PUT') {
        const trip = JSON.parse(await readBody(req))
        if (trip?.id !== tripM[1]) { send(res, 400, { error: 'id mismatch' }); return true }
        await serialize(trip.id, () => saveTrip(trip))
        send(res, 200, { ok: true })
        return true
      }
      if (tripM && req.method === 'DELETE') {
        await serialize(tripM[1], () => deleteTrip(tripM[1]))
        send(res, 200, { ok: true })
        return true
      }

      if (url === '/storage/chats' && req.method === 'GET') {
        const byTrip = {}
        try {
          for (const f of readdirSync(chatsDir())) {
            if (!f.endsWith('.json')) continue
            try { byTrip[f.replace(/\.json$/, '')] = readJson(join(chatsDir(), f)) } catch { /* skip broken */ }
          }
        } catch { /* missing dir */ }
        send(res, 200, { byTrip })
        return true
      }
      const chatM = url.match(/^\/storage\/chats\/([a-z0-9-]+)$/i)
      if (chatM && req.method === 'PUT') {
        const chats = JSON.parse(await readBody(req))
        writeJsonAtomic(join(chatsDir(), `${chatM[1]}.json`), chats)
        send(res, 200, { ok: true })
        return true
      }

      if (url === '/storage/images' && req.method === 'POST') {
        const { dataUrl } = JSON.parse(await readBody(req))
        const m = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(?:jpeg|webp|png));base64,(.+)$/s)
        if (!m) { send(res, 400, { error: 'expected a base64 data URL (jpeg/webp/png)' }); return true }
        const file = `${uid()}.${EXT_BY_MIME[m[1]]}`
        writeFileSync(join(imagesDir(), file), Buffer.from(m[2], 'base64'))
        send(res, 200, { ref: `/storage/images/${file}` })
        return true
      }
      const imgM = url.match(/^\/storage\/images\/([a-z0-9.]+)$/)
      if (imgM && req.method === 'GET') {
        const file = imgM[1]
        const full = join(imagesDir(), file)
        if (!IMG_FILE_RE.test(file) || !existsSync(full)) { res.writeHead(404); res.end(); return true }
        res.writeHead(200, {
          'content-type': IMG_MIME[file.split('.').pop()],
          'cache-control': 'public, max-age=31536000, immutable', // ids never change content
        })
        createReadStream(full).pipe(res)
        return true
      }
      if (imgM && req.method === 'DELETE') {
        if (IMG_FILE_RE.test(imgM[1])) { try { unlinkSync(join(imagesDir(), imgM[1])) } catch { /* gone */ } }
        send(res, 200, { ok: true })
        return true
      }

      if (url === '/storage/gc' && req.method === 'POST') {
        send(res, 200, gc())
        return true
      }

      if (url === '/storage/migrate' && req.method === 'POST') {
        if (listTripFiles().length > 0) { send(res, 409, { error: 'not empty' }); return true }
        const { trips = [], chatsByTrip = {} } = JSON.parse(await readBody(req, 64 * 1024 * 1024))
        let written = 0
        for (const t of trips) { if (t?.id) { saveTrip(t); written++ } }
        for (const [id, chats] of Object.entries(chatsByTrip)) {
          if (/^[a-z0-9-]+$/i.test(id)) writeJsonAtomic(join(chatsDir(), `${id}.json`), chats)
        }
        send(res, 200, { ok: true, written })
        return true
      }

      send(res, 404, { error: 'unknown storage route' })
      return true
    } catch (e) {
      send(res, 500, { error: String(e?.message ?? e) })
      return true
    }
  }

  return {
    handle,
    /* auth.mjs asks lazily on every read/write */
    getAuthPath: () => (dataDir ? join(dataDir, 'auth.json') : null),
  }
}
