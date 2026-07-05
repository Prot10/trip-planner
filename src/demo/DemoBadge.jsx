import { useTranslation } from 'react-i18next'
import { FlaskConical, RotateCcw } from 'lucide-react'

const restart = () => {
  try { sessionStorage.clear() } catch { /* best effort */ }
  location.reload()
}

/* floating pill, desktop only: on phones it collided with sheets and
   composers, so mobile shows DemoBadgeInline inside the header instead */
export default function DemoBadge() {
  const { i18n } = useTranslation()
  const it = String(i18n.language || '').startsWith('it')
  return (
    <div className="fixed bottom-3 left-3 z-[900] hidden items-center gap-1 rounded-full border border-violet-200 bg-white/90 py-1 pl-2.5 pr-1 text-[11px] font-bold text-violet-700 shadow-lg backdrop-blur lg:flex">
      <FlaskConical size={12} />
      Demo
      <button
        onClick={restart}
        title={it ? 'Ricomincia la demo da zero' : 'Restart the demo from scratch'}
        className="ml-1 flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-600 transition hover:bg-violet-100"
      >
        <RotateCcw size={11} />
        {it ? 'Ricomincia' : 'Restart'}
      </button>
    </div>
  )
}

/* compact chip for mobile bars (planner stats strip, interview top bar,
   dashboard header). Renders nothing outside demo builds so callers can
   drop it in unconditionally. */
export function DemoBadgeInline({ className = '' }) {
  const { i18n } = useTranslation()
  if (import.meta.env.VITE_DEMO !== '1') return null
  const it = String(i18n.language || '').startsWith('it')
  return (
    <button
      onClick={restart}
      title={it ? 'Demo — ricomincia da zero' : 'Demo — restart from scratch'}
      className={`flex shrink-0 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 lg:hidden ${className}`}
    >
      <FlaskConical size={11} />
      Demo
      <RotateCcw size={10} className="text-violet-500" />
    </button>
  )
}
