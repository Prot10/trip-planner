/* Demo-mode pre-boot: must run BEFORE i18n and the stores are imported.
   Handles the ?lang= and ?reset query params the promo site uses to drive
   the embedded demo. No-ops entirely outside demo builds. */

if (import.meta.env.VITE_DEMO === '1') {
  try {
    const params = new URLSearchParams(location.search)
    const lang = params.get('lang')
    if (lang === 'it' || lang === 'en') localStorage.setItem('ui.lang', lang)
    if (params.has('reset')) sessionStorage.clear()
    if (lang || params.has('reset')) {
      params.delete('lang')
      params.delete('reset')
      const qs = params.toString()
      history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''))
    }
  } catch { /* storage unavailable: the demo still works, just not deep-linked */ }
}
