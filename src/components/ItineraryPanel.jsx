import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useTrip, useUI, activeTrip } from '../store'
import DayCard from './DayCard'
import { ItemCardGhost } from './ItemCard'

export default function ItineraryPanel() {
  const days = useTrip((s) => activeTrip(s).days)
  const relocateItem = useTrip((s) => s.relocateItem)
  const openDayEditor = useUI((s) => s.openDayEditor)
  const [activeItem, setActiveItem] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const findDayOf = (itemId) => days.find((d) => d.items.some((it) => it.id === itemId))

  const resolveTarget = (overId) => {
    const s = String(overId)
    if (s.startsWith('drop-')) {
      const day = days.find((d) => `drop-${d.id}` === s)
      return day ? { day, index: day.items.length } : null
    }
    const day = findDayOf(overId)
    if (!day) return null
    return { day, index: day.items.findIndex((it) => it.id === overId) }
  }

  const onDragStart = ({ active }) => {
    const day = findDayOf(active.id)
    setActiveItem({ item: day?.items.find((it) => it.id === active.id), color: day?.color })
  }

  /* live transfer across days for a smooth placeholder */
  const onDragOver = ({ active, over }) => {
    if (!over) return
    const from = findDayOf(active.id)
    const target = resolveTarget(over.id)
    if (!from || !target || from.id === target.day.id) return
    relocateItem(active.id, target.day.id, target.index)
  }

  const onDragEnd = ({ active, over }) => {
    setActiveItem(null)
    if (!over || active.id === over.id) return
    const target = resolveTarget(over.id)
    if (!target) return
    relocateItem(active.id, target.day.id, target.index)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveItem(null)}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {days.map((day, i) => (
          <DayCard key={day.id} day={day} index={i} total={days.length} />
        ))}

        <button
          onClick={() => openDayEditor(null)}
          className="mb-2 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 py-4 font-display text-sm font-bold text-ink-400 transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600"
        >
          <Plus size={18} strokeWidth={2.6} />
          Aggiungi un giorno
        </button>
      </div>

      <DragOverlay dropAnimation={{ duration: 180 }}>
        {activeItem?.item ? <ItemCardGhost item={activeItem.item} color={activeItem.color} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
