import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X, PlaneTakeoff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTrip, toast, activeTrip } from '../store'
import { fmtDate } from '../lib/utils'

const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/* Monday-first weekday initials in the current locale (2024-01-01 is a Monday) */
const weekdayInitials = () =>
  Array.from({ length: 7 }, (_, i) =>
    fmtDate(new Date(2024, 0, 1 + i), { weekday: 'narrow' }).toUpperCase())

/* the calendar itself, reusable: desktop popover and mobile sheet share it */
export function CalendarPanel({ onPicked }) {
  const { t } = useTranslation()
  const startDate = useTrip((s) => activeTrip(s).startDate)
  const nDays = useTrip((s) => activeTrip(s).days.length)
  const setStartDate = useTrip((s) => s.setStartDate)

  const start = startDate ? new Date(`${startDate}T12:00:00`) : null
  const end = start ? new Date(start.getTime() + (nDays - 1) * 86400000) : null

  const [view, setView] = useState(() => {
    const base = start ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const pick = (d) => {
    setStartDate(toISO(d))
    toast(t('datePicker.setToast', { date: fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' }) }))
    onPicked?.()
  }

  /* calendar grid for the viewed month, Monday-first */
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1)),
  ]
  const today = new Date()
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const inTrip = (d) => start && end && d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) && d <= end
  const weekdays = weekdayInitials() // useTranslation re-renders us on language change

  return (
    <>
      {/* month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          aria-label={t('datePicker.prevMonth')}
          className="grid size-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100"
        >
          <ChevronLeft size={17} />
        </button>
        <span className="font-display text-sm font-bold capitalize text-ink-900">
          {fmtDate(view, { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          aria-label={t('datePicker.nextMonth')}
          className="grid size-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      {/* weekday header */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {weekdays.map((w, i) => (
          <span key={i} className="py-1 text-[10.5px] font-bold uppercase text-ink-400">{w}</span>
        ))}
      </div>

      {/* days */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />
          const isStart = sameDay(d, start)
          const isEnd = sameDay(d, end)
          const inRange = inTrip(d)
          return (
            <button
              key={i}
              onClick={() => pick(d)}
              className={[
                'relative mx-auto grid size-9 place-items-center text-[13px] font-semibold transition',
                isStart || isEnd
                  ? 'z-10 rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/30'
                  : inRange
                    ? 'rounded-none bg-brand-100 text-brand-700 first:rounded-l-xl'
                    : 'rounded-xl text-ink-700 hover:bg-ink-100',
                sameDay(d, today) && !isStart && !isEnd ? 'ring-1 ring-inset ring-brand-400' : '',
              ].join(' ')}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {/* footer */}
      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
          <CalendarDays size={12} className="text-brand-500" />
          {start && end
            ? t('datePicker.untilN', { count: nDays, date: fmtDate(end) })
            : t('datePicker.pickHint')}
        </span>
        {start && (
          <button
            onClick={() => { setStartDate(''); onPicked?.() }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <X size={11} strokeWidth={3} /> {t('datePicker.remove')}
          </button>
        )}
      </div>
    </>
  )
}

/* Start-date picker: calendar popover that highlights the whole trip span */
export default function DatePicker() {
  const { t } = useTranslation()
  const startDate = useTrip((s) => activeTrip(s).startDate)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const start = startDate ? new Date(`${startDate}T12:00:00`) : null

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl border p-2 text-sm font-semibold shadow-sm transition @[56rem]:px-3 ${
          open ? 'border-brand-400 ring-2 ring-brand-400/20' : 'border-ink-200 hover:border-ink-300'
        } ${start ? 'text-ink-800' : 'text-ink-400'}`}
        aria-label={t('datePicker.pickAria')}
        title={start ? fmtDate(start, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : t('datePicker.startDate')}
      >
        <PlaneTakeoff size={15} className="shrink-0 text-brand-500" />
        <span className="hidden whitespace-nowrap @[56rem]:inline">
          {start
            ? fmtDate(start, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
            : t('datePicker.startDate')}
        </span>
      </button>

      {open && (
        <div className="anim-fade-up absolute right-0 top-[calc(100%+8px)] z-[950] w-[302px] rounded-2xl border border-ink-200 bg-white p-4 shadow-xl">
          <CalendarPanel onPicked={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
