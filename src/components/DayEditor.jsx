import { useState } from 'react'
import { X, ArrowUp, ArrowDown } from 'lucide-react'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { DAY_COLORS } from '../lib/utils'
import Modal from './Modal'

export default function DayEditor() {
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
    const data = { title: title.trim() || 'Nuovo giorno', night: night.trim(), color }
    if (existing) updateDay(existing.id, data)
    else addDay(data)
    closeDayEditor()
    toast('Giorno salvato')
  }

  return (
    <Modal onClose={closeDayEditor}>
      <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
        <h3 className="font-display text-lg font-bold text-ink-900">
          {existing ? 'Modifica giorno' : 'Nuovo giorno'}
        </h3>
        <button onClick={closeDayEditor} aria-label="Chiudi" className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 sm:px-6">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Titolo / tratta</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave() }}
            placeholder="es. San Francisco → Yosemite Valley"
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Dove si dorme</span>
          <input
            value={night}
            onChange={(e) => setNight(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave() }}
            placeholder="es. El Portal / Mariposa"
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
          />
        </label>

        {existing && (
          <div className="sm:hidden">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Posizione nel viaggio</span>
            <div className="flex gap-2">
              <button
                onClick={() => moveDay(existing.id, -1)}
                disabled={days.indexOf(existing) === 0}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 disabled:opacity-30"
              >
                <ArrowUp size={15} /> Sposta su
              </button>
              <button
                onClick={() => moveDay(existing.id, 1)}
                disabled={days.indexOf(existing) === days.length - 1}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 disabled:opacity-30"
              >
                <ArrowDown size={15} /> Sposta giù
              </button>
            </div>
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Colore sulla mappa</span>
          <div className="flex flex-wrap gap-2">
            {DAY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Colore ${c}`}
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
          Annulla
        </button>
        <button
          onClick={onSave}
          className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[.97]"
        >
          Salva
        </button>
      </div>
    </Modal>
  )
}
