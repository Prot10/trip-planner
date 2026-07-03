import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ArrowUp, ArrowDown } from 'lucide-react'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { DAY_COLORS } from '../lib/utils'
import Modal from './Modal'

export default function DayEditor() {
  const { t } = useTranslation()
  const dayEditor = useUI((s) => s.dayEditor)
  const closeDayEditor = useUI((s) => s.closeDayEditor)
  const days = useTrip((s) => activeTrip(s).days)
  const addDay = useTrip((s) => s.addDay)
  const updateDay = useTrip((s) => s.updateDay)
  const moveDay = useTrip((s) => s.moveDay)

  const existing = dayEditor.dayId ? days.find((d) => d.id === dayEditor.dayId) : null
  const [title, setTitle] = useState(existing?.title ?? '')
  const [night, setNight] = useState(existing?.night ?? '')
  const [color, setColor] = useState(existing?.color ?? DAY_COLORS[days.length % DAY_COLORS.length])

  const onSave = () => {
    const data = { title: title.trim() || t('day.newDay'), night: night.trim(), color }
    if (existing) updateDay(existing.id, data)
    else addDay(data)
    closeDayEditor()
    toast(t('day.saved'))
  }

  return (
    <Modal onClose={closeDayEditor}>
      <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
        <h3 className="font-display text-lg font-bold text-ink-900">
          {existing ? t('day.editDay') : t('day.newDay')}
        </h3>
        <button onClick={closeDayEditor} aria-label={t('common.close')} className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 sm:px-6">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{t('day.titleLabel')}</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave() }}
            placeholder={t('day.titlePlaceholder')}
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{t('day.nightLabel')}</span>
          <input
            value={night}
            onChange={(e) => setNight(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave() }}
            placeholder={t('day.nightPlaceholder')}
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          />
        </label>

        {existing && (
          <div className="sm:hidden">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{t('day.positionLabel')}</span>
            <div className="flex gap-2">
              <button
                onClick={() => moveDay(existing.id, -1)}
                disabled={days.indexOf(existing) === 0}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 disabled:opacity-30"
              >
                <ArrowUp size={15} /> {t('day.moveUp')}
              </button>
              <button
                onClick={() => moveDay(existing.id, 1)}
                disabled={days.indexOf(existing) === days.length - 1}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 disabled:opacity-30"
              >
                <ArrowDown size={15} /> {t('day.moveDown')}
              </button>
            </div>
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{t('day.colorLabel')}</span>
          <div className="flex flex-wrap gap-2">
            {DAY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={t('day.colorAria', { color: c })}
                className={`size-8 rounded-full transition hover:scale-110 ${
                  color === c ? 'ring-2 ring-ink-800 ring-offset-2' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 border-t border-ink-100 px-5 py-4 sm:px-6">
        <button
          onClick={closeDayEditor}
          className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={onSave}
          className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[.97]"
        >
          {t('common.save')}
        </button>
      </div>
    </Modal>
  )
}
