/* The bottom sheet's always-visible header: segmented control for the three
   panes plus a one-line active-day summary (the content you see at peek). */

import { useTranslation } from 'react-i18next'
import { CalendarRange, Sparkles, ListChecks } from 'lucide-react'
import { useTrip, useUI, activeTrip } from '../../store'
import { dayDate, fmtDate } from '../../lib/utils'

const SEGMENTS = [
  ['itinerary', CalendarRange, 'app.tabItinerary'],
  ['suggestions', Sparkles, 'app.tabSuggestions'],
  ['checklist', ListChecks, 'app.tabChecklist'],
]

export default function SheetHeader() {
  const { t } = useTranslation()
  const tab = useUI((s) => s.tab)
  const setTab = useUI((s) => s.setTab)
  const sheet = useUI((s) => s.sheet)
  const setSheet = useUI((s) => s.setSheet)
  const trip = useTrip((s) => activeTrip(s))

  const leftTab = ['checklist', 'suggestions'].includes(tab) ? tab : 'itinerary'

  /* the day worth showing at a glance: first with undone stops, else day 1 */
  const dayIdx = Math.max(0, trip?.days.findIndex((d) => d.items.some((i) => !i.done)) ?? 0)
  const day = trip?.days[dayIdx]
  const date = trip?.startDate ? fmtDate(dayDate(trip.startDate, dayIdx), { weekday: 'short', day: 'numeric', month: 'short' }) : null

  return (
    <div className="px-3 pb-2 pt-1.5">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink-200/60 p-1">
        {SEGMENTS.map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key)
              if (sheet === 'peek') setSheet('half')
            }}
            className={`flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[12.5px] font-bold transition ${
              leftTab === key ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-500'
            }`}
          >
            <Icon size={15} strokeWidth={2.4} />
            {t(label)}
          </button>
        ))}
      </div>

      {day && (
        <button
          onClick={() => setSheet(sheet === 'peek' ? 'half' : sheet)}
          className="mt-2 flex w-full min-w-0 items-center gap-2 px-1 text-left"
        >
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: day.color }} />
          <span className="truncate text-[13px] font-bold text-ink-800">
            {t('common.dayN', { n: dayIdx + 1 })} · {day.title}
          </span>
          <span className="ml-auto shrink-0 text-[11.5px] font-semibold text-ink-400">
            {date ? `${date} · ` : ''}{t('dashboard.stops', { count: day.items.length })}
          </span>
        </button>
      )}
    </div>
  )
}
