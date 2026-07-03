/* Disk sync: mirrors the zustand stores to the local server's data folder.
   localStorage persist stays untouched (instant first paint, offline cache);
   this module hydrates from disk at boot and write-through-syncs changes:
   per-trip debounced PUTs, immediate DELETEs, chats per trip.

   Semantics: server wins at boot (except locally-dirty/local-only trips),
   last-write-wins per trip file across tabs. */

import { create } from 'zustand'
import { useTrip } from '../store'
import { useChats } from '../agent/socket'
import { normalizeTrip } from './utils'
import { resolveRef } from './imgdb'
import { storageApi } from './storageClient'

const DEBOUNCE_MS = 800
const MAX_WAIT_MS = 5000
const CHAT_DEBOUNCE_MS = 1000
const RETRY_MS = 5000

/* reactive status for the UI (setup card, settings row, offline banner) */
export const useStorage = create(() => ({
  status: 'checking', // checking | off | unconfigured | ready
  dataDir: null,
  defaultDir: null,
  /* real browser data found while the disk is empty: ask before moving it */
  migrationOffer: null, // { tripCount }
  syncError: false, // true while writes are failing (server unreachable)
}))

let started = false
let applyingRemote = false
const dirtyTrips = new Map() // id -> { timer, firstAt }
const dirtyChats = new Map() // tripId -> timer
/* trips known to exist on disk: tells a hand-deleted file (drop it) apart
   from a brand-new local trip awaiting its first flush (keep it) */
const syncedIds = new Set()

const isPristineSeed = (trips) =>
  trips.length === 1 && trips[0].title === 'California Coast & Parks'

/* ---------- write-through ---------- */

function flushTrip(id) {
  const entry = dirtyTrips.get(id)
  if (entry) clearTimeout(entry.timer)
  const trip = useTrip.getState().trips.find((t) => t.id === id)
  if (!trip) { dirtyTrips.delete(id); return }
  storageApi
    .putTrip(trip)
    .then(() => {
      /* re-dirtied while in flight? keep it scheduled */
      if (dirtyTrips.get(id) === entry) dirtyTrips.delete(id)
      syncedIds.add(id)
      useStorage.setState({ syncError: false })
    })
    .catch(() => {
      useStorage.setState({ syncError: true })
      scheduleTrip(id, RETRY_MS)
    })
}

function scheduleTrip(id, delay = DEBOUNCE_MS) {
  const prev = dirtyTrips.get(id)
  if (prev) clearTimeout(prev.timer)
  const firstAt = prev?.firstAt ?? Date.now()
  const wait = Math.min(delay, Math.max(0, firstAt + MAX_WAIT_MS - Date.now()))
  dirtyTrips.set(id, { timer: setTimeout(() => flushTrip(id), wait), firstAt })
}

function scheduleChats(tripId) {
  clearTimeout(dirtyChats.get(tripId))
  dirtyChats.set(
    tripId,
    setTimeout(() => {
      const chats = useChats.getState().byTrip[tripId]
      if (!chats) { dirtyChats.delete(tripId); return }
      storageApi
        .putChats(tripId, chats)
        .then(() => dirtyChats.delete(tripId))
        .catch(() => scheduleChats(tripId)) // retimes with CHAT_DEBOUNCE... acceptable
    }, CHAT_DEBOUNCE_MS),
  )
}

function watchStores() {
  useTrip.subscribe((state, prevState) => {
    if (applyingRemote || useStorage.getState().status !== 'ready') return
    const prev = prevState.trips
    const next = state.trips
    if (prev === next) return
    const prevById = new Map(prev.map((t) => [t.id, t]))
    for (const t of next) {
      if (prevById.get(t.id) !== t) scheduleTrip(t.id) // new or changed reference
      prevById.delete(t.id)
    }
    for (const id of prevById.keys()) {
      const entry = dirtyTrips.get(id)
      if (entry) { clearTimeout(entry.timer); dirtyTrips.delete(id) }
      syncedIds.delete(id)
      storageApi.deleteTrip(id).catch(() => { /* re-scanned at next boot */ })
    }
  })

  useChats.subscribe((state, prevState) => {
    if (applyingRemote || useStorage.getState().status !== 'ready') return
    const prev = prevState.byTrip
    const next = state.byTrip
    if (prev === next) return
    for (const [tripId, chats] of Object.entries(next)) {
      if (prev[tripId] !== chats) scheduleChats(tripId)
    }
  })
}

/* ---------- boot / hydrate ---------- */

function applyRemoteTrips(serverTrips, { keepLocalOnly = true } = {}) {
  applyingRemote = true
  try {
    const local = useTrip.getState().trips
    const serverIds = new Set(serverTrips.map((t) => t.id))
    const merged = serverTrips.map((t) => {
      /* a locally-dirty trip has fresher edits than its file: keep ours */
      const mine = local.find((l) => l.id === t.id)
      return dirtyTrips.has(t.id) && mine ? mine : normalizeTrip(t)
    })
    const toPush = []
    for (const t of local) {
      if (serverIds.has(t.id)) continue
      if (keepLocalOnly || (dirtyTrips.has(t.id) && !syncedIds.has(t.id))) {
        /* created in this browser and not on disk yet: keep and push */
        merged.push(t)
        toPush.push(t.id)
      } else {
        /* its file was deleted by hand: the deletion wins — also drop any
           pending write so the debouncer can't resurrect the file */
        const entry = dirtyTrips.get(t.id)
        if (entry) { clearTimeout(entry.timer); dirtyTrips.delete(t.id) }
        syncedIds.delete(t.id)
      }
    }
    for (const id of serverIds) syncedIds.add(id)
    const activeId = useTrip.getState().activeId
    useTrip.setState({
      trips: merged,
      activeId: merged.some((t) => t.id === activeId) ? activeId : null,
    })
    for (const id of toPush) scheduleTrip(id)
  } finally {
    applyingRemote = false
  }
}

async function hydrate() {
  const [{ trips, errors }, { byTrip }] = await Promise.all([storageApi.getTrips(), storageApi.getChats()])
  applyRemoteTrips(trips)
  applyingRemote = true
  try {
    useChats.setState({ byTrip: { ...useChats.getState().byTrip, ...byTrip } })
  } finally {
    applyingRemote = false
  }
  return errors ?? []
}

/* rewrite legacy idb: photo refs through the server, then bulk-write */
export async function migrateToDisk() {
  const trips = structuredClone(useTrip.getState().trips)
  for (const t of trips) {
    for (const d of t.days ?? []) {
      for (const it of d.items ?? []) {
        if (!Array.isArray(it.imgs)) continue
        it.imgs = (
          await Promise.all(
            it.imgs.map(async (ref) => {
              if (typeof ref !== 'string' || !ref.startsWith('idb:')) return ref
              const dataUrl = await resolveRef(ref)
              if (!dataUrl) return null
              try { return (await storageApi.putImage(dataUrl)).ref } catch { return ref }
            }),
          )
        ).filter(Boolean)
      }
    }
  }
  await storageApi.migrate(trips, useChats.getState().byTrip)
  applyRemoteTrips(trips.map(normalizeTrip), { keepLocalOnly: false })
  useStorage.setState({ migrationOffer: null })
}

async function check() {
  let cfg
  try {
    cfg = await storageApi.getConfig()
  } catch {
    useStorage.setState({ status: 'off' })
    setTimeout(check, RETRY_MS)
    return
  }
  useStorage.setState({ dataDir: cfg.dataDir, defaultDir: cfg.defaultDir })
  if (!cfg.configured) {
    useStorage.setState({ status: 'unconfigured' })
    return
  }
  await onConfigured(cfg)
}

async function onConfigured(cfg) {
  const localTrips = useTrip.getState().trips
  if (!cfg.hasTrips && localTrips.length) {
    if (isPristineSeed(localTrips)) {
      /* just the demo: move it silently */
      useStorage.setState({ status: 'ready', dataDir: cfg.dataDir })
      try { await migrateToDisk() } catch { /* retried on next boot */ }
      return
    }
    /* real user data: ask before moving it (browser copy stays either way) */
    useStorage.setState({ status: 'ready', dataDir: cfg.dataDir, migrationOffer: { tripCount: localTrips.length } })
    return
  }
  try {
    /* if edits piled up while the server was away, push them before pulling */
    for (const id of [...dirtyTrips.keys()]) flushTrip(id)
    await hydrate()
    useStorage.setState({ status: 'ready', dataDir: cfg.dataDir, syncError: false })
  } catch {
    useStorage.setState({ status: 'off' })
    setTimeout(check, RETRY_MS)
  }
}

/* the user picked (or changed) the folder from the UI */
export async function configureDataDir(path, mode) {
  const r = await storageApi.setConfig(path, mode)
  useStorage.setState({ dataDir: r.dataDir })
  await onConfigured({ configured: true, dataDir: r.dataDir, hasTrips: r.hasTrips })
  return r
}

export function startStorageSync() {
  if (started) return
  started = true
  watchStores()
  /* hand-edits/deletes on disk, broadcast by the server's fs watcher */
  window.addEventListener('ulisse:storage-changed', async () => {
    if (useStorage.getState().status !== 'ready') return
    try {
      const { trips } = await storageApi.getTrips()
      applyRemoteTrips(trips, { keepLocalOnly: false }) // hand-deleted files must not resurrect
    } catch { /* next boot re-scans */ }
  })
  check()
}
