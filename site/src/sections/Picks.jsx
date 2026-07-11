import { useEffect, useState } from 'react'
import { BedDouble, UtensilsCrossed } from 'lucide-react'
import { useLang } from '../i18n.jsx'
import { Kicker, SectionTitle, ShotFrame } from '../components.jsx'
import { useTilt } from '../fx'
import PickScene from '../mock/PickScenes.jsx'

/* each tab replays a real proposal turn as a live UI mock: the Booking /
   Google Maps shortlist appears, the top pick gets chosen, the transcript
   collapses into the pick record. Autoplay leaves room for the whole loop. */
const KINDS = ['hotel', 'restaurant']
const ICONS = [BedDouble, UtensilsCrossed]
const AUTOPLAY_MS = 15500

/* the interactive proposal widgets: real hotels (Booking) and real
   restaurants (Google Maps). Desktop keeps the scene beside the tabs;
   mobile puts the scene first and the tabs as a compact row underneath. */
export default function Picks() {
  const { lang, t } = useLang()
  const cards = t('picks.cards')
  const [active, setActive] = useState(0)
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const tiltMobile = useTilt(4)
  const tiltDesktop = useTilt(4)

  const pick = (i) => {
    setActive(i)
    setTick((n) => n + 1)
  }

  /* progress is plain React state (not an imperative ref mutation) so that
     switching tabs reliably resets the OLD tab's bar back to 0 — a ref-based
     mutation left the previous tab's bar stuck at whatever width it last
     had, since React never saw its "0%" style prop actually change. */
  useEffect(() => {
    setProgress(0)
    if (paused) return
    let raf
    const start = performance.now()
    const step = (now) => {
      const p = Math.min(1, (now - start) / AUTOPLAY_MS)
      setProgress(p)
      if (p >= 1) { setActive((a) => (a + 1) % cards.length); return }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tick, paused, cards.length])

  return (
    <section id="picks" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
      <div className="max-w-2xl">
        <Kicker>{t('picks.kicker')}</Kicker>
        <SectionTitle>{t('picks.title')}</SectionTitle>
        <p className="rv mt-3 text-[15px] text-ink-500" style={{ '--rv-d': '120ms' }}>{t('picks.sub')}</p>
      </div>

      <div
        className="rv-scale mt-12"
        style={{ '--rv-d': '120ms' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* the scene stack, shared by both layouts */}
        <Shot lang={lang} active={active} tiltRef={tiltMobile} className="lg:hidden" />

        <div className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="hidden lg:col-span-5 lg:block">
            <Shot lang={lang} active={active} tiltRef={tiltDesktop} />
          </div>

          <div className="mt-6 lg:col-span-7 lg:order-first lg:mt-0">
            <div className="flex gap-2 lg:flex-col lg:gap-3">
              {cards.map((c, i) => {
                const Icon = ICONS[i]
                const isActive = i === active
                return (
                  <button
                    key={c.t}
                    onClick={() => pick(i)}
                    aria-pressed={isActive}
                    className={`group flex-1 rounded-2xl border p-4 text-left transition lg:flex-none lg:p-5 ${
                      isActive ? 'border-brand-300 bg-brand-50/50 shadow-sm' : 'border-ink-200 bg-white hover:border-ink-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-xl transition ${isActive ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500'}`}>
                        <Icon size={16} />
                      </span>
                      <span className={`font-display text-[14.5px] font-extrabold sm:text-[15px] ${isActive ? 'text-ink-900' : 'text-ink-600'}`}>
                        {c.t}
                      </span>
                    </span>

                    {/* progress bar: only the active tab counts down */}
                    <span className="mt-3 block h-[3px] w-full overflow-hidden rounded-full bg-ink-100">
                      <span
                        className="block h-full rounded-full bg-brand-500"
                        style={{ width: `${(isActive ? progress : 0) * 100}%` }}
                      />
                    </span>

                    {/* expanded content: desktop only (mobile shows the
                        active tab's description below the pill row instead),
                        and only for the active tab */}
                    <span className={`mt-3 hidden ${isActive ? 'lg:block' : 'lg:hidden'}`}>
                      <span className="block text-[13.5px] leading-relaxed text-ink-500">{c.d}</span>
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {c.chips.map((chip) => (
                          <span key={chip} className="rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600">
                            {chip}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* mobile: the active tab's description lives here, under the pill row */}
            <div className="mt-4 lg:hidden">
              <p className="text-[13.5px] leading-relaxed text-ink-500">{cards[active].d}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cards[active].chips.map((chip) => (
                  <span key={chip} className="rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* the cross-fading scene stack shared by both layouts: both scenes stay
   mounted in the same grid cell, the active one is visible */
function Shot({ lang, active, tiltRef, className = '' }) {
  return (
    <div ref={tiltRef} className={`tilt tilt-glare relative rounded-2xl ${className}`}>
      <ShotFrame>
        <div className="grid bg-ink-100">
          {KINDS.map((kind, i) => (
            <div
              key={kind}
              aria-hidden={i !== active}
              className={`col-start-1 row-start-1 transition-opacity duration-500 ${i === active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              <PickScene kind={kind} lang={lang} active={i === active} />
            </div>
          ))}
        </div>
      </ShotFrame>
    </div>
  )
}
