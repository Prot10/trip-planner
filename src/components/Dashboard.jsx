import { useRef, useState } from 'react'
import {
  Palmtree, Plus, Copy, Trash2, Upload, MapPin, CalendarDays, CarFront, ChevronRight, Route, Wallet,
} from 'lucide-react'
import { useTrip, useUI, toast } from '../store'
import { tripStats, fmtDur, dayDate, fmtDate, fmtKm, fmtMoney, costByType, fuelCostUsd } from '../lib/utils'
import { chainedDayCoords, estimateDayKm } from '../lib/geo'
import { internTripImages } from '../lib/imgdb'
import { useItemImages } from './ItemImage'
import ConfirmDialog from './ConfirmDialog'
import Toast from './Toast'

export default function Dashboard() {
  const trips = useTrip((s) => s.trips)
  const openTrip = useTrip((s) => s.openTrip)
  const createTrip = useTrip((s) => s.createTrip)
  const deleteTrip = useTrip((s) => s.deleteTrip)
  const duplicateTrip = useTrip((s) => s.duplicateTrip)
  const importNewTrip = useTrip((s) => s.importNewTrip)
  const ask = useUI((s) => s.ask)
  const fileRef = useRef(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  /* the primary path: a new trip is born as a conversation with the agent */
  const onCreateWithAgent = () => {
    createTrip('Nuovo viaggio', 'interview')
  }

  /* discreet manual fallback */
  const onCreate = () => {
    createTrip(newTitle.trim())
    setCreating(false)
    setNewTitle('')
    toast('Viaggio creato — buona pianificazione!')
  }

  const onImportFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.days)) throw new Error('bad')
        await internTripImages(data)
        importNewTrip(data)
        toast('Viaggio importato!')
      } catch {
        toast('File non valido')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-full bg-ink-100">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-rose-500 text-white shadow-md shadow-brand-500/25">
            <Palmtree size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-ink-900">I miei viaggi</h1>
            <p className="text-xs text-ink-500">Pianifica, ottimizza e condividi i tuoi itinerari</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-600 shadow-sm transition hover:border-ink-300"
            >
              <Upload size={15} /> <span className="hidden sm:inline">Importa</span>
            </button>
            <button
              onClick={onCreateWithAgent}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[.97]"
            >
              <Plus size={16} strokeWidth={2.6} /> Nuovo viaggio
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImportFile} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {creating && (
          <div className="anim-fade-up mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="Nome del viaggio… (es. Weekend a Roma)"
              className="min-w-0 flex-1 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            <button onClick={() => setCreating(false)} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-50">
              Annulla
            </button>
            <button onClick={onCreate} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600">
              Crea
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onOpen={() => openTrip(trip.id)}
              onDuplicate={() => { duplicateTrip(trip.id); toast('Viaggio duplicato') }}
              onDelete={() =>
                ask(`Eliminare definitivamente il viaggio "${trip.title}"?`, () => {
                  deleteTrip(trip.id)
                  toast('Viaggio eliminato')
                })
              }
            />
          ))}

          <button
            onClick={onCreateWithAgent}
            className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 font-display text-sm font-bold text-ink-400 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
          >
            <Plus size={24} strokeWidth={2.4} />
            Nuovo viaggio
            <span className="font-sans text-[11px] font-medium text-ink-400">l'assistente lo costruisce con te</span>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          Preferisci partire da zero?{' '}
          <button
            onClick={() => setCreating(true)}
            className="font-semibold text-ink-500 underline decoration-ink-300 underline-offset-2 transition hover:text-ink-700"
          >
            crea un viaggio manualmente
          </button>
        </p>
      </main>

      <ConfirmDialog />
      <Toast />
    </div>
  )
}

function TripCard({ trip, onOpen, onDuplicate, onDelete }) {
  const stats = tripStats(trip)
  const d0 = dayDate(trip.startDate, 0)
  const dN = dayDate(trip.startDate, trip.days.length - 1)
  const km = chainedDayCoords(trip).reduce((s, l) => s + estimateDayKm(l.coords), 0)
  const budget = costByType(trip).items + fuelCostUsd(km, trip.car)

  /* cover: first located, non-drive stop */
  const cover = trip.days.flatMap((d) => d.items).find((i) => i.lat != null && i.type !== 'drive')
  const images = useItemImages(cover ?? { lat: null }, !!cover)

  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-32 bg-gradient-to-br from-brand-100 via-rose-50 to-sky-100">
        {images[0] && (
          <img src={images[0].url} alt="" loading="lazy" className="anim-fade-in h-full w-full object-cover" />
        )}
        {/* day-color strip */}
        <div className="absolute inset-x-0 bottom-0 flex h-1.5">
          {trip.days.map((d) => (
            <span key={d.id} className="flex-1" style={{ background: d.color }} />
          ))}
        </div>
        <div className="absolute right-2.5 top-2.5 flex gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <CardBtn title="Duplica" onClick={onDuplicate}><Copy size={13} /></CardBtn>
          <CardBtn title="Elimina" danger onClick={onDelete}><Trash2 size={13} /></CardBtn>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate font-display text-[15px] font-bold text-ink-900">{trip.title}</h2>
          <ChevronRight size={17} className="shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
        </div>
        {trip.subtitle && <p className="mt-0.5 truncate text-xs text-ink-500">{trip.subtitle}</p>}

        <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] font-semibold text-ink-500">
          <span className="inline-flex items-center gap-1"><CalendarDays size={12} className="text-brand-500" /> {stats.days} giorni{d0 && dN ? ` · ${fmtDate(d0, { day: 'numeric', month: 'short' })} – ${fmtDate(dN, { day: 'numeric', month: 'short' })}` : ''}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={12} className="text-brand-500" /> {stats.stops} tappe</span>
          {stats.driveMin > 0 && <span className="inline-flex items-center gap-1"><CarFront size={12} className="text-brand-500" /> {fmtDur(stats.driveMin)}</span>}
          {km > 50 && <span className="inline-flex items-center gap-1"><Route size={12} className="text-brand-500" /> ~{fmtKm(km)}</span>}
          {budget > 0 && <span className="inline-flex items-center gap-1 text-emerald-700"><Wallet size={12} /> ~{fmtMoney(budget)}</span>}
        </div>
      </div>
    </article>
  )
}

function CardBtn({ title, onClick, danger, children }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded-lg bg-white/90 shadow backdrop-blur transition ${
        danger ? 'text-ink-500 hover:bg-rose-50 hover:text-rose-600' : 'text-ink-500 hover:bg-white hover:text-ink-800'
      }`}
    >
      {children}
    </button>
  )
}
