import { Star, Timer, Route, ExternalLink, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { bestInsertion } from '../lib/geo'
import { fmtDur } from '../lib/utils'
import { CATS, classify } from '../lib/categories'
import { SuggestionImage } from './ItemImage'
import i18n from '../i18n'

export default function Suggestions() {
  const { t } = useTranslation()
  const trip = useTrip((s) => activeTrip(s))
  const insertItemAt = useTrip((s) => s.insertItemAt)
  const removeSuggestionItem = useTrip((s) => s.removeSuggestionItem)
  const setFocusItem = useUI((s) => s.setFocusItem)
  const setTab = useUI((s) => s.setTab)

  /* sugId -> { dayIndex } for the ones already in the trip */
  const active = new Map()
  trip.days.forEach((d, di) =>
    d.items.forEach((it) => { if (it.sug) active.set(it.sug, { dayIndex: di, itemId: it.id, color: d.color }) }))

  const onToggle = (sug) => {
    if (active.has(sug.id)) {
      removeSuggestionItem(sug.id)
      toast(i18n.t('suggestions.removedToast'))
      return
    }
    const spot = bestInsertion(trip, sug)
    if (!spot) return
    const dayIndex = trip.days.findIndex((d) => d.id === spot.dayId)
    insertItemAt(spot.dayId, spot.index, {
      type: sug.type,
      title: sug.title,
      time: '',
      dur: sug.dur,
      notes: sug.notes,
      links: sug.links ?? [],
      must: !!sug.must,
      done: false,
      lat: sug.lat,
      lng: sug.lng,
      img: '',
      sug: sug.id,
      category: sug.category ?? classify(sug.type, sug.title),
    })
    toast(i18n.t('toasts.addedOptimal', { n: dayIndex + 1 }))
  }

  const goToItem = (sugId) => {
    const info = active.get(sugId)
    if (!info) return
    setTab('itinerary')
    setFocusItem(info.itemId, info.color)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {trip.suggestions.length === 0 && (
        <div className="rounded-2xl border border-ink-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-ink-700">{t('suggestions.emptyTitle')}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-400">
            {t('suggestions.emptyBody')}
          </p>
        </div>
      )}
      {trip.suggestions.length > 0 && (
      <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
          <Sparkles size={17} />
        </div>
        <p className="text-[13px] leading-relaxed text-ink-700">
          {t('suggestions.introBefore')}
          <b> {t('suggestions.introBold')}</b>
          {t('suggestions.introAfter')}
        </p>
      </div>
      )}

      <ul className="flex flex-col gap-3">
        {trip.suggestions.map((sug) => {
          const isOn = active.has(sug.id)
          const cat = CATS[sug.category] ?? CATS[classify(sug.type, sug.title)]
          const preview = isOn ? null : bestInsertion(trip, sug)
          const dayNumber = isOn
            ? active.get(sug.id).dayIndex + 1
            : preview ? trip.days.findIndex((d) => d.id === preview.dayId) + 1 : null

          return (
            <li
              key={sug.id}
              className={`rounded-2xl border bg-white p-3 shadow-sm transition sm:p-3.5 ${
                isOn ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-ink-200 hover:border-ink-300'
              }`}
            >
              <div className="flex gap-3">
                <SuggestionImage item={sug} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[13.5px] font-bold leading-snug text-ink-900">{sug.title}</h4>
                    <Switch on={isOn} onClick={() => onToggle(sug)} label={isOn ? t('suggestions.removeFromTrip') : t('common.addToTrip')} />
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Chip className="text-white ring-0" style={{ background: cat.color }}>
                      <cat.Icon size={11} /> {t(cat.labelKey)}
                    </Chip>
                    <Chip className="bg-blue-50 text-blue-700 ring-blue-600/20"><Timer size={11} /> {fmtDur(sug.dur)}</Chip>
                    {sug.must && (
                      <Chip className="bg-amber-50 text-amber-700 ring-amber-500/30">
                        <Star size={11} fill="currentColor" /> {t('suggestions.recommended')}
                      </Chip>
                    )}
                    {dayNumber && (
                      <Chip className="bg-ink-100 text-ink-700 ring-ink-500/15">
                        <Route size={11} /> {t('common.dayN', { n: dayNumber })}{!isOn && preview ? ` · +${preview.addedKm} km` : ''}
                      </Chip>
                    )}
                  </div>

                  <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{sug.notes}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(sug.links ?? []).map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-ink-100 px-2 py-1 text-[11px] font-semibold text-ink-600 ring-1 ring-ink-500/10 transition hover:bg-ink-200"
                      >
                        <ExternalLink size={11.5} /> {l.label}
                      </a>
                    ))}
                    {isOn && (
                      <button
                        onClick={() => goToItem(sug.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20 transition hover:bg-emerald-100"
                      >
                        <Route size={11.5} /> {t('common.seeInItinerary')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Switch({ on, onClick, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        on ? 'bg-emerald-500' : 'bg-ink-200 hover:bg-ink-300'
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] duration-200 ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function Chip({ className, style, children }) {
  return (
    <span style={style} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${className}`}>
      {children}
    </span>
  )
}
