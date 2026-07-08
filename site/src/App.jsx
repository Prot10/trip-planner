import { useEffect, useState } from 'react'
import { useLang } from './i18n.jsx'
import { useReveal, useScrollProgress } from './fx'
import { Logo, GitHubIcon, REPO, demoUrl } from './components.jsx'
import Hero from './sections/Hero.jsx'
import Marquee from './sections/Marquee.jsx'
import Steps from './sections/Steps.jsx'
import Demo from './sections/Demo.jsx'
import Ulisse from './sections/Ulisse.jsx'
import Picks from './sections/Picks.jsx'
import Features from './sections/Features.jsx'
import Install from './sections/Install.jsx'

export default function App() {
  const root = useReveal()
  return (
    <div ref={root} className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Steps />
        <Demo />
        <Ulisse />
        <Picks />
        <Features />
        <Install />
      </main>
      <Footer />
    </div>
  )
}

function Nav() {
  const { lang, setLang, t } = useLang()
  const bar = useScrollProgress()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(scrollY > 24)
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])

  const links = [
    ['#how', t('nav.how')],
    ['#demo', t('nav.demo')],
    ['#ulisse', t('nav.ulisse')],
    ['#features', t('nav.features')],
    ['#install', t('nav.install')],
  ]

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-ink-200/70 bg-white/80 backdrop-blur-xl' : 'bg-transparent'}`}>
      <div ref={bar} className="progress-bar absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-rose-500 to-violet-500" />
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 font-display text-[15px] font-extrabold text-ink-900">
          <Logo size={30} />
          MyTripPlanner
        </a>
        <div className="mx-auto hidden items-center gap-1 md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-ink-500 transition hover:bg-ink-100 hover:text-ink-900">
              {label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="flex rounded-xl border border-ink-200 bg-white p-0.5 text-[11.5px] font-bold">
            {['it', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-[9px] px-2 py-1 uppercase transition ${lang === l ? 'bg-ink-900 text-white' : 'text-ink-400 hover:text-ink-700'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-1.5 text-[13px] font-bold text-white shadow-md shadow-ink-900/20 transition hover:bg-ink-700"
          >
            <GitHubIcon size={15} />
            <span className="hidden sm:inline">{t('nav.github')}</span>
          </a>
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  const { lang, t } = useLang()
  return (
    <footer className="border-t border-ink-200 bg-ink-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <a href="#top" className="flex items-center gap-2.5 font-display text-[15px] font-extrabold text-ink-900">
            <Logo size={28} />
            MyTripPlanner
          </a>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-500">{t('footer.tag')}</p>
          <p className="mt-3 text-[11.5px] font-semibold text-ink-400">{t('footer.license')}</p>
        </div>
        <div className="flex flex-col items-center gap-2 text-[13px] font-semibold text-ink-500 sm:items-end">
          <a href={REPO} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-ink-900">
            <GitHubIcon size={14} /> {t('footer.repo')}
          </a>
          <a href={`${REPO}/issues`} target="_blank" rel="noreferrer" className="transition hover:text-ink-900">
            {t('footer.issues')}
          </a>
          <a href={demoUrl(lang)} target="_blank" rel="noreferrer" className="transition hover:text-ink-900">
            {t('footer.demoLink')}
          </a>
        </div>
      </div>
    </footer>
  )
}
