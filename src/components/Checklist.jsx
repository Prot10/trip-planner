import { useState } from 'react'
import { Check, Trash2, Plus, ExternalLink } from 'lucide-react'
import { useTrip, toast, activeTrip } from '../store'

export default function Checklist() {
  const checklist = useTrip((s) => activeTrip(s).checklist)
  const addCheck = useTrip((s) => s.addCheck)
  const toggleCheck = useTrip((s) => s.toggleCheck)
  const removeCheck = useTrip((s) => s.removeCheck)
  const [text, setText] = useState('')

  const done = checklist.filter((c) => c.done).length
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0

  const onAdd = () => {
    const t = text.trim()
    if (!t) return
    addCheck(t)
    setText('')
    toast('Aggiunto alla checklist')
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {/* progress */}
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-sm font-bold text-ink-900">Da fare prima di partire</h3>
          <span className="text-xs font-semibold text-ink-500">
            {done}/{checklist.length} · {pct}%
          </span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* add */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAdd() }}
          placeholder="Aggiungi una cosa da fare…"
          className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
        />
        <button
          onClick={onAdd}
          aria-label="Aggiungi"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.6} />
        </button>
      </div>

      {/* items */}
      <ul className="flex flex-col gap-2">
        {checklist.map((c) => (
          <li
            key={c.id}
            className={`group flex items-start gap-3 rounded-2xl border border-ink-200 bg-white px-3.5 py-3 shadow-sm transition ${
              c.done ? 'opacity-55' : ''
            }`}
          >
            <button
              onClick={() => toggleCheck(c.id)}
              aria-label={c.done ? 'Segna da fare' : 'Segna come fatto'}
              className={`mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-lg border-[1.5px] transition ${
                c.done
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-ink-300 bg-white text-transparent hover:border-emerald-500'
              }`}
            >
              <Check size={13} strokeWidth={3.5} />
            </button>
            <p className={`min-w-0 flex-1 text-[13.5px] leading-snug text-ink-800 ${c.done ? 'line-through' : ''}`}>
              {c.text}
              {c.link && (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 align-middle text-xs font-semibold text-brand-600 hover:underline"
                >
                  <ExternalLink size={11} /> apri
                </a>
              )}
            </p>
            <button
              onClick={() => removeCheck(c.id)}
              aria-label="Elimina"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-300 opacity-100 transition hover:bg-rose-50 hover:text-rose-600 lg:opacity-0 lg:group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
