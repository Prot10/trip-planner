import { Map, Wallet, GripVertical, Image, Sparkles, FolderHeart, Share2, MonitorSmartphone } from 'lucide-react'
import { useLang } from '../i18n.jsx'
import { Kicker, SectionTitle } from '../components.jsx'
import { useGlow } from '../fx'

const ICONS = [Map, Wallet, GripVertical, Image, Sparkles, FolderHeart, Share2, MonitorSmartphone]
const TINTS = [
  'bg-sky-100 text-sky-600', 'bg-emerald-100 text-emerald-600', 'bg-brand-100 text-brand-600',
  'bg-rose-100 text-rose-500', 'bg-violet-100 text-violet-600', 'bg-amber-100 text-amber-600',
  'bg-cyan-100 text-cyan-600', 'bg-fuchsia-100 text-fuchsia-600',
]

export default function Features() {
  const { t } = useLang()
  const list = t('features.list')
  return (
    <section id="features" className="relative scroll-mt-16 border-t border-ink-100 bg-ink-50/60 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <Kicker>{t('features.kicker')}</Kicker>
          <SectionTitle>{t('features.title')}</SectionTitle>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((f, i) => (
            <Card key={f.t} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Card({ f, i }) {
  const glow = useGlow()
  const Icon = ICONS[i]
  return (
    <div
      ref={glow}
      className="glow-card rv group rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ '--rv-d': `${(i % 4) * 80}ms` }}
    >
      <span className={`grid size-11 place-items-center rounded-xl ${TINTS[i]} shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}>
        <Icon size={19} />
      </span>
      <h3 className="mt-4 font-display text-[15px] font-bold text-ink-900">{f.t}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{f.d}</p>
    </div>
  )
}
