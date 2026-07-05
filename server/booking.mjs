/* Live accommodation search on Booking.com, executed on the local server.

   Booking has no open API and its search pages sit behind a JS challenge
   that blocks plain HTTP clients — but a real headless Chrome (the user's
   own browser, which every host of this app has) renders them fine. We
   drive it with puppeteer-core, parse the property cards and return real
   names, real total prices for the exact dates, review scores, sold-out
   flags and direct deep links. If anything fails (no Chrome, layout change,
   network) the tool degrades to a prefilled search URL instead of erroring:
   the agent can always give the user a working link. */

import { getBrowser, newStealthPage } from './chrome.mjs'

export { findChrome } from './chrome.mjs'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const CURRENCY_OF = { '€': 'EUR', '$': 'USD', 'US$': 'USD', '£': 'GBP' }

/* free-text ss can bind to a property instead of the town (e.g. "Vik i
   Myrdal" → the hotel of that name): resolve the AREA through Booking's
   autocomplete, preferring cities. Best-effort — null falls back to ss. */
const AREA_TYPES = ['city', 'district', 'landmark', 'region']
async function resolveDestination(query) {
  try {
    const res = await fetch('https://accommodations.booking.com/autocomplete.json', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, language: 'en-us', size: 6 }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const candidates = []
    for (const r of data.results ?? []) {
      candidates.push({ dest_id: r.dest_id, dest_type: r.dest_type, label: r.label ?? r.label1 })
      /* a hotel hit still names its town in the labels breakdown */
      for (const l of r.labels ?? []) {
        if (l.dest_id && l.dest_type !== 'hotel') candidates.push({ dest_id: l.dest_id, dest_type: l.dest_type, label: l.text })
      }
    }
    for (const type of AREA_TYPES) {
      const hit = candidates.find((c) => c.dest_type === type && c.dest_id)
      if (hit) return hit
    }
    return candidates[0]?.dest_id ? candidates[0] : null
  } catch {
    return null
  }
}

function searchUrl({ location, checkin, checkout, adults, rooms, currency, dest }) {
  return 'https://www.booking.com/searchresults.html?' + new URLSearchParams({
    ss: dest?.label ?? location,
    ...(dest ? { dest_id: String(dest.dest_id), dest_type: dest.dest_type } : {}),
    checkin,
    checkout,
    group_adults: String(adults),
    no_rooms: String(rooms),
    group_children: '0',
    selected_currency: currency,
    lang: 'en-us',
    order: 'review_score_and_price',
  })
}

export async function searchHotels(args) {
  const location = String(args.location ?? '').trim()
  const checkin = String(args.checkin ?? '')
  const checkout = String(args.checkout ?? '')
  const adults = Math.max(1, Math.min(10, Number(args.adults) || 2))
  const rooms = Math.max(1, Math.min(5, Number(args.rooms) || 1))
  const currency = args.currency === 'USD' ? 'USD' : 'EUR'
  const maxResults = Math.max(1, Math.min(10, Number(args.max_results) || 6))

  if (!location) throw new Error('location mancante.')
  if (!DATE_RE.test(checkin) || !DATE_RE.test(checkout)) throw new Error('checkin/checkout devono essere date YYYY-MM-DD.')
  const nights = Math.round((new Date(checkout) - new Date(checkin)) / 86_400_000)
  if (nights < 1) throw new Error('checkout deve essere successivo a checkin.')

  const dest = await resolveDestination(location)
  const url = searchUrl({ location, checkin, checkout, adults, rooms, currency, dest })
  const base = { location, resolved_as: dest?.label ?? location, checkin, checkout, nights, adults, rooms, search_url: url }

  let page = null
  try {
    const browser = await getBrowser()
    page = await newStealthPage(browser, { width: 1280, height: 1600 })
    await page.setRequestInterception(true)
    page.on('request', (r) => {
      const t = r.resourceType()
      if (t === 'image' || t === 'font' || t === 'media') r.abort()
      else r.continue()
    })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 25_000 })
    /* results hydrate progressively: scroll and poll until we have enough
       cards or the count stops growing */
    let seen = 0
    for (let i = 0; i < 10; i++) {
      const n = await page.evaluate(() => document.querySelectorAll('[data-testid="property-card"]').length)
      if (n >= maxResults || (i > 1 && n === seen)) break
      seen = n
      await page.evaluate(() => window.scrollBy(0, 1600))
      await new Promise((r) => setTimeout(r, 700))
    }
    await new Promise((r) => setTimeout(r, 800))

    /* "Vík: 12 properties found" / "…: 1 exact match" — how many are
       bookable for these dates (wording varies with destination size) */
    const resultsFound = await page.evaluate(() => {
      const h = document.querySelector('h1')?.textContent ?? ''
      if (/no propert/i.test(h)) return 0
      const m = h.match(/([\d.,]+)/)
      return m ? Number(m[1].replace(/[.,]/g, '')) : null
    })

    const raw = await page.evaluate((max) => {
      return [...document.querySelectorAll('[data-testid="property-card"]')].slice(0, max).map((card) => {
        const pick = (sel) => card.querySelector(sel)?.textContent?.trim() ?? null
        return {
          name: pick('[data-testid="title"]'),
          priceText: pick('[data-testid="price-and-discounted-price"]'),
          reviewText: pick('[data-testid="review-score"]'),
          href: card.querySelector('a[data-testid="title-link"]')?.href ?? null,
          soldOut: /unavailable on our site|sold out/i.test(card.textContent ?? ''),
        }
      })
    }, maxResults)

    /* the page's embedded state carries each property's coordinates keyed by
       its URL slug: "…,"longitude":15.25},"pageName":"the-barn"" */
    const coordsBySlug = await page.evaluate(() => {
      const out = {}
      const html = document.documentElement.outerHTML
      for (const m of html.matchAll(/"latitude":(-?[\d.]+),"longitude":(-?[\d.]+)\},"pageName":"([^"]+)"/g)) {
        out[m[3]] = { lat: Number(m[1]), lng: Number(m[2]) }
      }
      return out
    })

    const properties = raw
      .filter((p) => p.name)
      .map((p) => {
        const amount = p.priceText ? Number((p.priceText.match(/[\d.,\s]+/)?.[0] ?? '').replace(/[.,](?=\d{3}\b)/g, '').replace(/\s/g, '').replace(',', '.')) : null
        const symbol = p.priceText?.match(/US\$|[€$£]/)?.[0]
        const score = p.reviewText ? Number(p.reviewText.match(/\d+(?:[.,]\d)?/)?.[0]?.replace(',', '.')) : null
        const reviews = p.reviewText?.match(/([\d.,]+)\s*review/i)?.[1]?.replace(/[.,]/g, '') ?? null
        const available = !p.soldOut && amount != null && Number.isFinite(amount)
        /* deep link with the dates and party prefilled */
        const link = p.href
          ? p.href.split('?')[0] + '?' + new URLSearchParams({ checkin, checkout, group_adults: String(adults), no_rooms: String(rooms), selected_currency: currency })
          : url
        const slug = p.href?.match(/\/hotel\/[a-z]{2}\/([^./]+)\./)?.[1]
        const coords = slug ? coordsBySlug[slug] : null
        return {
          name: p.name,
          available,
          total_price: available ? Math.round(amount) : null,
          price_per_night: available ? Math.round(amount / nights) : null,
          currency: CURRENCY_OF[symbol] ?? currency,
          review_score: Number.isFinite(score) ? score : null,
          review_count: reviews ? Number(reviews) : null,
          lat: coords?.lat,
          lng: coords?.lng,
          url: link,
        }
      })

    /* rank by TRUSTWORTHY quality: a 8.7 backed by thousands of reviews must
       outrank a 10 with one review (bayesian average, prior 8.0 over 30
       reviews); sold-out properties sink to the end */
    const bayes = (p) => {
      const n = p.review_count ?? 0
      const s = p.review_score ?? 0
      return (n / (n + 30)) * s + (30 / (n + 30)) * 8.0
    }
    properties.sort((a, b) => (b.available - a.available) || (bayes(b) - bayes(a)))

    return {
      ...base,
      results_found: resultsFound,
      properties,
      note: `Prezzi TOTALI reali per ${nights} notti, ${adults} adulti (Booking.com), ordinate per qualità AFFIDABILE (punteggio pesato sul numero di recensioni: preferisci strutture con decine/centinaia di recensioni, poche recensioni solo se non ci sono alternative). available=false = al completo per queste date; results_found basso = zona quasi al completo, consiglia di prenotare subito. Usa gli url come link diretti e riporta lat/lng quando proponi le opzioni.`,
    }
  } catch (e) {
    const reason = e?.message === 'CHROME_NOT_FOUND'
      ? 'Chrome non trovato sul server (installalo o imposta ULISSE_CHROME).'
      : `ricerca live non riuscita (${String(e?.message ?? e).slice(0, 120)}).`
    return {
      ...base,
      properties: [],
      hint: `${reason} Usa search_url come link "Cerca su Booking" e dichiara i prezzi come stime dal budget.`,
    }
  } finally {
    try { await page?.close() } catch { /* browser may be gone */ }
  }
}
