import { useEffect, useRef, useState } from 'react'
import {
  Palmtree, PlaneTakeoff, Download, Upload, RotateCcw, Plus, CarFront, MapPin,
  CalendarDays, Route, BedDouble, Fuel, Wallet, ChevronLeft, ChevronDown, UtensilsCrossed, Ticket, Receipt, Bot,
} from 'lucide-react'
import { useTrip, useUI, useRoutes, toast, activeTrip } from '../store'
import { useAgentChat } from '../agent/socket'
import { tripStats, fmtDur, fmtKm, fmtMoney, dayDate, fmtDate, fuelCostUsd, costByType, tripUsesCar, GAS_UNITS } from '../lib/utils'
import { refreshFx } from '../lib/fx'
import { getTitleImage } from './ItemImage'
import { chainedDayCoords, estimateDayKm } from '../lib/geo'
import { exportTripImages, internTripImages } from '../lib/imgdb'
import DatePicker from './DatePicker'

export default function Header() {
  const trip = useTrip((s) => activeTrip(s))
  const setTitle = useTrip((s) => s.setTitle)
  const importTrip = useTrip((s) => s.importTrip)
  const resetTrip = useTrip((s) => s.resetTrip)
  const closeTrip = useTrip((s) => s.closeTrip)
  const openDayEditor = useUI((s) => s.openDayEditor)
  const ask = useUI((s) => s.ask)
  const roadKmByDay = useRoutes((s) => s.byDay)
  const fileRef = useRef(null)

  /* €/L prices convert through a live rate: re-render once it's fetched */
  const [, setFxReady] = useState(false)
  useEffect(() => { refreshFx().then(() => setFxReady(true)) }, [])

  const stats = tripStats(trip)
  const d0 = dayDate(trip.startDate, 0)
  const dN = dayDate(trip.startDate, trip.days.length - 1)

  /* total km: real road distance where OSRM answered, estimate elsewhere */
  const totalKm = chainedDayCoords(trip).reduce(
    (s, l) => s + (roadKmByDay[l.dayId] ?? estimateDayKm(l.coords)), 0)
  const usesCar = tripUsesCar(trip)
  const costs = costByType(trip)
  const fuelUsd = usesCar ? fuelCostUsd(totalKm, trip.car) : 0
  const totalUsd = costs.items + fuelUsd

  const onExport = async () => {
    /* inline IndexedDB photos so the shared file carries them */
    const portable = await exportTripImages(trip)
    const blob = new Blob([JSON.stringify(portable, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = (trip.title || 'viaggio').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Itinerario esportato — condividilo!')
  }

  const onImportFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.days)) throw new Error('bad format')
        await internTripImages(data)
        importTrip(data)
        toast('Itinerario importato!')
      } catch {
        toast('File non valido')
      }
    }
    reader.readAsText(file)
  }

  return (
    <header className="relative z-[600] border-b border-ink-200 bg-white lg:mx-3 lg:mt-3 lg:rounded-2xl lg:border lg:shadow-lg">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-5">
        {/* back to dashboard + brand + title */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={closeTrip}
            title="Tutti i viaggi"
            aria-label="Torna ai miei viaggi"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <ChevronLeft size={19} />
          </button>
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-rose-500 text-white shadow-md shadow-brand-500/25">
            <Palmtree size={21} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <input
              value={trip.title}
              onChange={(e) => setTitle(e.target.value)}
              spellCheck={false}
              aria-label="Nome del viaggio"
              className="-ml-1.5 w-[38vw] max-w-[300px] truncate rounded-lg border border-transparent px-1.5 py-0.5 font-display text-lg font-bold text-ink-900 outline-none transition hover:border-ink-200 focus:border-brand-400 focus:bg-brand-50/40 sm:text-xl"
            />
            <p className="hidden truncate text-xs text-ink-500 2xl:block">{trip.subtitle}</p>
          </div>
        </div>

        {/* trip stats (budget lives in the strip below) */}
        <div className="hidden items-center gap-1.5 xl:flex">
          <Stat Icon={CalendarDays} value={stats.days} label="giorni" />
          <Stat Icon={MapPin} value={stats.stops} label="tappe" />
          <Stat Icon={CarFront} value={fmtDur(stats.driveMin) || '0'} label="di guida" />
          {totalKm > 50 && <Stat Icon={Route} value={fmtKm(totalKm)} label="totali" />}
          {d0 && dN && (
            <Stat
              Icon={PlaneTakeoff}
              value={`${fmtDate(d0, { day: 'numeric', month: 'short' })} – ${fmtDate(dN, { day: 'numeric', month: 'short' })}`}
              label="date"
            />
          )}
          <BudgetBadge costs={costs} fuelUsd={fuelUsd} totalUsd={totalUsd} />
        </div>

        {/* actions */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="xl:hidden">
            <BudgetBadge costs={costs} fuelUsd={fuelUsd} totalUsd={totalUsd} compact />
          </div>
          <ChatToggle />
          {usesCar && <CarSettings />}
          <DatePicker />
          <button
            onClick={() => openDayEditor(null)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[.97]"
          >
            <Plus size={16} strokeWidth={2.6} />
            <span className="hidden sm:inline">Giorno</span>
          </button>
          <IconBtn title="Esporta itinerario (JSON)" onClick={onExport}><Download size={17} /></IconBtn>
          <IconBtn title="Importa itinerario" onClick={() => fileRef.current?.click()}><Upload size={17} /></IconBtn>
          <IconBtn
            title="Ripristina itinerario originale"
            onClick={() =>
              ask('Ripristinare l’itinerario originale California Coast & Parks? Le modifiche attuali andranno perse (puoi esportarle prima).', () => {
                resetTrip()
                toast('Itinerario ripristinato')
              })
            }
          >
            <RotateCcw size={17} />
          </IconBtn>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImportFile} />
        </div>
      </div>

    </header>
  )
}

/* total-budget badge: hover or click reveals the category breakdown */
function BudgetBadge({ costs, fuelUsd, totalUsd, compact }) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const ref = useRef(null)
  const open = (hover || pinned) && totalUsd > 0

  useEffect(() => {
    if (!pinned) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setPinned(false) }
    const onKey = (e) => { if (e.key === 'Escape') setPinned(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [pinned])

  const rows = [
    { Icon: BedDouble, label: 'Hotel', v: costs.hotel, chip: 'bg-violet-100 text-violet-600', bar: 'bg-violet-400' },
    { Icon: UtensilsCrossed, label: 'Cibo', v: costs.food, chip: 'bg-rose-100 text-rose-600', bar: 'bg-rose-400' },
    { Icon: Ticket, label: 'Attività', v: costs.activity, chip: 'bg-amber-100 text-amber-600', bar: 'bg-amber-400' },
    { Icon: Receipt, label: 'Extra & ingressi', v: costs.extra, chip: 'bg-teal-100 text-teal-600', bar: 'bg-teal-400' },
    { Icon: Fuel, label: 'Benzina (stima)', v: fuelUsd, chip: 'bg-sky-100 text-sky-600', bar: 'bg-sky-400' },
  ].filter((r) => r.v > 0)

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={() => setPinned((p) => !p)}
        aria-label="Budget di viaggio"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 transition hover:border-emerald-300 ${
          compact ? '' : ''
        }`}
      >
        <Wallet size={14} className="text-emerald-600" />
        <div className="leading-tight">
          <div className="whitespace-nowrap text-[12.5px] font-bold text-emerald-800">{fmtMoney(totalUsd)}</div>
          <div className="hidden text-[9.5px] font-medium uppercase tracking-wide text-emerald-600/70 sm:block">budget</div>
        </div>
        <ChevronDown size={12} className={`text-emerald-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="anim-fade-up absolute right-0 top-[calc(100%+8px)] z-[950] w-72 rounded-2xl border border-ink-200 bg-white p-4 shadow-xl">
          <h4 className="mb-3 font-display text-[13px] font-bold text-ink-900">Budget di viaggio</h4>
          <div className="flex flex-col gap-2.5">
            {rows.map((r) => (
              <div key={r.label}>
                <div className="flex items-center gap-2.5">
                  <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${r.chip}`}>
                    <r.Icon size={14} />
                  </span>
                  <span className="flex-1 text-xs font-semibold text-ink-600">{r.label}</span>
                  <span className="text-[13px] font-bold tabular-nums text-ink-900">{fmtMoney(r.v)}</span>
                </div>
                <div className="ml-9.5 mt-1 h-1 overflow-hidden rounded-full bg-ink-100">
                  <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${(r.v / totalUsd) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5 border-t border-ink-100 pt-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
              <Wallet size={14} />
            </span>
            <span className="flex-1 text-xs font-bold uppercase tracking-wide text-ink-700">Totale</span>
            <span className="font-display text-[15px] font-extrabold tabular-nums text-emerald-700">{fmtMoney(totalUsd)}</span>
          </div>
          <p className="mt-2 text-[10.5px] leading-snug text-ink-400">
            Carburante stimato dai km reali del percorso e dai dati della tua auto (icona auto qui sopra).
          </p>
        </div>
      )}
    </div>
  )
}

/* toggle for the AI chat side panel (desktop) */
function ChatToggle() {
  const open = useAgentChat((s) => s.open)
  const setOpen = useAgentChat((s) => s.setOpen)
  const connected = useAgentChat((s) => s.connected)
  return (
    <button
      onClick={() => setOpen(!open)}
      title="Assistente AI"
      aria-label="Assistente AI"
      className={`relative hidden size-9 place-items-center rounded-xl transition lg:grid ${
        open ? 'bg-violet-50 text-violet-600' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700'
      }`}
    >
      <Bot size={18} />
      <span
        className={`absolute right-1.5 top-1.5 size-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-ink-300'}`}
      />
    </button>
  )
}

/* popover to set the car (model with photo, consumption, fuel price in the
   local unit) driving the fuel estimate */
function CarSettings() {
  const car = useTrip((s) => activeTrip(s).car)
  const setCar = useTrip((s) => s.setCar)
  const [open, setOpen] = useState(false)
  const [photo, setPhoto] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  /* live EUR→USD rate for €/L prices, refreshed once per day */
  useEffect(() => { if (open) refreshFx() }, [open])

  /* photo of the user's car model, debounced while typing */
  const model = car.model?.trim() ?? ''
  useEffect(() => {
    if (!open || model.length < 4) { setPhoto(null); return }
    let dead = false
    const t = setTimeout(() => {
      getTitleImage(model).then((img) => { if (!dead) setPhoto(img) })
    }, 600)
    return () => { dead = true; clearTimeout(t) }
  }, [model, open])

  const askAgent = () => {
    setOpen(false)
    const chat = useAgentChat.getState()
    chat.setOpen(true)
    chat.send(
      'Cerca sul web il prezzo medio attuale del carburante nella zona di questo viaggio e aggiorna le impostazioni auto con set_trip_meta (usa l’unità locale). Se conosci il consumo tipico della mia auto, aggiorna anche quello.',
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="La tua auto (per la stima carburante)"
        aria-label="Impostazioni auto"
        className={`grid size-9 place-items-center rounded-xl transition ${
          open ? 'bg-brand-50 text-brand-600' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700'
        }`}
      >
        <CarFront size={18} />
      </button>
      {open && (
        <div className="anim-fade-up absolute right-0 top-[calc(100%+8px)] z-[950] w-80 rounded-2xl border border-ink-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center gap-2">
            <CarFront size={16} className="text-brand-500" />
            <h4 className="font-display text-sm font-bold text-ink-900">La tua auto</h4>
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Marca e modello</span>
            <input
              type="text"
              value={car.model}
              onChange={(e) => setCar({ model: e.target.value })}
              placeholder="es. Dacia Duster, Toyota RAV4…"
              spellCheck={false}
              className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </label>
          {photo && (
            <div className="anim-fade-in mb-3 overflow-hidden rounded-xl border border-ink-100">
              <img src={photo.url} alt={photo.title} className="h-32 w-full object-cover" />
              <p className="bg-ink-50 px-2.5 py-1 text-[10px] font-medium text-ink-400">{photo.title} · Wikipedia</p>
            </div>
          )}

          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Consumo (L/100 km)</span>
            <input
              type="number" min="1" max="30" step="0.1"
              value={car.lPer100}
              onChange={(e) => setCar({ lPer100: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </label>

          <div className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">Prezzo carburante</span>
            <div className="flex gap-2">
              <input
                type="number" min="0.5" max="15" step="0.05"
                value={car.gasPrice}
                aria-label="Prezzo carburante"
                onChange={(e) => setCar({ gasPrice: parseFloat(e.target.value) || 0 })}
                className="min-w-0 flex-1 rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
              <select
                value={car.gasUnit}
                aria-label="Unità del prezzo carburante"
                onChange={(e) => setCar({ gasUnit: e.target.value })}
                className="rounded-xl border border-ink-200 bg-white px-2.5 py-2 text-sm font-semibold text-ink-700 outline-none transition focus:border-brand-400"
              >
                {Object.entries(GAS_UNITS).map(([k, u]) => (
                  <option key={k} value={k}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-ink-50 p-2.5">
            <p className="text-[11px] leading-snug text-ink-500">
              Il prezzo giusto dipende da dove viaggi e cambia nel tempo: chiedi all'assistente
              di cercare la media aggiornata a destinazione.
            </p>
            <button
              onClick={askAgent}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-violet-700"
            >
              <Bot size={13} /> Cerca il prezzo aggiornato
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ Icon, value, label, tone }) {
  const tones = {
    violet: 'text-violet-600',
    sky: 'text-sky-600',
    emerald: 'text-emerald-600',
  }
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5">
      <Icon size={14} className={tones[tone] ?? 'text-brand-500'} />
      <div className="leading-tight">
        <div className="whitespace-nowrap text-[12.5px] font-bold text-ink-800">{value}</div>
        <div className="text-[9.5px] font-medium uppercase tracking-wide text-ink-400">{label}</div>
      </div>
    </div>
  )
}


function IconBtn({ title, onClick, children }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 active:scale-95"
    >
      {children}
    </button>
  )
}
