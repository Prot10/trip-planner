import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import {
  ChevronDown, Pencil, Trash2, ArrowUp, ArrowDown, Plus, MapPinned, BedDouble, CarFront, CalendarDays,
} from 'lucide-react'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { dayDate, fmtDate, fmtDur, dayDriveMin } from '../lib/utils'
import ItemCard from './ItemCard'

export default function DayCard({ day, index, total }) {
  const startDate = useTrip((s) => activeTrip(s).startDate)
  const removeDay = useTrip((s) => s.removeDay)
  const moveDay = useTrip((s) => s.moveDay)
  const openEditor = useUI((s) => s.openEditor)
  const openDayEditor = useUI((s) => s.openDayEditor)
  const setMapFilter = useUI((s) => s.setMapFilter)
  const setTab = useUI((s) => s.setTab)
  const ask = useUI((s) => s.ask)
  const [open, setOpen] = useState(true)

  const { setNodeRef, isOver } = useDroppable({ id: `drop-${day.id}` })

  const date = dayDate(startDate, index)
  const drive = dayDriveMin(day)
  const nStops = day.items.filter((it) => it.type !== 'drive' && it.type !== 'info').length

  const showOnMap = () => {
    setMapFilter(day.id)
    setTab('map')
  }

  return (
    <section
      className="group/day overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ '--day-c': day.color }}
    >
      {/* header */}
      <header
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer select-none items-center gap-3 border-l-4 px-3 py-3 sm:px-4"
        style={{ borderLeftColor: day.color }}
      >
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-base font-extrabold text-white shadow-sm"
          style={{ background: day.color }}
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[14.5px] font-bold leading-snug text-ink-900">{day.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-500">
            {date && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] text-[10.5px] font-extrabold uppercase tracking-wide"
                style={{
                  background: `color-mix(in srgb, ${day.color} 16%, white)`,
                  color: `color-mix(in srgb, ${day.color} 55%, #1e293b)`,
                }}
              >
                <CalendarDays size={11} strokeWidth={2.5} /> {fmtDate(date)}
              </span>
            )}
            {day.night && (
              <span className="inline-flex items-center gap-1 text-violet-600">
                <BedDouble size={12} /> {day.night}
              </span>
            )}
            {drive > 0 && (
              <span className="inline-flex items-center gap-1 text-sky-600">
                <CarFront size={12} /> {fmtDur(drive)}
              </span>
            )}
            <span>{nStops} tappe</span>
          </div>
        </div>

        {/* tools */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover/day:opacity-100"
        >
          <Tool title="Mostra sulla mappa" onClick={showOnMap}><MapPinned size={15} /></Tool>
          <Tool title="Modifica giorno" onClick={() => openDayEditor(day.id)}><Pencil size={15} /></Tool>
          <div className="hidden items-center gap-0.5 sm:flex">
            <Tool title="Sposta su" disabled={index === 0} onClick={() => moveDay(day.id, -1)}><ArrowUp size={15} /></Tool>
            <Tool title="Sposta giù" disabled={index === total - 1} onClick={() => moveDay(day.id, 1)}><ArrowDown size={15} /></Tool>
          </div>
          <Tool
            title="Elimina giorno"
            danger
            onClick={() =>
              ask(`Eliminare il giorno "${day.title}" e tutte le sue attività?`, () => {
                removeDay(day.id)
                toast('Giorno eliminato')
              })
            }
          >
            <Trash2 size={15} />
          </Tool>
        </div>

        <ChevronDown
          size={17}
          className={`shrink-0 text-ink-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </header>

      {/* body */}
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div
            ref={setNodeRef}
            className={`px-3 pb-3 sm:px-4 ${isOver ? 'bg-brand-50/40' : ''}`}
          >
            <SortableContext items={day.items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
              <ol>
                {day.items.map((it, j) => (
                  <ItemCard key={it.id} item={it} day={day} isLast={j === day.items.length - 1} />
                ))}
              </ol>
            </SortableContext>

            {day.items.length === 0 && (
              <p className="py-3 text-center text-xs italic text-ink-400">
                Giornata vuota — trascina qui un’attività o aggiungine una
              </p>
            )}

            <button
              onClick={() => openEditor(day.id, null)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-ink-300 py-2 text-xs font-semibold text-ink-400 transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600"
            >
              <Plus size={14} strokeWidth={2.6} />
              Aggiungi attività
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Tool({ title, onClick, disabled, danger, children }) {
  return (
    <button
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded-lg transition disabled:opacity-25 ${
        danger ? 'text-ink-400 hover:bg-rose-50 hover:text-rose-600' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700'
      }`}
    >
      {children}
    </button>
  )
}
