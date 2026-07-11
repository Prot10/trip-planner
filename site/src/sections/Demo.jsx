import { useState } from 'react'
import { Play, RotateCcw, Maximize2, Lightbulb } from 'lucide-react'
import { useLang } from '../i18n.jsx'
import { Kicker, SectionTitle, ShotFrame, demoUrl, localizedShot } from '../components.jsx'

/* The real app, embedded. The iframe mounts on demand (poster first): the
   demo bundle is heavy and must not weigh on the landing page load. */
export default function Demo() {
  const { lang, t } = useLang()
  const [run, setRun] = useState(0) // 0 = poster, >0 = iframe key (bump = restart)

  return (
    <section id="demo" className="relative scroll-mt-16 overflow-hidden bg-ink-900 py-24 sm:py-32">
      {/* night-mode backdrop: the demo is the show */}
      <div className="dot-grid absolute inset-0 opacity-[.07]" />
      <div className="blob left-[10%] top-[10%] h-80 w-80 bg-brand-500/60" />
      <div className="blob right-[8%] bottom-[12%] h-80 w-80 bg-violet-500/50" style={{ animationDelay: '-9s' }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <p className="rv mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[12px] font-bold uppercase tracking-widest text-brand-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              {t('demo.kicker')}
            </p>
          </div>
          <h2 className="rv font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
            {t('demo.title')}
          </h2>
          <p className="rv mt-4 text-[15px] leading-relaxed text-ink-300" style={{ '--rv-d': '120ms' }}>
            {t('demo.sub')}
          </p>
        </div>

        <div className="rv-scale mt-12" style={{ '--rv-d': '200ms' }}>
          <ShotFrame className="mx-auto max-w-6xl">
            <div className="relative aspect-[4/5] bg-ink-100 sm:aspect-[16/10]">
              {run === 0 ? (
                <button
                  onClick={() => setRun(1)}
                  className="group absolute inset-0 block w-full cursor-pointer"
                  aria-label={t('demo.start')}
                >
                  <img src={localizedShot('poster', lang)} alt="" className="h-full w-full object-cover object-top opacity-90" />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink-900/50 via-ink-900/10 to-transparent" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="flex items-center gap-3 rounded-2xl bg-white px-7 py-4 font-display text-[16px] font-extrabold text-ink-900 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-rose-500 text-white shadow-md">
                        <Play size={16} fill="currentColor" />
                      </span>
                      {t('demo.start')}
                    </span>
                  </span>
                </button>
              ) : (
                <iframe
                  key={run}
                  src={demoUrl(lang, '&reset=1')}
                  title="MyTripPlanner demo"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="clipboard-write"
                />
              )}
            </div>
          </ShotFrame>

          <div className="mx-auto mt-5 flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:justify-between">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-300">
              <Lightbulb size={14} className="text-amber-400" />
              {t('demo.tip')}
            </p>
            <div className="flex gap-2">
              {run > 0 && (
                <button
                  onClick={() => setRun((r) => r + 1)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-[12.5px] font-bold text-white transition hover:bg-white/20"
                >
                  <RotateCcw size={13} />
                  {t('demo.restart')}
                </button>
              )}
              <a
                href={demoUrl(lang)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink-900 shadow-md transition hover:bg-ink-100"
              >
                <Maximize2 size={13} />
                {t('demo.fullscreen')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
