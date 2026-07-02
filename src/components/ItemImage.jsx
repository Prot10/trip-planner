import { useEffect, useRef, useState } from 'react'
import { resolveRef } from '../lib/imgdb'

/* Free automatic imagery: lead images of the Wikipedia articles nearest to
   the item's coordinates. Cached in localStorage, fetched lazily on scroll,
   overridable per item via the `img` URL field. */

const CACHE_KEY = 'wikimg.v2'
let cache = null
function loadCache() {
  if (!cache) {
    try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { cache = {} }
  }
  return cache
}
function saveCache() {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* quota */ }
}

/* polite sequential queue for the Wikipedia API */
let queue = Promise.resolve()
function enqueue(fn) {
  const p = queue.then(fn).catch(() => [])
  queue = p.then(() => new Promise((res) => setTimeout(res, 150)))
  return p
}

async function fetchWikiImages(lat, lng) {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=geosearch&ggscoord=${lat}%7C${lng}&ggsradius=1500&ggslimit=8` +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=900`
  const r = await fetch(url)
  if (!r.ok) return []
  const data = await r.json()
  const pages = Object.values(data?.query?.pages ?? {}).sort((a, b) => a.index - b.index)
  return pages
    .filter((p) => p.thumbnail?.source)
    .slice(0, 6)
    .map((p) => ({ url: p.thumbnail.source, title: p.title }))
}

/* cached place-photo lookup, also used by the AI agent's get_place_images tool */
export async function getPlaceImages(lat, lng) {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const c = loadCache()
  if (c[key] !== undefined) return c[key]
  const imgs = await enqueue(() => fetchWikiImages(lat, lng))
  c[key] = imgs
  saveCache()
  return imgs
}

function useOnScreen(ref) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } },
      { rootMargin: '300px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref])
  return visible
}

/* -> [{url, title, manual}] — the user's own gallery first, then Wikipedia
   (unless the item opts out with noWiki) */
export function useItemImages(item, visible) {
  const wantWiki = item.lat != null && !item.noWiki
  const key = wantWiki ? `${item.lat.toFixed(3)},${item.lng.toFixed(3)}` : null
  const [list, setList] = useState(() => (key ? loadCache()[key] : null) ?? null)
  const refsKey = JSON.stringify(item.imgs ?? [])
  const [manual, setManual] = useState([])

  useEffect(() => {
    if (!key || !visible) return
    const c = loadCache()
    if (c[key] !== undefined) { setList(c[key]); return }
    let dead = false
    enqueue(() => fetchWikiImages(item.lat, item.lng)).then((imgs) => {
      c[key] = imgs
      saveCache()
      if (!dead) setList(imgs)
    })
    return () => { dead = true }
  }, [key, visible, item.lat, item.lng])

  /* resolve the item's own gallery (idb refs and plain URLs) */
  useEffect(() => {
    const refs = JSON.parse(refsKey)
    if (!refs.length) { setManual([]); return }
    let dead = false
    Promise.all(refs.map(resolveRef)).then((urls) => {
      if (dead) return
      setManual(urls.filter(Boolean).map((url) => ({ url, title: item.title, manual: true })))
    })
    return () => { dead = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey])

  return [...manual, ...(wantWiki ? (list ?? []) : [])]
}

/* Thumbnail used inside itinerary cards */
export function ItemThumb({ item }) {
  const ref = useRef(null)
  const visible = useOnScreen(ref)
  const images = useItemImages(item, visible)
  const eligible = item.imgs?.length || (item.lat != null && item.type !== 'drive' && item.type !== 'info')

  if (!eligible) return null
  /* the probe div must keep ≥1px size even without an image, or the
     IntersectionObserver never fires and the fetch never starts */
  return (
    <div ref={ref} className="min-h-px min-w-px shrink-0 self-start" aria-hidden>
      {images[0] && (
        <img
          src={images[0].url}
          alt=""
          loading="lazy"
          className="anim-fade-in size-16 rounded-lg object-cover ring-1 ring-ink-900/10 sm:size-20"
        />
      )}
    </div>
  )
}

/* Larger cover used in suggestion cards */
export function SuggestionImage({ item }) {
  const ref = useRef(null)
  const visible = useOnScreen(ref)
  const images = useItemImages(item, visible)
  return (
    <div ref={ref} className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:h-24 sm:w-36">
      {images[0] && <img src={images[0].url} alt="" loading="lazy" className="anim-fade-in h-full w-full object-cover" />}
    </div>
  )
}
