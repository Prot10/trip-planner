import { useLang } from '../i18n.jsx'
import { Kicker, SectionTitle, BrowserFrame, shot } from '../components.jsx'
import { useTilt } from '../fx'

/* the interactive proposal widgets: real hotels (Booking) and real
   restaurants (Google Maps), picked with one tap in the chat */
export default function Picks() {
  const { t } = useLang()
  const cards = t('picks.cards')
  return (
    <section id="picks" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
      <div className="max-w-2xl">
        <Kicker>{t('picks.kicker')}</Kicker>
        <SectionTitle>{t('picks.title')}</SectionTitle>
        <p className="rv mt-3 text-[15px] text-ink-500" style={{ '--rv-d': '120ms' }}>{t('picks.sub')}</p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-8">
        {cards.map((c, i) => (
          <Card key={c.t} c={c} img={i === 0 ? 'picks-hotels.png' : 'picks-restaurants.png'} />
        ))}
      </div>
    </section>
  )
}

function Card({ c, img }) {
  const tilt = useTilt(4)
  return (
    <div className="rv-scale flex flex-col gap-5" style={{ '--rv-d': '120ms' }}>
      <div ref={tilt} className="tilt tilt-glare relative rounded-2xl">
        <BrowserFrame url="localhost:5200">
          <img src={shot(img)} alt={c.t} loading="lazy" width="2200" height="1375" className="block w-full" />
        </BrowserFrame>
      </div>
      <div>
        <h3 className="font-display text-xl font-extrabold text-ink-900">{c.t}</h3>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-ink-500">{c.d}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.chips.map((chip) => (
            <span key={chip} className="rounded-lg bg-ink-100 px-2.5 py-1 text-[11.5px] font-bold text-ink-600">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
