import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import { LANGS } from '../i18n/langs'

/* Language picker: pill + popover with native language names (an English
   speaker stuck in Italian must be able to find "English"). Persistence is
   centralized in the languageChanged listener (src/i18n/index.js). */
export default function LanguageSwitcher({ compact = false, up = false, align = 'right' }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const cur = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={cur.native}
        title={cur.native}
        className={`flex items-center gap-1.5 rounded-xl border text-sm font-semibold shadow-sm transition ${
          compact ? 'p-2' : 'px-3 py-2'
        } ${open ? 'border-brand-400 text-brand-600 ring-2 ring-brand-400/20' : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:text-ink-800'}`}
      >
        <Globe size={16} className="shrink-0" />
        {!compact && <span className="uppercase tracking-wide text-xs font-bold">{cur.code}</span>}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language"
          className={`anim-fade-up absolute z-[960] w-44 rounded-2xl border border-ink-200 bg-white p-1.5 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${up ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'}`}
        >
          {LANGS.map((l) => {
            const active = l.code === cur.code
            return (
              <button
                key={l.code}
                role="option"
                aria-selected={active}
                onClick={() => { i18n.changeLanguage(l.code); setOpen(false) }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] transition ${
                  active ? 'bg-brand-50 font-bold text-brand-700' : 'font-semibold text-ink-600 hover:bg-ink-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`grid size-6 place-items-center rounded-md text-[10px] font-bold uppercase ${
                    active ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500'
                  }`}>
                    {l.code}
                  </span>
                  {l.native}
                </span>
                {active && <Check size={15} className="text-brand-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
