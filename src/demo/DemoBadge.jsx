import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlaskConical, RotateCcw, Info, X } from 'lucide-react'

const REPO = 'https://github.com/Prot10/MyTripPlanner'

function GitHubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

const restart = () => {
  try { sessionStorage.clear() } catch { /* best effort */ }
  location.reload()
}

const SEEN_KEY = 'demo.disclaimerSeen'

/* floating pill, desktop only: on phones it collided with sheets and
   composers, so mobile shows DemoBadgeInline inside the header instead.
   This is the one component always mounted from app boot (see main.jsx),
   so it also owns the once-per-session auto-shown disclaimer — it must
   actually be seen, not just wait for someone to notice the (i) icon. */
export default function DemoBadge() {
  const { i18n } = useTranslation()
  const it = String(i18n.language || '').startsWith('it')
  const [info, setInfo] = useState(() => {
    try { return sessionStorage.getItem(SEEN_KEY) !== '1' } catch { return true }
  })
  const close = () => {
    try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* best effort */ }
    setInfo(false)
  }
  return (
    <>
      <div className="fixed bottom-3 left-3 z-[900] hidden items-center gap-1 rounded-full border border-violet-200 bg-white/90 py-1 pl-2.5 pr-1 text-[11px] font-bold text-violet-700 shadow-lg backdrop-blur lg:flex">
        <FlaskConical size={12} />
        Demo
        <button
          onClick={() => setInfo(true)}
          title={it ? 'Cos’è questa demo?' : 'What is this demo?'}
          className="flex items-center rounded-full p-0.5 text-violet-500 transition hover:bg-violet-100 hover:text-violet-700"
        >
          <Info size={13} />
        </button>
        <button
          onClick={restart}
          title={it ? 'Ricomincia la demo da zero' : 'Restart the demo from scratch'}
          className="ml-0.5 flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-600 transition hover:bg-violet-100"
        >
          <RotateCcw size={11} />
          {it ? 'Ricomincia' : 'Restart'}
        </button>
      </div>
      <DemoDisclaimer open={info} onClose={close} it={it} />
    </>
  )
}

/* compact chip for mobile bars (planner stats strip, interview top bar,
   dashboard header). Renders nothing outside demo builds so callers can
   drop it in unconditionally. */
export function DemoBadgeInline({ className = '' }) {
  const { i18n } = useTranslation()
  const [info, setInfo] = useState(false)
  if (import.meta.env.VITE_DEMO !== '1') return null
  const it = String(i18n.language || '').startsWith('it')
  return (
    <>
      <button
        onClick={() => setInfo(true)}
        title={it ? 'Cos’è questa demo?' : 'What is this demo?'}
        className={`flex shrink-0 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 lg:hidden ${className}`}
      >
        <FlaskConical size={11} />
        Demo
        <Info size={11} className="text-violet-500" />
      </button>
      <DemoDisclaimer open={info} onClose={() => setInfo(false)} it={it} onRestart={restart} />
    </>
  )
}

/* the actual disclaimer: this is not a live agent session, it's a scripted
   replay of a recorded trace — real edits happen against the real store
   (so the itinerary/map/budget are genuinely built live), but Ulisse's
   "thinking" is pre-written, not a real model call. */
function DemoDisclaimer({ open, onClose, it, onRestart }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[950] flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up w-full max-w-sm rounded-2xl border border-violet-200 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600">
            <FlaskConical size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-extrabold text-ink-900">
              {it ? 'Non è una sessione live' : 'This isn’t running live'}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
              {it
                ? 'Le risposte di Ulisse qui sono uno script preregistrato, non una vera chiamata a un modello: è una simulazione da una traccia registrata. L’itinerario, la mappa e il budget però si costruiscono davvero, dal vivo, con le stesse azioni del vero Ulisse.'
                : 'Ulisse’s replies here are a pre-recorded script, not a real model call: it’s a simulation replayed from a recorded trace. The itinerary, map and budget, though, really are built live, with the same actions the real Ulisse would take.'}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
              {it
                ? 'Per provarlo per davvero, con un agente vero e i tuoi abbonamenti Claude o ChatGPT: scarica il repository e avvialo sul tuo computer.'
                : 'To try it for real, with a real agent and your own Claude or ChatGPT subscription: download the repository and start it on your machine.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-ink-200 px-3.5 py-2 text-[12.5px] font-bold text-ink-600 transition hover:bg-ink-50"
              >
                <GitHubIcon size={14} />
                {it ? 'Vai al repository' : 'Get it on GitHub'}
              </a>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-xl bg-ink-900 px-3.5 py-2 text-[12.5px] font-bold text-white shadow-md transition hover:bg-ink-700"
              >
                {it ? 'Continua' : 'Continue'}
              </button>
              {onRestart && (
                <button
                  onClick={onRestart}
                  className="flex items-center gap-1.5 rounded-xl border border-ink-200 px-3.5 py-2 text-[12.5px] font-bold text-ink-600 transition hover:bg-ink-50"
                >
                  <RotateCcw size={13} />
                  {it ? 'Ricomincia la demo' : 'Restart the demo'}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={it ? 'Chiudi' : 'Close'}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
