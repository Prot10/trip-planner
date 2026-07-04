import { useState } from 'react'
import { Download, MousePointerClick, Bot, Copy, Check, Apple, AppWindow, Terminal } from 'lucide-react'
import { useLang } from '../i18n.jsx'
import { Kicker, SectionTitle, MagnetLink, GitHubIcon, REPO } from '../components.jsx'

export default function Install() {
  const { t } = useLang()
  const steps = [
    { Icon: Download, t: t('install.stepGet'), d: t('install.stepGetD') },
    { Icon: MousePointerClick, t: t('install.stepLaunch'), d: t('install.stepLaunchD') },
    { Icon: Bot, t: t('install.stepUse'), d: t('install.stepUseD') },
  ]
  const launchers = t('install.launchers')
  const OS_ICONS = [Apple, AppWindow, Terminal]

  return (
    <section id="install" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <div className="flex justify-center"><Kicker>{t('install.kicker')}</Kicker></div>
        <SectionTitle>{t('install.title')}</SectionTitle>
        <p className="rv mt-4 text-[15px] leading-relaxed text-ink-500" style={{ '--rv-d': '100ms' }}>{t('install.sub')}</p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {steps.map(({ Icon, t: title, d }, i) => (
          <div key={title} className="rv relative rounded-2xl border border-ink-200 bg-white p-6 shadow-sm" style={{ '--rv-d': `${i * 110}ms` }}>
            <span className="absolute right-5 top-4 font-display text-4xl font-extrabold text-ink-100">{i + 1}</span>
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-rose-500 text-white shadow-md shadow-brand-500/25">
              <Icon size={19} />
            </span>
            <h3 className="mt-4 font-display text-[15px] font-bold text-ink-900">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{d}</p>
          </div>
        ))}
      </div>

      {/* the three double-click launchers */}
      <div className="rv mt-8 flex flex-wrap items-center justify-center gap-3" style={{ '--rv-d': '150ms' }}>
        {launchers.map(([os, file], i) => {
          const Ic = OS_ICONS[i]
          return (
            <span key={os} className="flex items-center gap-2.5 rounded-2xl border border-ink-200 bg-white px-4 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <Ic size={16} className="text-ink-400" />
              <span className="text-left">
                <span className="block text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{os}</span>
                <code className="block font-mono text-[12px] font-semibold text-ink-800">{file}</code>
              </span>
            </span>
          )
        })}
      </div>

      <div className="rv mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2" style={{ '--rv-d': '200ms' }}>
        <CodeCard label={t('install.or')} lines={['git clone https://github.com/Prot10/trip-planner.git', 'cd trip-planner && npm start']} />
        <CodeCard label={t('install.docker')} lines={['docker compose up -d', '# → http://localhost:5200']} />
      </div>

      <div className="rv mt-12 flex justify-center" style={{ '--rv-d': '250ms' }}>
        <MagnetLink href={REPO}>
          <GitHubIcon size={16} />
          Prot10/trip-planner
        </MagnetLink>
      </div>
    </section>
  )
}

function CodeCard({ label, lines }) {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.filter((l) => !l.startsWith('#')).join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* clipboard denied */ }
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-900 text-left shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-ink-300 transition hover:bg-white/10 hover:text-white">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? t('install.copied') : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12px] leading-relaxed text-emerald-300">
        {lines.map((l) => (
          <div key={l} className={l.startsWith('#') ? 'text-ink-500' : ''}>
            {!l.startsWith('#') && <span className="select-none text-ink-500">$ </span>}
            {l}
          </div>
        ))}
      </pre>
    </div>
  )
}
