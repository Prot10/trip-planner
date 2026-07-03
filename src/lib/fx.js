/* EUR→USD rate for fuel prices entered in €/L (frankfurter.dev, free, no key).
   Cached for 24h; a sensible constant covers the first render and offline use. */
const KEY = 'tripplanner.fx.eurusd'
let rate = 1.08

try {
  const c = JSON.parse(localStorage.getItem(KEY) ?? 'null')
  if (c?.v > 0) rate = c.v
} catch { /* corrupt cache */ }

export function eurUsd() {
  return rate
}

export async function refreshFx() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (c?.v > 0 && Date.now() - c.t < 86_400_000) { rate = c.v; return rate }
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD')
    const data = await r.json()
    if (data?.rates?.USD > 0) {
      rate = data.rates.USD
      localStorage.setItem(KEY, JSON.stringify({ v: rate, t: Date.now() }))
    }
  } catch { /* offline: keep the cached/default rate */ }
  return rate
}
