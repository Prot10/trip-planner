import { useEffect, useRef, useState } from 'react'
import { KeyRound, NotebookPen, Undo2, MessageCircleQuestion, Bot, Wrench, Check } from 'lucide-react'
import { useLang } from '../i18n.jsx'
import { Kicker, SectionTitle } from '../components.jsx'

const ICONS = [KeyRound, NotebookPen, Undo2, MessageCircleQuestion]

export default function Ulisse() {
  const { t } = useLang()
  const points = t('ulisse.points')
  return (
    <section id="ulisse" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <Kicker>{t('ulisse.kicker')}</Kicker>
          <SectionTitle>{t('ulisse.title')}</SectionTitle>
          <p className="rv mt-4 max-w-lg text-[15px] leading-relaxed text-ink-500" style={{ '--rv-d': '100ms' }}>
            {t('ulisse.sub')}
          </p>
          <ul className="mt-8 flex flex-col gap-5">
            {points.map((p, i) => {
              const Icon = ICONS[i]
              return (
                <li key={p.t} className="rv group flex items-start gap-3.5" style={{ '--rv-d': `${150 + i * 90}ms` }}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600 shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className="block font-display text-[15px] font-bold text-ink-900">{p.t}</span>
                    <span className="mt-0.5 block max-w-md text-[13.5px] leading-relaxed text-ink-500">{p.d}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <ChatLoop />
      </div>
    </section>
  )
}

/* a self-playing chat vignette: user asks, tools run, Ulisse answers, undo
   bar slides in — then it loops. Restarts when scrolled back into view. */
function ChatLoop() {
  const { lang, t } = useLang()
  const script = t('ulisse.chat')
  const [stage, setStage] = useState(0) // how many messages are visible
  const [typed, setTyped] = useState('') // assistant text being typed
  const boxRef = useRef(null)

  useEffect(() => {
    let alive = true
    let timers = []
    const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms))

    const cycle = () => {
      setStage(0); setTyped('')
      later(() => setStage(1), 700)                 // user bubble
      later(() => setStage(2), 1700)                // thinking dots
      later(() => setStage(3), 2600)                // tool chip 1
      later(() => setStage(4), 3400)                // tool chip 2
      later(() => setStage(5), 4200)                // assistant starts typing
      const answer = script[3].text
      for (let i = 1; i <= answer.length; i++) {
        later(() => setTyped(answer.slice(0, i)), 4200 + i * 18)
      }
      later(() => setStage(6), 4200 + answer.length * 18 + 500) // undo bar
      later(cycle, 4200 + answer.length * 18 + 5200)            // loop
    }

    /* only animate while visible */
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { alive = true; cycle() }
        else { alive = false; timers.forEach(clearTimeout); timers = [] }
      },
      { threshold: 0.35 },
    )
    if (boxRef.current) ob.observe(boxRef.current)
    return () => { alive = false; timers.forEach(clearTimeout); ob.disconnect() }
  }, [script])

  return (
    <div ref={boxRef} className="rv-scale relative" style={{ '--rv-d': '150ms' }}>
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-100 via-brand-50 to-rose-100 opacity-80 blur-xl" />
      <div className="relative overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-2xl shadow-violet-500/10">
        <div className="flex items-center gap-2.5 border-b border-ink-100 bg-gradient-to-r from-violet-50 to-brand-50/50 px-4 py-3">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
            <Bot size={15} />
          </span>
          <div>
            <p className="font-display text-[13px] font-extrabold text-ink-900">Ulisse</p>
            <p className="flex items-center gap-1 text-[10.5px] font-semibold text-ink-400">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Claude · Sonnet
            </p>
          </div>
        </div>

        <div className="flex min-h-[21rem] flex-col gap-2.5 px-4 py-4 sm:min-h-[19rem]">
          {stage >= 1 && (
            <div className="bubble-in self-end rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm">
              {script[0].text}
            </div>
          )}
          {stage === 2 && (
            <div className="bubble-in flex gap-1 self-start px-1 py-2">
              <span className="tdot size-1.5 rounded-full bg-violet-400" />
              <span className="tdot size-1.5 rounded-full bg-violet-400" style={{ animationDelay: '.15s' }} />
              <span className="tdot size-1.5 rounded-full bg-violet-400" style={{ animationDelay: '.3s' }} />
            </div>
          )}
          {stage >= 3 && <ToolChip text={script[1].text} />}
          {stage >= 4 && <ToolChip text={script[2].text} />}
          {stage >= 5 && (
            <div className="bubble-in max-w-[92%] self-start text-[13px] leading-relaxed text-ink-800">
              {typed}
              {stage === 5 && <span className="caret ml-0.5" />}
            </div>
          )}
          <div className="mt-auto" />
          {stage >= 6 && (
            <div className="bubble-in flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <span className="text-[11.5px] font-bold text-amber-800">{t('ulisse.undo').split(' · ')[0]}</span>
              <span className="flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2 py-1 text-[11px] font-bold text-amber-700">
                <Undo2 size={11} /> {t('ulisse.undo').split(' · ')[1]}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-ink-100 px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-[12.5px] text-ink-300 ring-1 ring-ink-200">
            {lang === 'it' ? 'Scrivi all’assistente…' : 'Message the assistant…'}
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolChip({ text }) {
  return (
    <div className="bubble-in flex w-fit items-center gap-1.5 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-500">
      <Wrench size={11} className="text-ink-400" />
      {text}
      <Check size={11} strokeWidth={3} className="text-emerald-500" />
    </div>
  )
}
