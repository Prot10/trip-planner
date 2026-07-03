import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Clock, Timer, Star, Check, GripVertical, Pencil, Trash2, ExternalLink, Navigation, MapPinned,
} from 'lucide-react'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { fmtDur, fmtMoney, gmapsUrl } from '../lib/utils'
import { TYPE_META, itemMeta } from './typeMeta'
import { ItemThumb } from './ItemImage'

export default function ItemCard({ item, day, isLast, stopNumber }) {
  const { t } = useTranslation()
  const currency = useTrip((s) => activeTrip(s)?.currency ?? 'USD')
  const toggleDone = useTrip((s) => s.toggleDone)
  const removeItem = useTrip((s) => s.removeItem)
  const openEditor = useUI((s) => s.openEditor)
  const openDetail = useUI((s) => s.openDetail)
  const setFlyTo = useUI((s) => s.setFlyTo)
  const setTab = useUI((s) => s.setTab)
  const ask = useUI((s) => s.ask)
  const focusItemId = useUI((s) => s.focusItemId)
  const setFocusItem = useUI((s) => s.setFocusItem)
  const ref = useRef(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const meta = itemMeta(item)

  /* scroll + flash when a map pin selects this item */
  useEffect(() => {
    if (focusItemId !== item.id || !ref.current) return
    const el = ref.current
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.style.setProperty('--flash-c', day.color)
    el.classList.remove('flash-me')
    requestAnimationFrame(() => el.classList.add('flash-me'))
    const t = setTimeout(() => { el.classList.remove('flash-me'); setFocusItem(null, null) }, 1700)
    return () => clearTimeout(t)
  }, [focusItemId, item.id, day.color, setFocusItem])

  const showOnMap = () => {
    setFlyTo({ lat: item.lat, lng: item.lng, itemId: item.id })
    if (window.innerWidth < 1024) setTab('map')
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/item relative flex gap-2.5 sm:gap-3 ${isDragging ? 'z-10 opacity-40' : ''}`}
    >
      {/* timeline rail */}
      <div className="flex w-8 shrink-0 flex-col items-center pt-1.5">
        <button
          onClick={() => toggleDone(day.id, item.id)}
          title={item.done ? t('item.markTodo') : t('item.markDone')}
          style={stopNumber && !item.done ? { background: day.color, borderColor: day.color } : undefined}
          className={`grid size-8 shrink-0 place-items-center rounded-full ring-1 transition hover:scale-110 ${
            item.done
              ? 'bg-emerald-100 text-emerald-600 ring-emerald-300'
              : stopNumber
                ? 'font-display text-[13px] font-extrabold text-white ring-transparent shadow-sm'
                : meta.dot
          }`}
        >
          {item.done
            ? <Check size={15} strokeWidth={3} />
            : stopNumber ?? <meta.Icon size={15} strokeWidth={2.2} />}
        </button>
        {!isLast && <div className="mt-1 w-0.5 flex-1 rounded bg-ink-200" />}
      </div>

      {/* card */}
      <div
        ref={ref}
        onClick={() => openDetail(day.id, item.id)}
        className={`mb-2 min-w-0 flex-1 cursor-pointer rounded-xl border bg-white p-2.5 shadow-sm transition sm:p-3 ${
          item.done ? 'opacity-55' : ''
        } ${
          item.type === 'info'
            ? 'border-teal-200 bg-teal-50/50'
            : item.type === 'hotel'
              ? 'border-violet-200 bg-violet-50/40'
              : item.type === 'drive'
                ? 'border-dashed border-ink-300 bg-ink-50/60'
                : 'border-ink-200 hover:border-ink-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-start gap-2">
          {/* drag handle */}
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title={t('item.dragReorder')}
            aria-label={t('item.dragReorder')}
            className="-ml-1 mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-ink-300 transition hover:bg-ink-100 hover:text-ink-500 active:cursor-grabbing"
          >
            <GripVertical size={15} />
          </button>

          <div className="min-w-0 flex-1">
            {/* chips */}
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              {item.time && (
                <Chip className="bg-ink-100 text-ink-700 ring-ink-500/15">
                  <Clock size={11} /> {item.time}
                </Chip>
              )}
              <Chip className={meta.chip}>
                <meta.Icon size={11} /> {t(meta.labelKey)}
              </Chip>
              {item.dur > 0 && (
                <Chip className="bg-blue-50 text-blue-700 ring-blue-600/20">
                  <Timer size={11} /> {fmtDur(item.dur)}
                </Chip>
              )}
              {item.price > 0 && (
                <Chip className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                  {fmtMoney(item.price, currency)}{item.type === 'hotel' ? t('item.perNight') : ''}
                </Chip>
              )}
              {item.must && (
                <Chip className="bg-amber-50 text-amber-700 ring-amber-500/30">
                  <Star size={11} fill="currentColor" /> {t('item.mustSee')}
                </Chip>
              )}
            </div>

            <h4 className={`text-[13.5px] font-semibold leading-snug text-ink-900 ${item.done ? 'line-through' : ''}`}>
              {item.title}
            </h4>
            {item.notes && (
              <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-ink-500">{item.notes}</p>
            )}

            {(item.lat != null || item.links.length > 0) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {item.lat != null && (
                  <>
                    <button
                      onClick={showOnMap}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20 transition hover:bg-emerald-100"
                    >
                      <MapPinned size={11.5} /> {t('item.map')}
                    </button>
                    <a
                      href={gmapsUrl(item.lat, item.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-600/20 transition hover:bg-blue-100"
                    >
                      <Navigation size={11.5} /> Google Maps
                    </a>
                  </>
                )}
                {item.links.map((l, i) => (
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
              </div>
            )}
          </div>

          <ItemThumb item={item} />

          {/* hover actions */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 flex-col gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover/item:opacity-100"
          >
            <button
              title={t('common.edit')}
              onClick={() => openEditor(day.id, item.id)}
              className="grid size-6 place-items-center rounded-md text-ink-300 transition hover:bg-ink-100 hover:text-ink-600"
            >
              <Pencil size={13} />
            </button>
            <button
              title={t('common.delete')}
              onClick={() =>
                ask(t('item.confirmDelete', { title: item.title }), () => {
                  removeItem(day.id, item.id)
                  toast(t('item.deleted'))
                })
              }
              className="grid size-6 place-items-center rounded-md text-ink-300 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}

/* light clone rendered inside DragOverlay */
export function ItemCardGhost({ item, color }) {
  const meta = itemMeta(item)
  return (
    <div
      className="flex max-w-md items-center gap-2.5 rounded-xl border-2 bg-white p-3 shadow-xl"
      style={{ borderColor: color }}
    >
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ring-1 ${meta.dot}`}>
        <meta.Icon size={15} />
      </span>
      <div className="min-w-0">
        {item.time && <div className="text-[11px] font-semibold text-ink-400">{item.time}</div>}
        <div className="truncate text-sm font-semibold text-ink-900">{item.title}</div>
      </div>
    </div>
  )
}

function Chip({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${className}`}>
      {children}
    </span>
  )
}
