/* Live restaurant/food search on Google Maps, executed on the local server.

   Google Maps has no free API, but its web app renders fine in a real
   headless Chrome (same trick as booking.mjs). Signed-out search results
   only expose name/rating/coords, so we do a two-step scrape: the search
   feed for the candidate list, then each candidate's place page — which
   carries the review count ("4,304 reviews") and the price range
   ("€20–30") the search feed hides. If anything fails the tool degrades
   to a prefilled Google Maps search URL instead of erroring. */

import { getBrowser, newStealthPage } from './chrome.mjs'

/* pre-answer the EU consent wall (the cookie "reject all" would set) */
const SOCS_COOKIE = { name: 'SOCS', value: 'CAESEwgDEgk2MzM4MTIyNDAaAmVuIAEaBgiA_LyaBg', domain: '.google.com', path: '/' }

const NAV_TIMEOUT = 25_000

async function preparePage(browser) {
  const page = await newStealthPage(browser, { width: 1280, height: 1200 })
  await page.setCookie(SOCS_COOKIE)
  await page.setRequestInterception(true)
  page.on('request', (r) => {
    const t = r.resourceType()
    if (t === 'image' || t === 'font' || t === 'media') r.abort()
    else r.continue()
  })
  return page
}

/* Google biases results toward the caller's IP region: "pizza in Napoli"
   from a German exit node returns Frankfurt pizzerias. Anchoring the search
   URL to the destination's real viewport (and filtering strays) fixes it. */
async function geocode(query) {
  try {
    const res = await fetch('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ format: 'json', q: query, limit: '1' }), {
      headers: { 'user-agent': 'Ulisse trip planner (local app)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const hit = (await res.json())[0]
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null
  } catch {
    return null
  }
}

const distKm = (a, b) => {
  const dLat = (a.lat - b.lat) * 111
  const dLng = (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot(dLat, dLng)
}

/* "€20–30", "$10–20", "€100+", "££", "US$50–100" — whatever Google shows */
const PRICE_RANGE_RE = /(?:€|US\$|\$|£|¥|₹)\s?\d+(?:[.,]\d+)?\s?[–—-]\s?\d+(?:[.,]\d+)?\+?|(?:€|US\$|\$|£|¥|₹)\s?\d+(?:[.,]\d+)?\+/
const PRICE_LEVEL_RE = /^(?:[€$£¥₹]{1,4})$/m

/* enrich one candidate by visiting its place page: review count and price
   range live only there when signed out. Best-effort — feed data survives. */
async function enrichPlace(page, cand) {
  try {
    await page.goto(cand.href, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
    await page.waitForFunction(() => {
      return [...document.querySelectorAll('div[role="main"]')].some((m) => {
        const h = m.querySelector('h1')?.textContent?.trim()
        return h && h !== 'Results'
      })
    }, { timeout: 12_000 })
    const detail = await page.evaluate(() => {
      const main = [...document.querySelectorAll('div[role="main"]')].find((m) => {
        const h = m.querySelector('h1')?.textContent?.trim()
        return h && h !== 'Results'
      })
      if (!main) return null
      const aria = (re) => {
        for (const el of main.querySelectorAll('[aria-label]')) {
          const m = el.getAttribute('aria-label')?.match(re)
          if (m) return m
        }
        return null
      }
      return {
        rating: aria(/^([\d.]+)\s+stars?/i)?.[1] ?? null,
        reviews: aria(/^([\d.,  ]+)\s+reviews?/i)?.[1] ?? null,
        text: main.innerText?.slice(0, 1500) ?? '',
      }
    })
    if (!detail) return cand
    const priceRange = detail.text.match(PRICE_RANGE_RE)?.[0]?.replace(/\s+/g, '') ?? detail.text.match(PRICE_LEVEL_RE)?.[0] ?? null
    return {
      ...cand,
      rating: detail.rating ? Number(detail.rating) : cand.rating,
      review_count: detail.reviews ? Number(detail.reviews.replace(/[.,  ]/g, '')) : null,
      price_range: priceRange,
    }
  } catch {
    return cand
  }
}

export async function searchRestaurants(args) {
  const location = String(args.location ?? '').trim()
  const what = String(args.query ?? '').trim()
  const maxResults = Math.max(2, Math.min(6, Number(args.max_results) || 4))
  if (!location) throw new Error('location mancante.')

  const searchQuery = what ? `${what} in ${location}` : `restaurants in ${location}`
  /* anchor the map viewport on the destination so the IP region can't win */
  const anchor = await geocode(location)
  const searchUrl = 'https://www.google.com/maps/search/' + encodeURIComponent(searchQuery)
    + (anchor ? `/@${anchor.lat.toFixed(5)},${anchor.lng.toFixed(5)},14z` : '')
    + '?hl=en'
  const base = { location, query: searchQuery, search_url: searchUrl }

  let page = null
  let page2 = null
  try {
    const browser = await getBrowser()
    page = await preparePage(browser)
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
    await page.waitForSelector('div[role="feed"] a[href*="/maps/place/"]', { timeout: 20_000 })
    /* one nudge so the first batch finishes hydrating */
    await page.evaluate(() => document.querySelector('div[role="feed"]')?.scrollBy(0, 1200))
    await new Promise((r) => setTimeout(r, 900))

    const candidates = await page.evaluate(() => {
      const feed = document.querySelector('div[role="feed"]')
      const seen = new Set()
      const out = []
      for (const a of feed.querySelectorAll('a[href*="/maps/place/"]')) {
        const name = a.getAttribute('aria-label')?.trim()
        if (!name || seen.has(name)) continue
        seen.add(name)
        let card = a
        while (card.parentElement && card.parentElement !== feed) card = card.parentElement
        const lines = (card.innerText ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
        /* "Sicilian restaurant ·  · Via Calapitrulli, 3" */
        const catLine = lines.find((l) => l.includes(' · '))
        const parts = catLine ? catLine.split('·').map((s) => s.trim()).filter(Boolean) : []
        const rating = card.querySelector('span[role="img"]')?.getAttribute('aria-label')?.match(/^([\d.]+)\s+stars?/i)?.[1]
        const coords = a.href.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/)
        out.push({
          name,
          href: a.href,
          rating: rating ? Number(rating) : null,
          category: parts[0] ?? null,
          address: parts.length > 1 ? parts[parts.length - 1] : null,
          lat: coords ? Number(coords[1]) : null,
          lng: coords ? Number(coords[2]) : null,
          place_id: a.href.match(/!19s([^?!/]+)/)?.[1] ?? null,
        })
      }
      return out
    })
    if (!candidates.length) throw new Error('nessun risultato nel feed')
    /* belt and braces: drop anything absurdly far from the destination
       (Google can still sneak in an IP-region hit despite the anchor) */
    const nearby = anchor ? candidates.filter((c) => c.lat == null || distKm(c, anchor) < 60) : candidates
    if (!nearby.length) throw new Error(`nessun risultato vicino a ${location}`)

    /* visit the top candidates' place pages (2 tabs in parallel) to get
       review counts and price ranges */
    const toEnrich = nearby.slice(0, Math.min(nearby.length, maxResults + 2))
    page2 = await preparePage(browser)
    const enriched = []
    const queue = [...toEnrich.entries()]
    await Promise.all([page, page2].map(async (p) => {
      for (;;) {
        const next = queue.shift()
        if (!next) return
        const [i, cand] = next
        enriched[i] = await enrichPlace(p, cand)
      }
    }))

    /* rank by TRUSTWORTHY quality (5-point scale): a 4.5 with thousands of
       reviews must outrank a 5.0 with a handful (bayesian, prior 4.0 over
       150 reviews — restaurant review counts run in the thousands, so the
       prior must stay heavy); unknown counts sink via n=0 */
    const bayes = (p) => {
      const n = p.review_count ?? 0
      const s = p.rating ?? 0
      return (n / (n + 150)) * s + (150 / (n + 150)) * 4.0
    }
    const places = enriched
      .filter(Boolean)
      .sort((a, b) => bayes(b) - bayes(a))
      .slice(0, maxResults)
      .map((p) => ({
        name: p.name,
        rating: p.rating,
        review_count: p.review_count,
        price_range: p.price_range ?? null,
        category: p.category,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        url: p.place_id
          ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name + (p.address ? ', ' + p.address : '')) + '&query_place_id=' + p.place_id
          : searchUrl,
      }))

    return {
      ...base,
      results_found: nearby.length,
      places,
      note: `Dati REALI da Google Maps, ordinati per qualità AFFIDABILE (punteggio pesato sul numero di recensioni: un 4,5 con migliaia di recensioni vale più di un 5,0 con poche decine — preferisci recensioni solide, poche solo se non ci sono alternative, dicendolo). price_range = spesa media a persona dichiarata dagli utenti Google. Usa gli url come link diretti e riporta SEMPRE lat/lng, rating, review_count e price_range quando proponi le opzioni.`,
    }
  } catch (e) {
    const reason = e?.message === 'CHROME_NOT_FOUND'
      ? 'Chrome non trovato sul server (installalo o imposta ULISSE_CHROME).'
      : `ricerca live non riuscita (${String(e?.message ?? e).slice(0, 120)}).`
    return {
      ...base,
      places: [],
      hint: `${reason} Usa search_url come link "Cerca su Google Maps" e proponi posti noti dalla tua conoscenza dichiarando che punteggi e prezzi vanno verificati.`,
    }
  } finally {
    try { await page?.close() } catch { /* browser may be gone */ }
    try { await page2?.close() } catch { /* browser may be gone */ }
  }
}
