import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Palmtree, PlaneTakeoff, Download, Upload, Plus, CarFront, MapPin, CalendarDays, Route, BedDouble,
  Fuel, Wallet, ChevronLeft, ChevronDown, UtensilsCrossed, Ticket, Receipt, Bot, Gauge, MoreHorizontal, Languages,
} from 'lucide-react'
import { LANGS } from '../i18n/langs'
import { useTrip, useUI, useRoutes, toast, activeTrip } from '../store'
import { useAgentChat } from '../agent/socket'
import { tripStats, fmtDur, fmtKm, fmtMoney, dayDate, fmtDate, fuelCost, costByType, tripUsesCar, GAS_UNITS } from '../lib/utils'
import { refreshFx } from '../lib/fx'
import { getTitleImage } from './ItemImage'
import { chainedDayCoords, estimateDayKm } from '../lib/geo'
import { exportTripImages, internTripImages } from '../lib/imgdb'
import DatePicker, { CalendarPanel } from './DatePicker'
import LanguageSwitcher from './LanguageSwitcher'
import Modal from './Modal'
import { DemoBadgeInline } from '../demo/DemoBadge'

export default function Header() {
  const { t } = useTranslation()
  const trip = useTrip((s) => activeTrip(s))
  const setTitle = useTrip((s) => s.setTitle)
  const importTrip = useTrip((s) => s.importTrip)
  const closeTrip = useTrip((s) => s.closeTrip)
  const openDayEditor = useUI((s) => s.openDayEditor)
  const roadKmByDay = useRoutes((s) => s.byDay)
  const fileRef = useRef(null)

  /* mobile: which full-screen sheet is open (dates / budget / car) */
  const [mobilePanel, setMobilePanel] = useState(null)

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
  const currency = trip.currency ?? 'USD'
  const fuelUsd = usesCar ? fuelCost(totalKm, trip.car, currency) : 0
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
    toast(t('header.toasts.exported'))
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
        toast(t('header.toasts.imported'))
      } catch {
        toast(t('header.toasts.invalidFile'))
      }
    }
    reader.readAsText(file)
  }

  /* every stat as data: rendered as chips when there is room, aggregated
     into a single popover chip when there is not */
  const statRows = [
    { Icon: CalendarDays, value: String(stats.days), label: t('header.stats.days', { count: stats.days }) },
    { Icon: MapPin, value: String(stats.stops), label: t('header.stats.stops', { count: stats.stops }) },
    { Icon: CarFront, value: fmtDur(stats.driveMin) || '0', label: t('header.stats.driving') },
    ...(totalKm > 50 ? [{ Icon: Route, value: fmtKm(totalKm), label: t('header.stats.total') }] : []),
    ...(d0 && dN ? [{
      Icon: PlaneTakeoff,
      value: `${fmtDate(d0, { day: 'numeric', month: 'short' })} – ${fmtDate(dN, { day: 'numeric', month: 'short' })}`,
      label: t('header.stats.dates'),
    }] : []),
  ]

  return (
    <header className="relative z-[600] border-b border-ink-200 bg-white lg:mx-3 lg:mt-3 lg:rounded-2xl lg:border lg:shadow-lg">
      {/* one row, never wraps: elements compact themselves as the container
          narrows (container queries, so the ladder follows the real space) */}
      <div className="@container flex flex-nowrap items-center gap-1.5 px-3 py-2.5 @[40rem]:gap-2 @[64rem]:gap-x-3 sm:px-5">
        {/* back to dashboard + brand + title (the flexible part: it truncates first) */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={closeTrip}
            title={t('header.allTrips')}
            aria-label={t('header.backToTrips')}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <ChevronLeft size={19} />
          </button>
          <div className="hidden size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-rose-500 text-white shadow-md shadow-brand-500/25 @[30rem]:grid">
            <Palmtree size={21} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={trip.title}
              onChange={(e) => setTitle(e.target.value)}
              spellCheck={false}
              aria-label={t('header.tripName')}
              className="-ml-1.5 w-full max-w-[300px] truncate rounded-lg border border-transparent px-1.5 py-0.5 font-display text-lg font-bold text-ink-900 outline-none transition hover:border-ink-200 focus:border-brand-400 focus:bg-brand-50/40 sm:text-xl"
            />
            <p className="hidden truncate text-xs text-ink-500 @[100rem]:block">{trip.subtitle}</p>
          </div>
        </div>

        {/* stats: chips with labels → value-only chips → one aggregated chip.
            the chip row only appears once the title keeps a comfortable width */}
        <div className="hidden shrink-0 items-center gap-1.5 @[78rem]:flex">
          {statRows.map((r) => <Stat key={r.label} {...r} />)}
        </div>
        <StatsChip rows={statRows} className="hidden lg:@[24rem]:block @[78rem]:hidden" />

        {/* actions */}
        <div className="flex shrink-0 items-center gap-1.5 @[40rem]:gap-2">
          <div className="max-lg:hidden"><BudgetBadge costs={costs} fuelUsd={fuelUsd} totalUsd={totalUsd} currency={currency} /></div>
          <ChatToggle />
          {usesCar && <div className="max-lg:hidden"><CarSettings /></div>}
          <div className="max-lg:hidden"><DatePicker /></div>
          <button
            onClick={() => openDayEditor(null)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[.97]"
          >
            <Plus size={16} strokeWidth={2.6} />
            <span className="hidden @[54rem]:inline">{t('common.day')}</span>
          </button>
          <IconBtn className="hidden lg:@[48rem]:grid" title={t('header.exportTooltip')} onClick={onExport}><Download size={17} /></IconBtn>
          <IconBtn className="hidden lg:@[48rem]:grid" title={t('header.importTooltip')} onClick={() => fileRef.current?.click()}><Upload size={17} /></IconBtn>
          <div className="hidden lg:@[34rem]:block"><LanguageSwitcher compact /></div>
          <MoreMenu onExport={onExport} onImport={() => fileRef.current?.click()} onCar={usesCar ? () => setMobilePanel('car') : null} />
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImportFile} />
        </div>
      </div>

      {/* mobile: the stats live in an always-visible scrollable strip */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3 pb-2.5 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] lg:hidden">
        <DemoBadgeInline />
        {statRows.filter((r) => r.Icon !== PlaneTakeoff).map((r) => (
          <span key={r.label} title={r.label} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5">
            <r.Icon size={13} className="text-brand-500" />
            <span className="whitespace-nowrap text-[12px] font-bold text-ink-800">{r.value}</span>
          </span>
        ))}
        <button
          onClick={() => setMobilePanel('dates')}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5 active:bg-ink-100"
        >
          <PlaneTakeoff size={13} className="text-brand-500" />
          <span className={`whitespace-nowrap text-[12px] font-bold ${d0 ? 'text-ink-800' : 'text-ink-400'}`}>
            {d0 && dN
              ? `${fmtDate(d0, { day: 'numeric', month: 'short' })} – ${fmtDate(dN, { day: 'numeric', month: 'short' })}`
              : t('datePicker.startDate')}
          </span>
        </button>
        {totalUsd > 0 && (
          <button
            onClick={() => setMobilePanel('budget')}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 active:bg-emerald-100"
          >
            <Wallet size={13} className="text-emerald-600" />
            <span className="whitespace-nowrap text-[12px] font-bold text-emerald-800">{fmtMoney(totalUsd, currency)}</span>
          </button>
        )}
      </div>

      {/* mobile bottom sheets behind the strip chips */}
      {mobilePanel === 'dates' && (
        <Modal onClose={() => setMobilePanel(null)}>
          <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <CalendarPanel onPicked={() => setMobilePanel(null)} />
          </div>
        </Modal>
      )}
      {mobilePanel === 'budget' && (
        <Modal onClose={() => setMobilePanel(null)}>
          <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <BudgetBreakdown costs={costs} fuelUsd={fuelUsd} totalUsd={totalUsd} currency={currency} />
          </div>
        </Modal>
      )}
      {mobilePanel === 'car' && (
        <Modal onClose={() => setMobilePanel(null)}>
          <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <CarForm />
          </div>
        </Modal>
      )}
    </header>
  )
}

/* all the trip stats behind one small chip, for when chips don't fit */
function StatsChip({ rows, className }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className={`relative shrink-0 ${className ?? ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={t('header.statsChip')}
        aria-label={t('header.statsChip')}
        aria-expanded={open}
        className={`grid size-9 place-items-center rounded-xl border transition ${
          open ? 'border-brand-400 bg-brand-50 text-brand-600 ring-2 ring-brand-400/20' : 'border-ink-200 bg-ink-50 text-ink-500 hover:border-ink-300'
        }`}
      >
        <Gauge size={17} />
      </button>
      {open && (
        <div className="anim-fade-up absolute right-0 top-[calc(100%+8px)] z-[950] w-60 rounded-2xl border border-ink-200 bg-white p-2 shadow-xl">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
              <r.Icon size={15} className="shrink-0 text-brand-500" />
              <span className="flex-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">{r.label}</span>
              <span className="whitespace-nowrap text-[13px] font-bold text-ink-800">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* overflow menu: hosts export/import (and the language picker on phones) */
function MoreMenu({ onExport, onImport, onCar }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const Row = ({ Icon, label, onClick, className = '' }) => (
    <button
      onClick={() => { setOpen(false); onClick() }}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink-600 transition hover:bg-ink-50 ${className}`}
    >
      <Icon size={15} className="text-ink-400" /> {label}
    </button>
  )

  return (
    <div ref={ref} className="relative lg:@[48rem]:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        title={t('header.moreMenu')}
        aria-label={t('header.moreMenu')}
        aria-expanded={open}
        className={`grid size-9 place-items-center rounded-xl transition ${
          open ? 'bg-ink-100 text-ink-700' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-700'
        }`}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="anim-fade-up absolute right-0 top-[calc(100%+8px)] z-[950] w-52 rounded-2xl border border-ink-200 bg-white p-1.5 shadow-xl">
          <Row Icon={Download} label={t('header.exportTooltip')} onClick={onExport} />
          <Row Icon={Upload} label={t('header.importTooltip')} onClick={onImport} />
          {onCar && <Row Icon={CarFront} label={t('header.car.title')} onClick={onCar} className="lg:hidden" />}
          {/* language switch lives here only while the inline picker is hidden */}
          <div className="mt-1 border-t border-ink-100 pt-1 lg:@[34rem]:hidden">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { i18n.changeLanguage(l.code); setOpen(false) }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition ${
                  l.code === i18n.language ? 'bg-brand-50 font-bold text-brand-700' : 'font-semibold text-ink-600 hover:bg-ink-50'
                }`}
              >
                <Languages size={15} className={l.code === i18n.language ? 'text-brand-500' : 'text-ink-400'} />
                {l.native}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* total-budget badge: hover or click reveals the category breakdown */
function BudgetBadge({ costs, fuelUsd, totalUsd, currency }) {
  const { t } = useTranslation()
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

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={() => setPinned((p) => !p)}
        aria-label={t('header.budget.title')}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1.5 transition hover:border-emerald-300 @[86rem]:px-2.5"
      >
        <Wallet size={14} className="text-emerald-600" />
        <div className="hidden leading-tight @[26rem]:block">
          <div className="whitespace-nowrap text-[12.5px] font-bold text-emerald-800">{fmtMoney(totalUsd, currency)}</div>
          <div className="hidden text-[9.5px] font-medium uppercase tracking-wide text-emerald-600/70 @[86rem]:block">{t('header.budget.badge')}</div>
        </div>
        <ChevronDown size={12} className={`hidden text-emerald-500 transition-transform @[26rem]:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="anim-fade-up absolute right-0 top-[calc(100%+8px)] z-[950] w-72 rounded-2xl border border-ink-200 bg-white p-4 shadow-xl">
          <BudgetBreakdown costs={costs} fuelUsd={fuelUsd} totalUsd={totalUsd} currency={currency} />
        </div>
      )}
    </div>
  )
}

/* the category breakdown itself: desktop popover and mobile sheet share it */
function BudgetBreakdown({ costs, fuelUsd, totalUsd, currency }) {
  const { t } = useTranslation()
  const rows = [
    { Icon: BedDouble, label: t('header.budget.hotel'), v: costs.hotel, chip: 'bg-violet-100 text-violet-600', bar: 'bg-violet-400' },
    { Icon: UtensilsCrossed, label: t('header.budget.food'), v: costs.food, chip: 'bg-rose-100 text-rose-600', bar: 'bg-rose-400' },
    { Icon: Ticket, label: t('header.budget.activity'), v: costs.activity, chip: 'bg-amber-100 text-amber-600', bar: 'bg-amber-400' },
    { Icon: Receipt, label: t('header.budget.extra'), v: costs.extra, chip: 'bg-teal-100 text-teal-600', bar: 'bg-teal-400' },
    { Icon: Fuel, label: t('header.budget.fuel'), v: fuelUsd, chip: 'bg-sky-100 text-sky-600', bar: 'bg-sky-400' },
  ].filter((r) => r.v > 0)

  return (
    <>
      <h4 className="mb-3 font-display text-[13px] font-bold text-ink-900">{t('header.budget.title')}</h4>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center gap-2.5">
              <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${r.chip}`}>
                <r.Icon size={14} />
              </span>
              <span className="flex-1 text-xs font-semibold text-ink-600">{r.label}</span>
              <span className="text-[13px] font-bold tabular-nums text-ink-900">{fmtMoney(r.v, currency)}</span>
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
        <span className="flex-1 text-xs font-bold uppercase tracking-wide text-ink-700">{t('header.budget.totalLabel')}</span>
        <span className="font-display text-[15px] font-extrabold tabular-nums text-emerald-700">{fmtMoney(totalUsd, currency)}</span>
      </div>
      <p className="mt-2 text-[10.5px] leading-snug text-ink-400">
        {t('header.budget.fuelNote')}
      </p>
    </>
  )
}

/* toggle for the AI chat side panel (desktop) */
function ChatToggle() {
  const { t } = useTranslation()
  const open = useAgentChat((s) => s.open)
  const setOpen = useAgentChat((s) => s.setOpen)
  const connected = useAgentChat((s) => s.connected)
  return (
    <button
      onClick={() => setOpen(!open)}
      title={t('header.aiAssistant')}
      aria-label={t('header.aiAssistant')}
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
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title={t('header.car.tooltip')}
        aria-label={t('header.car.settingsAria')}
        className={`grid size-9 place-items-center rounded-xl transition ${
          open ? 'bg-brand-50 text-brand-600' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700'
        }`}
      >
        <CarFront size={18} />
      </button>
      {open && (
        <div className="anim-fade-up absolute right-0 top-[calc(100%+8px)] z-[950] w-80 rounded-2xl border border-ink-200 bg-white p-4 shadow-xl">
          <CarForm onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

/* the car form itself: desktop popover and mobile sheet share it */
function CarForm({ onDone }) {
  const { t } = useTranslation()
  const car = useTrip((s) => activeTrip(s).car)
  const setCar = useTrip((s) => s.setCar)
  const [photo, setPhoto] = useState(null)

  /* live EUR→USD rate for €/L prices, refreshed once per day */
  useEffect(() => { refreshFx() }, [])

  /* photo of the user's car model, debounced while typing */
  const model = car.model?.trim() ?? ''
  useEffect(() => {
    if (model.length < 4) { setPhoto(null); return }
    let dead = false
    const t = setTimeout(() => {
      getTitleImage(model).then((img) => { if (!dead) setPhoto(img) })
    }, 600)
    return () => { dead = true; clearTimeout(t) }
  }, [model])

  const askAgent = () => {
    onDone?.()
    const chat = useAgentChat.getState()
    chat.setOpen(true)
    chat.send(t('header.car.askAgentPrompt'))
  }

  return (
    <>
          <div className="mb-3 flex items-center gap-2">
            <CarFront size={16} className="text-brand-500" />
            <h4 className="font-display text-sm font-bold text-ink-900">{t('header.car.title')}</h4>
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{t('header.car.makeModel')}</span>
            <input
              type="text"
              value={car.model}
              onChange={(e) => setCar({ model: e.target.value })}
              placeholder={t('header.car.modelPlaceholder')}
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
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{t('header.car.consumption')}</span>
            <input
              type="number" min="1" max="30" step="0.1"
              value={car.lPer100}
              onChange={(e) => setCar({ lPer100: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </label>

          <div className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{t('header.car.fuelPrice')}</span>
            <div className="flex gap-2">
              <input
                type="number" min="0.5" max="15" step="0.05"
                value={car.gasPrice}
                aria-label={t('header.car.fuelPrice')}
                onChange={(e) => setCar({ gasPrice: parseFloat(e.target.value) || 0 })}
                className="min-w-0 flex-1 rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              />
              <select
                value={car.gasUnit}
                aria-label={t('header.car.fuelPriceUnit')}
                onChange={(e) => setCar({ gasUnit: e.target.value })}
                className="rounded-xl border border-ink-200 bg-white px-2.5 py-2 text-sm font-semibold text-ink-700 outline-none transition focus:border-brand-400"
              >
                {Object.entries(GAS_UNITS).map(([k, u]) => (
                  <option key={k} value={k}>{t(u.labelKey)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-ink-50 p-2.5">
            <p className="text-[11px] leading-snug text-ink-500">
              {t('header.car.priceHint')}
            </p>
            <button
              onClick={askAgent}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-violet-700"
            >
              <Bot size={13} /> {t('header.car.askAgentButton')}
            </button>
          </div>
    </>
  )
}

/* chip with icon + value; the caption appears only when the header is wide */
function Stat({ Icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 px-2 py-1.5 @[86rem]:px-2.5" title={label}>
      <Icon size={14} className="text-brand-500" />
      <div className="leading-tight">
        <div className="whitespace-nowrap text-[12.5px] font-bold text-ink-800">{value}</div>
        <div className="hidden text-[9.5px] font-medium uppercase tracking-wide text-ink-400 @[86rem]:block">{label}</div>
      </div>
    </div>
  )
}


function IconBtn({ title, onClick, className, children }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`${className ?? 'grid'} size-9 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 active:scale-95`}
    >
      {children}
    </button>
  )
}
