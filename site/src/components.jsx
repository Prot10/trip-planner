/* Shared bits: section scaffolding, browser frame, buttons, GitHub icon */

import { useMagnet } from './fx'

export const REPO = 'https://github.com/Prot10/MyTripPlanner'
export const PAYPAL = 'https://paypal.me/andreaprotani99'
export const COFFEE = 'https://buymeacoffee.com/prot10'
export const demoUrl = (lang, extra = '') =>
  `${import.meta.env.BASE_URL}demo/?lang=${lang}${extra}`
export const shot = (name) => `${import.meta.env.BASE_URL}shots/${name}`

export function Kicker({ children }) {
  return (
    <p className="rv mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-[12px] font-bold uppercase tracking-widest text-brand-600">
      <span className="size-1.5 rounded-full bg-brand-500" />
      {children}
    </p>
  )
}

export function SectionTitle({ children }) {
  return <h2 className="rv font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl lg:text-[2.6rem] lg:leading-[1.1]">{children}</h2>
}

/* primary CTA: magnetic + sheen */
export function MagnetLink({ href, onClick, children, variant = 'primary', className = '' }) {
  const ref = useMagnet(0.18)
  const base = 'sheen inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 font-display text-[15px] font-bold transition-shadow'
  const look =
    variant === 'primary'
      ? 'bg-ink-900 text-white shadow-lg shadow-ink-900/25 hover:shadow-xl hover:shadow-ink-900/30'
      : 'border border-ink-200 bg-white text-ink-800 shadow-sm hover:border-ink-300 hover:shadow-md'
  return (
    <a ref={ref} href={href} onClick={onClick} className={`${base} ${look} ${className}`}>
      {children}
    </a>
  )
}

/* fake browser window around screenshots / the live demo */
export function BrowserFrame({ children, url = 'localhost:5200', className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl shadow-ink-900/15 ${className}`}>
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-[11px] font-semibold text-ink-400 ring-1 ring-ink-200">
          <LockIcon />
          <span className="truncate">{url}</span>
        </span>
        <span className="w-12" />
      </div>
      {children}
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="9" height="11" viewBox="0 0 10 12" fill="none" className="shrink-0 text-ink-300">
      <rect x="1" y="5" width="8" height="6" rx="1.5" fill="currentColor" />
      <path d="M3 5V3.5a2 2 0 1 1 4 0V5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function GitHubIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

export function HeartIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21s-7.6-4.7-10.4-9.3C-.2 8.1 1.2 4 5 3.1c2.2-.5 4.3.5 5.5 2.4C11.7 3.6 13.8 2.6 16 3.1c3.8.9 5.2 5 3.4 8.6C19.6 16.3 12 21 12 21z" />
    </svg>
  )
}

export function CoffeeIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M7.5 2.5c-.6.9-.6 1.6 0 2.5M11.5 2.5c-.6.9-.6 1.6 0 2.5" />
    </svg>
  )
}

export function PayPalIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.2 20.4 8.9 16H6.3c-.5 0-.9-.4-.8-1L7.9 3.9C8 3.4 8.4 3 9 3h5.7c2.6 0 4.5 1.7 4.2 4.2-.4 3.2-2.6 5-5.7 5H10l-.9 5.9c-.1.4-.5.8-1 .8H8.2Z" />
      <path d="M14.9 8.1c-.3 2-1.9 3.1-3.9 3.1H9.4l.9-5.7h2.3c1.7 0 2.6 1 2.3 2.6Z" fill="#fff" opacity=".55" />
    </svg>
  )
}

/* the app's map-pin logo, reused everywhere */
export function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="url(#lg)" />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#fb923c" />
          <stop offset="1" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
      <path d="M16 7c-3.9 0-7 3.1-7 7 0 5.2 7 11 7 11s7-5.8 7-11c0-3.9-3.1-7-7-7z" fill="#fff" />
      <circle cx="16" cy="14" r="2.6" fill="#f97316" />
    </svg>
  )
}
