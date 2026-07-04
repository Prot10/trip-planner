import { useLang } from '../i18n.jsx'
import { Kicker, SectionTitle, BrowserFrame, shot } from '../components.jsx'
import { useTilt } from '../fx'

const SHOTS = ['step-1.png', 'step-2.png', 'step-3.png', 'step-4.png']

export default function Steps() {
  const { t } = useLang()
  const steps = t('steps.list')
  return (
    <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
      <div className="max-w-2xl">
        <Kicker>{t('steps.kicker')}</Kicker>
        <SectionTitle>{t('steps.title')}</SectionTitle>
        <p className="rv mt-3 text-[15px] text-ink-500" style={{ '--rv-d': '120ms' }}>{t('steps.sub')}</p>
      </div>

      <div className="mt-14 flex flex-col gap-16 sm:gap-24">
        {steps.map((s, i) => (
          <Step key={s.n} s={s} img={SHOTS[i]} flip={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}

function Step({ s, img, flip }) {
  const tilt = useTilt(5)
  return (
    <div className={`grid items-center gap-8 lg:grid-cols-12 ${flip ? '' : ''}`}>
      <div className={`rv lg:col-span-5 ${flip ? 'lg:order-2 lg:pl-4' : 'lg:pr-4'}`}>
        <div className="flex items-baseline gap-4">
          <span className="grad-text font-display text-5xl font-extrabold tracking-tight">{s.n}</span>
          <h3 className="font-display text-2xl font-extrabold text-ink-900">{s.t}</h3>
        </div>
        <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-500">{s.d}</p>
      </div>
      <div className={`rv-scale lg:col-span-7 ${flip ? 'lg:order-1' : ''}`} style={{ '--rv-d': '120ms' }}>
        <div ref={tilt} className="tilt tilt-glare relative rounded-2xl">
          <BrowserFrame url="localhost:5200">
            <img src={shot(img)} alt={s.t} loading="lazy" width="2200" height="1330" className="block w-full" />
          </BrowserFrame>
        </div>
      </div>
    </div>
  )
}
