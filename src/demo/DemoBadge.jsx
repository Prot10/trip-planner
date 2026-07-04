import { useTranslation } from 'react-i18next'
import { FlaskConical, RotateCcw } from 'lucide-react'

/* small floating pill shown only in demo builds: labels the sandbox and
   offers a one-click restart (fresh sessionStorage → pristine demo) */
export default function DemoBadge() {
  const { i18n } = useTranslation()
  const it = String(i18n.language || '').startsWith('it')
  const restart = () => {
    try { sessionStorage.clear() } catch { /* best effort */ }
    location.reload()
  }
  return (
    <div className="fixed bottom-16 left-3 z-[900] flex items-center gap-1 rounded-full border border-violet-200 bg-white/90 py-1 pl-2.5 pr-1 text-[11px] font-bold text-violet-700 shadow-lg backdrop-blur lg:bottom-3">
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
