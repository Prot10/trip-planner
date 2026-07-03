/* Thin fetch wrappers for the local server's /storage API. URLs are relative:
   in production the page is served by the same server; in dev Vite proxies
   /storage to the agent port (vite.config.js). */

async function req(method, path, body) {
  const r = await fetch(path, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data.error || `${method} ${path} → ${r.status}`)
    err.status = r.status
    throw err
  }
  return data
}

export const storageApi = {
  getConfig: () => req('GET', '/storage/config'),
  setConfig: (dataDir, mode) => req('POST', '/storage/config', { dataDir, mode }),
  getTrips: () => req('GET', '/storage/trips'),
  putTrip: (trip) => req('PUT', `/storage/trips/${trip.id}`, trip),
  deleteTrip: (id) => req('DELETE', `/storage/trips/${id}`),
  getChats: () => req('GET', '/storage/chats'),
  putChats: (tripId, chats) => req('PUT', `/storage/chats/${tripId}`, chats),
  putImage: (dataUrl) => req('POST', '/storage/images', { dataUrl }),
  migrate: (trips, chatsByTrip) => req('POST', '/storage/migrate', { trips, chatsByTrip }),
  gc: () => req('POST', '/storage/gc'),
}
