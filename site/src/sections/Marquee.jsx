import { Sparkles } from 'lucide-react'
import { useLang } from '../i18n.jsx'

/* endless feature ticker between the hero and the steps */
export default function Marquee() {
  const { t } = useLang()
  const items = t('marquee.items')
  const row = (key) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((label, i) => (
        <span key={i} className="mx-2 flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-[13px] font-semibold text-ink-500">
          <Sparkles size={13} className="text-brand-400" />
          {label}
        </span>
      ))}
    </div>
  )
  return (
    <section className="marquee relative overflow-hidden border-y border-ink-100 bg-ink-50/60 py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="marquee-track">{[0, 1].map(row)}</div>
    </section>
  )
}
