import { CalendarDays, MapPin, Route, Wallet, NotebookPen } from 'lucide-react'
import { useLang } from '../i18n.jsx'
import { useTilt } from '../fx'
import { MagnetLink, BrowserFrame, GitHubIcon, shot } from '../components.jsx'

export default function Hero() {
  const { lang, t } = useLang()
  const tilt = useTilt(4)

  /* staggered word-mask reveal, re-triggered when the language changes.
     background-clip:text does not reach through the mask spans, so the
     gradient class must sit on each word itself. */
  const line = (text, base, wordClass = '') =>
    text.split(' ').map((w, i) => (
      <span key={`${lang}-${w}-${i}`} className="word-mask">
        <span className={wordClass} style={{ '--wd': `${base + i * 70}ms` }}>{w}&nbsp;</span>
      </span>
    ))

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-28 sm:pt-36">
      {/* backdrop: dotted grid + drifting color blobs */}
      <div className="dot-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(75%_60%_at_50%_35%,black,transparent)]" />
      <div className="blob left-[8%] top-[6%] h-72 w-72 bg-brand-300" />
      <div className="blob right-[6%] top-[16%] h-80 w-80 bg-violet-300" style={{ animationDelay: '-6s' }} />
      <div className="blob bottom-[8%] left-[38%] h-72 w-96 bg-rose-200" style={{ animationDelay: '-12s' }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="anim-eyebrow inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/80 px-4 py-1.5 text-[12px] font-bold text-ink-500 shadow-sm backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {t('hero.eyebrow')}
          </p>

          <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.06] tracking-tight text-ink-900 sm:text-6xl lg:text-[4.2rem]">
            {line(t('hero.titleA'), 100)}
            <br />
            {line(t('hero.titleB'), 450, 'grad-text')}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-500 sm:text-[16.5px]">
            {t('hero.sub')}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <MagnetLink href="#demo">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
              </span>
              {t('hero.ctaDemo')}
            </MagnetLink>
            <MagnetLink href="https://github.com/Prot10/trip-planner" variant="ghost">
              <GitHubIcon size={16} />
              {t('hero.ctaGit')}
            </MagnetLink>
          </div>
          <p className="mt-4 text-[12.5px] font-medium text-ink-400">{t('hero.hint')}</p>
        </div>

        {/* the product, held up by floating live chips */}
        <div className="relative mx-auto mt-14 max-w-5xl sm:mt-20">
          <RouteDoodle />
          <div ref={tilt} className="tilt tilt-glare relative rounded-2xl">
            <BrowserFrame url="localhost:5200 — Trip Planner">
              <img
                src={shot('hero.png')}
                width="2200"
                height="1330"
                alt={lang === 'it' ? 'Il planner: itinerario, mappa e chat con Ulisse' : 'The planner: itinerary, map and the Ulisse chat'}
                className="block w-full"
              />
            </BrowserFrame>
          </div>

          <FloatChip className="-left-3 -top-7 hidden sm:flex" delay="0s" rot="-3deg">
            <CalendarDays size={13} className="text-brand-500" />
            {lang === 'it' ? '5 giorni · 33 tappe' : '5 days · 33 stops'}
          </FloatChip>
          <FloatChip className="-right-2 -top-5 hidden sm:flex" delay="-2.2s" rot="2deg">
            <Route size={13} className="text-sky-500" />
            1.171 km
          </FloatChip>
          <FloatChip className="-bottom-5 left-[12%] hidden md:flex" delay="-3.4s" rot="1.5deg">
            <Wallet size={13} className="text-emerald-600" />
            {lang === 'it' ? '1.153 € stimati' : '€1,153 estimated'}
          </FloatChip>
          <FloatChip className="-bottom-6 right-[8%] hidden sm:flex" delay="-1.4s" rot="-2deg">
            <NotebookPen size={13} className="text-violet-500" />
            {lang === 'it' ? 'Ulisse sta scrivendo' : 'Ulisse is writing'}
            <span className="flex gap-0.5">
              <span className="tdot size-1 rounded-full bg-violet-400" />
              <span className="tdot size-1 rounded-full bg-violet-400" style={{ animationDelay: '.15s' }} />
              <span className="tdot size-1 rounded-full bg-violet-400" style={{ animationDelay: '.3s' }} />
            </span>
          </FloatChip>
        </div>
      </div>
    </section>
  )
}

function FloatChip({ children, className = '', delay = '0s', rot = '0deg' }) {
  return (
    <div
      className={`floaty absolute z-10 items-center gap-1.5 rounded-2xl border border-ink-200 bg-white/95 px-3.5 py-2 text-[12px] font-bold text-ink-700 shadow-lg shadow-ink-900/10 backdrop-blur ${className}`}
      style={{ '--fdel': delay, '--fr': rot }}
    >
      {children}
    </div>
  )
}

/* a hand-drawn route above the screenshot: dashes draw in, pins pop */
function RouteDoodle() {
  const pins = [
    [60, 66, 0.9], [235, 28, 1.35], [420, 58, 1.8], [610, 22, 2.3], [780, 52, 2.8],
  ]
  return (
    <svg viewBox="0 0 840 90" fill="none" aria-hidden className="pointer-events-none absolute -top-16 left-1/2 hidden w-[560px] -translate-x-1/2 lg:block">
      <path
        d="M20 70 C 120 10, 200 60, 300 40 S 480 70, 560 34 S 720 10, 820 58"
        stroke="#fb923c"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 9"
        className="route-draw"
      />
      {pins.map(([x, y, d], i) => (
        <g key={i} className="pin-pop" style={{ '--pd': `${d}s` }}>
          <circle cx={x} cy={y} r="7" fill={i === pins.length - 1 ? '#8b5cf6' : '#f97316'} stroke="#fff" strokeWidth="2.5" />
          <circle cx={x} cy={y} r="2.4" fill="#fff" />
        </g>
      ))}
    </svg>
  )
}
