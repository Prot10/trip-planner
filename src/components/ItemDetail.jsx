import { useState } from 'react'
import {
  X, ChevronLeft, ChevronRight, Clock, Timer, Star, Pencil, Navigation, MapPinned,
  ExternalLink, ImageOff, BedDouble,
} from 'lucide-react'
import { useTrip, useUI, activeTrip } from '../store'
import { fmtDur, fmtMoney, gmapsUrl } from '../lib/utils'
import { TYPE_META } from './typeMeta'
import { useItemImages } from './ItemImage'
import Modal from './Modal'

/* Read-only detail card: big photo carousel + all the item's info */
export default function ItemDetail() {
  const detail = useUI((s) => s.detail)
  const closeDetail = useUI((s) => s.closeDetail)
  const openEditor = useUI((s) => s.openEditor)
  const setFlyTo = useUI((s) => s.setFlyTo)
  const setTab = useUI((s) => s.setTab)
  const trip = useTrip((s) => activeTrip(s))

  const day = trip?.days.find((d) => d.id === detail.dayId)
  const dayIndex = trip?.days.indexOf(day)
  const item = day?.items.find((i) => i.id === detail.itemId)
  const images = useItemImages(item ?? { lat: null }, !!item)
  const [idx, setIdx] = useState(0)

  if (!item) return null
  const meta = TYPE_META[item.type]
  const img = images[Math.min(idx, images.length - 1)]

  const showOnMap = () => {
    closeDetail()
    setFlyTo({ lat: item.lat, lng: item.lng, itemId: item.id })
    if (window.innerWidth < 1024) setTab('map')
  }

  return (
    <Modal onClose={closeDetail} wide>
      {/* carousel */}
      <div className="relative h-56 w-full overflow-hidden rounded-t-3xl bg-ink-100 sm:h-72">
        {img ? (
          <img key={img.url} src={img.url} alt={img.title} className="anim-fade-in h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-300">
            <ImageOff size={34} />
          </div>
        )}

        {images.length > 1 && (
          <>
            <CarouselBtn side="left" onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}>
              <ChevronLeft size={19} />
            </CarouselBtn>
            <CarouselBtn side="right" onClick={() => setIdx((i) => (i + 1) % images.length)}>
              <ChevronRight size={19} />
            </CarouselBtn>
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Foto ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {img && (
          <span className="absolute left-3 top-3 rounded-lg bg-ink-900/70 px-2 py-1 text-[10.5px] font-semibold text-white backdrop-blur">
            {img.title}
          </span>
        )}
        <button
          onClick={closeDetail}
          aria-label="Chiudi"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-ink-900/60 text-white backdrop-blur transition hover:bg-ink-900/85"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip className="bg-ink-100 text-ink-700 ring-ink-500/15">Giorno {dayIndex + 1}</Chip>
          <Chip className={meta.chip}><meta.Icon size={11} /> {meta.label}</Chip>
          {item.time && <Chip className="bg-ink-100 text-ink-700 ring-ink-500/15"><Clock size={11} /> {item.time}</Chip>}
          {item.dur > 0 && <Chip className="bg-blue-50 text-blue-700 ring-blue-600/20"><Timer size={11} /> {fmtDur(item.dur)}</Chip>}
          {item.price > 0 && (
            <Chip className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">
              {item.type === 'hotel' && <BedDouble size={11} />} {fmtMoney(item.price)}{item.type === 'hotel' ? '/notte' : ''}
            </Chip>
          )}
          {item.must && (
            <Chip className="bg-amber-50 text-amber-700 ring-amber-500/30">
              <Star size={11} fill="currentColor" /> imperdibile
            </Chip>
          )}
        </div>

        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink-900">{item.title}</h3>
        {item.notes && <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-600">{item.notes}</p>}

        {(item.lat != null || item.links.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.lat != null && (
              <>
                <button
                  onClick={showOnMap}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 transition hover:bg-emerald-100"
                >
                  <MapPinned size={13} /> Mostra sulla mappa
                </button>
                <a
                  href={gmapsUrl(item.lat, item.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20 transition hover:bg-blue-100"
                >
                  <Navigation size={13} /> Google Maps
                </a>
              </>
            )}
            {item.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1.5 text-xs font-semibold text-ink-600 ring-1 ring-ink-500/10 transition hover:bg-ink-200"
              >
                <ExternalLink size={13} /> {l.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2.5 border-t border-ink-100 px-5 py-4 sm:px-6">
        <button
          onClick={closeDetail}
          className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
        >
          Chiudi
        </button>
        <button
          onClick={() => openEditor(detail.dayId, detail.itemId)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600"
        >
          <Pencil size={14} /> Modifica
        </button>
      </div>
    </Modal>
  )
}

function CarouselBtn({ side, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Foto precedente' : 'Foto successiva'}
      className={`absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-ink-900/55 text-white backdrop-blur transition hover:bg-ink-900/80 ${
        side === 'left' ? 'left-2.5' : 'right-2.5'
      }`}
    >
      {children}
    </button>
  )
}

function Chip({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${className}`}>
      {children}
    </span>
  )
}
