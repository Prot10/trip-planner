/* Faithful, non-interactive replicas of the app's UI pieces, with markup and
   Tailwind classes copied verbatim from the real components (ItemCard,
   DayCard, ChatPanel, PlanningStepper, QuestionCard, chatShared, Header).
   Both projects share the same @theme tokens, so these render pixel-identical
   to the product. Keep in sync with src/components/* when the app changes. */

import {
  Bot, MapPin, Car, UtensilsCrossed, BedDouble, Lightbulb, Clock, Timer, Star,
  Check, GripVertical, MapPinned, Navigation, ExternalLink, CalendarDays, CarFront,
  ChevronDown, ChevronLeft, ChevronRight, Plus, History, X, Send, Loader2, Circle,
  ListTodo, Eye, Undo2, Sparkles, Route, CircleHelp, Palmtree, CalendarRange,
  ListChecks, Maximize2, Search, Users, Wrench,
} from 'lucide-react'

/* ---------- agent avatar (chatShared.AgentAvatar) ---------- */

export function AgentAvatar({ className = 'size-9', iconSize = 18, connected }) {
  return (
    <div className={`relative grid ${className} shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-md shadow-violet-500/25`}>
      <Bot size={iconSize} />
      {connected !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white ${connected ? 'bg-emerald-500' : 'bg-ink-300'}`} />
      )}
    </div>
  )
}

/* ---------- item cards (ItemCard + typeMeta) ---------- */

const TYPE_META = {
  activity: { Icon: MapPin, chip: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-100 text-amber-600 ring-amber-200' },
  drive: { Icon: Car, chip: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-100 text-sky-600 ring-sky-200' },
  food: { Icon: UtensilsCrossed, chip: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-100 text-rose-600 ring-rose-200' },
  hotel: { Icon: BedDouble, chip: 'bg-violet-50 text-violet-700 ring-violet-600/20', dot: 'bg-violet-100 text-violet-600 ring-violet-200' },
  info: { Icon: Lightbulb, chip: 'bg-teal-50 text-teal-700 ring-teal-600/20', dot: 'bg-teal-100 text-teal-600 ring-teal-200' },
}

function Chip({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ${className}`}>
      {children}
    </span>
  )
}

const CARD_TONE = {
  info: 'border-teal-200 bg-teal-50/50',
  hotel: 'border-violet-200 bg-violet-50/40',
  drive: 'border-dashed border-ink-300 bg-ink-50/60',
}

function MockItem({ item, color, strings, isLast = false }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.activity
  return (
    <li className="group/item relative flex gap-2.5 sm:gap-3">
      <div className="flex w-8 shrink-0 flex-col items-center pt-1.5">
        <span
          style={item.stop ? { background: color } : undefined}
          className={`grid size-8 shrink-0 place-items-center rounded-full ring-1 ${
            item.stop ? 'font-display text-[13px] font-extrabold text-white shadow-sm ring-transparent' : meta.dot
          }`}
        >
          {item.stop ?? <meta.Icon size={15} strokeWidth={2.2} />}
        </span>
        {!isLast && <div className="mt-1 w-0.5 flex-1 rounded bg-ink-200" />}
      </div>

      <div className={`mb-2 min-w-0 flex-1 rounded-xl border bg-white p-2.5 shadow-sm sm:p-3 ${CARD_TONE[item.type] ?? 'border-ink-200'}`}>
        <div className="flex items-start gap-2">
          <span className="-ml-1 mt-0.5 shrink-0 rounded p-0.5 text-ink-300">
            <GripVertical size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              {item.time && (
                <Chip className="bg-ink-100 text-ink-700 ring-ink-500/15"><Clock size={11} /> {item.time}</Chip>
              )}
              <Chip className={meta.chip}><meta.Icon size={11} /> {strings.types[item.type]}</Chip>
              {item.dur && (
                <Chip className="bg-blue-50 text-blue-700 ring-blue-600/20"><Timer size={11} /> {item.dur}</Chip>
              )}
              {item.price && (
                <Chip className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">{item.price}</Chip>
              )}
              {item.must && (
                <Chip className="bg-amber-50 text-amber-700 ring-amber-500/30"><Star size={11} fill="currentColor" /> {strings.mustSee}</Chip>
              )}
            </div>

            <h4 className="text-[13.5px] font-semibold leading-snug text-ink-900">{item.title}</h4>
            {item.notes && <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{item.notes}</p>}

            {item.links && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {item.links.includes('map') && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                    <MapPinned size={11.5} /> {strings.map}
                  </span>
                )}
                {item.links.includes('gmaps') && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-600/20">
                    <Navigation size={11.5} /> {strings.gmaps}
                  </span>
                )}
                {item.links.includes('site') && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-ink-100 px-2 py-1 text-[11px] font-semibold text-ink-600 ring-1 ring-ink-500/10">
                    <ExternalLink size={11.5} /> {strings.site}
                  </span>
                )}
              </div>
            )}
          </div>

          {item.photo && (
            <img
              src={`${import.meta.env.BASE_URL}shots/${item.photo}`}
              alt=""
              loading="lazy"
              className="size-16 shrink-0 self-start rounded-lg object-cover ring-1 ring-ink-900/10"
            />
          )}
        </div>
      </div>
    </li>
  )
}

/* ---------- day card (DayCard header + items) ---------- */

export function MockDayCard({ day, strings, visibleItems }) {
  const items = visibleItems == null ? day.items : day.items.slice(0, visibleItems)
  return (
    <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
      <header className="flex select-none items-center gap-3 border-l-4 px-3 py-3 sm:px-4" style={{ borderLeftColor: day.color }}>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-base font-extrabold text-white shadow-sm" style={{ background: day.color }}>
          {day.n}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[14.5px] font-bold leading-snug text-ink-900">{day.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-500">
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] text-[10.5px] font-extrabold uppercase tracking-wide"
              style={{
                background: `color-mix(in srgb, ${day.color} 16%, white)`,
                color: `color-mix(in srgb, ${day.color} 55%, #1e293b)`,
              }}
            >
              <CalendarDays size={11} strokeWidth={2.5} /> {day.date}
            </span>
            <span className="inline-flex items-center gap-1 text-violet-600"><BedDouble size={12} /> {day.night}</span>
            <span className="inline-flex items-center gap-1 text-sky-600"><CarFront size={12} /> {day.drive}</span>
            <span>{day.stops}</span>
          </div>
        </div>
        <ChevronDown size={17} className="shrink-0 text-ink-400" />
      </header>
      <div className="px-3 pb-3 sm:px-4">
        <ol>
          {items.map((it, i) => (
            <MockItem key={it.title} item={it} color={day.color} strings={strings} isLast={i === items.length - 1} />
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------- chat pieces (ChatPanel / chatShared / PlanningStepper) ---------- */

export function ToolChip({ label, grouped = false, className = '' }) {
  return (
    <div className={`mb-2 flex ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-500 ring-1 ring-ink-500/10">
        <Wrench size={11} className="text-brand-500" /> {label}
        {grouped && <ChevronDown size={10} className="text-ink-400" />}
      </span>
    </div>
  )
}

export function PlanningCard({ title, count, steps, done, liveNote }) {
  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/95 shadow-sm">
      <div className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-600 text-white">
          {done ? <Check size={14} strokeWidth={3} /> : <Loader2 size={14} className="animate-spin" />}
        </span>
        <span className="min-w-0 flex-1 text-[12.5px] font-bold text-violet-900">
          {title}
          <span className="ml-1.5 font-semibold text-violet-500">{count}</span>
        </span>
        <ChevronDown size={14} className="shrink-0 text-violet-400" />
      </div>
      <ol className="flex flex-col gap-1 px-3.5 pb-3">
        {steps.map((s) => (
          <li key={s.label} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center">
              {s.status === 'done' ? (
                <Check size={13} strokeWidth={3} className="text-emerald-600" />
              ) : s.status === 'pending' ? (
                <Circle size={11} strokeWidth={2.5} className="text-violet-300" />
              ) : (
                <Loader2 size={13} className="animate-spin text-violet-500" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[12px] font-semibold leading-snug ${
                s.status === 'done' ? 'text-ink-500' : s.status === 'pending' ? 'text-ink-400' : 'text-ink-800'
              }`}>
                {s.label}
              </span>
              {s.detail && s.status === 'running' && (
                <span className="block truncate text-[10.5px] text-ink-400">{s.detail}</span>
              )}
            </span>
          </li>
        ))}
        {!done && liveNote && steps.some((s) => s.status === 'running') && (
          <li className="flex items-center gap-2.5 pt-0.5 text-[11px] font-medium text-violet-400">
            <ListTodo size={13} className="ml-0.5" /> {liveNote}
          </li>
        )}
      </ol>
    </div>
  )
}

export function UserBubble({ children }) {
  return (
    <div className="mb-3 flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 px-3.5 py-2 text-[13px] leading-relaxed text-white shadow-sm">
        {children}
      </div>
    </div>
  )
}

/* minimal **bold** renderer for the assistant's markdown snippets */
export function Md({ text, caret = false }) {
  const parts = text.split('**')
  return (
    <div className="mb-3 max-w-[95%] text-[13px] leading-relaxed text-ink-800">
      {parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>))}
      {caret && <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse rounded bg-brand-500 align-middle" />}
    </div>
  )
}

/* an image inside an assistant message, exactly as the chat's Markdown
   renders it (single-photo ImageGroup: rounded frame + alt label chip) */
export function MdImage({ src, alt }) {
  return (
    <div className="relative mb-2 mt-1 overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-900/10">
      <img
        src={`${import.meta.env.BASE_URL}shots/${src}`}
        alt={alt}
        loading="lazy"
        className="anim-fade-in h-44 w-full object-cover"
      />
      {alt && (
        <span className="absolute left-2 top-2 max-w-[80%] truncate rounded-md bg-ink-900/65 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
          {alt}
        </span>
      )}
    </div>
  )
}

/* a numbered day pin, replicating the app's .map-pin CSS marker */
export function MapPin2({ n, color, x, y, className = '' }) {
  return (
    <span className={`absolute z-10 ${className}`} style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)' }}>
      <span
        className="grid place-items-center"
        style={{
          width: 28, height: 28,
          borderRadius: '50% 50% 50% 5px',
          transform: 'rotate(-45deg)',
          background: color,
          border: '2.5px solid #fff',
          boxShadow: '0 2px 8px rgba(15, 23, 42, .35)',
        }}
      >
        <span className="font-display text-[12px] font-extrabold text-white" style={{ transform: 'rotate(45deg)' }}>{n}</span>
      </span>
    </span>
  )
}

export function ThinkingDots({ label }) {
  return (
    <div className="mt-1 mb-2 flex items-center gap-2 text-xs font-semibold text-ink-400">
      <span className="flex gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-brand-400" />
        <span className="size-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '150ms' }} />
        <span className="size-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '300ms' }} />
      </span>
      {label}
    </div>
  )
}

export function EditsBar({ text, show, undoAll }) {
  return (
    <div className="border-t border-amber-200 bg-amber-50">
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <p className="min-w-0 flex-1 text-[11.5px] font-semibold leading-snug text-amber-800">{text}</p>
        <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-amber-700 ring-1 ring-amber-300">
          <Eye size={12} /> {show}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-rose-600 ring-1 ring-rose-300">
          <Undo2 size={12} /> {undoAll}
        </span>
      </div>
    </div>
  )
}

/* the chat panel frame: header + scrollable body + composer */
export function ChatFrame({ strings, children, footer, className = '' }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-2xl ${className}`}>
      <div className="flex shrink-0 items-center gap-2.5 border-b border-ink-200 px-4 py-3">
        <AgentAvatar connected />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[14px] font-bold text-ink-900">Ulisse</h3>
          <p className="text-[11px] font-medium text-ink-400">{strings.role}</p>
          <p className="flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-ink-500">
            <span className="size-1.5 shrink-0 rounded-full bg-brand-500" /> {strings.model}
            <ChevronDown size={10} className="shrink-0 text-ink-400" />
          </p>
        </div>
        <span className="grid size-8 place-items-center rounded-lg text-ink-400"><History size={15} /></span>
        <span className="grid size-8 place-items-center rounded-lg text-ink-400"><Plus size={16} /></span>
        <span className="grid size-8 place-items-center rounded-lg text-ink-400"><X size={17} /></span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">{children}</div>

      {footer}

      <div className="shrink-0 border-t border-ink-200 p-3">
        <div className="flex items-end gap-2">
          <div className="min-h-10 w-full rounded-xl px-2 py-2.5 text-sm text-ink-300">{strings.placeholder}</div>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white opacity-40 shadow-none">
            <Send size={15} />
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------- question carousel (QuestionCard) ---------- */

export function QCard({ q, kicker, counter, backLabel, nextLabel, sendLabel, selected, allDone, segments }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-md shadow-violet-500/10">
      <div className="border-b border-violet-100 bg-violet-50/60 px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <CircleHelp size={15} className="shrink-0 text-violet-600" />
          <p className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">{kicker}</p>
          <span className="shrink-0 text-[11px] font-bold tabular-nums text-violet-500">{counter}</span>
        </div>
        <div className="mt-2 flex gap-1">
          {segments.map((s, i) => (
            <span key={i} className="flex-1 py-0">
              <span className={`block h-1 rounded-full transition-colors duration-300 ${
                s === 'active' ? 'bg-violet-600' : s === 'done' ? 'bg-violet-300' : 'bg-ink-200'
              }`} />
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <p className="px-0.5 pb-1 text-[13px] font-bold leading-snug text-ink-900">{q.question}</p>
        {q.options.map((o, i) => {
          const on = selected.includes(i)
          return (
            <div
              key={o.label}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                on ? 'border-violet-400 bg-violet-50' : 'border-ink-200'
              }`}
            >
              <span className={`mt-0.5 grid size-4 shrink-0 place-items-center border-[1.5px] transition ${
                q.kind === 'multi' ? 'rounded' : 'rounded-full'
              } ${on ? 'border-violet-500 bg-violet-500 text-white' : 'border-ink-300 text-transparent'}`}>
                <Check size={11} strokeWidth={3.5} />
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-bold text-ink-800">{o.label}</span>
                {o.description && <span className="block text-[11px] leading-snug text-ink-400">{o.description}</span>}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-ink-100 px-3 py-2.5">
        <span className="flex items-center gap-1 rounded-xl px-2.5 py-2 text-[12px] font-bold text-ink-500">
          <ChevronLeft size={14} /> {backLabel}
        </span>
        <div className="flex-1" />
        {allDone ? (
          <span className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-[12.5px] font-bold text-white shadow-md shadow-violet-600/25">
            <Send size={13} /> {sendLabel}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[12.5px] font-bold text-violet-700">
            {nextLabel} <ChevronRight size={14} />
          </span>
        )}
      </div>
    </div>
  )
}

/* ---------- hotel / restaurant pickers (QuestionCard pickers) ---------- */

export function PickerCard({ data, kind, active = -1, chosen = -1 }) {
  const HeaderIcon = kind === 'hotel' ? BedDouble : UtensilsCrossed
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-md shadow-violet-500/10">
      <div className="flex items-center gap-2.5 border-b border-violet-100 bg-violet-50/60 px-3.5 py-2.5">
        <HeaderIcon size={16} className="shrink-0 text-violet-600" />
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-violet-700">{data.kicker}</p>
          <p className="truncate text-[12.5px] font-bold leading-tight text-ink-900">
            {data.location}
            <span className="font-semibold text-ink-400"> · {data.range}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        {data.options.map((o, i) => (
          <PickerOption key={o.name} o={o} data={data} kind={kind} hovered={i === active} picked={i === chosen} />
        ))}
        <div className="mt-0.5 rounded-xl border border-dashed border-ink-300 px-3 py-2 text-center text-[12px] font-bold text-ink-500">
          {data.none}
        </div>
      </div>
    </div>
  )
}

function PickerOption({ o, data, kind, hovered, picked }) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition duration-300 ${
        picked
          ? 'border-violet-500 bg-violet-50 shadow-sm ring-2 ring-violet-400/30'
          : hovered
            ? 'border-violet-400 bg-violet-50/50 shadow-sm'
            : o.recommended
              ? 'border-violet-300 bg-violet-50/40'
              : 'border-ink-200'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-[13px] font-bold leading-tight text-ink-900">{o.name}</span>
          {o.recommended && (
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white">
              <Sparkles size={9} /> {data.topPick}
            </span>
          )}
        </div>
        {o.category && <p className="mt-0.5 text-[11px] font-semibold leading-snug text-ink-400">{o.category}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {kind === 'hotel' ? (
            <span className="grid h-[18px] min-w-[26px] place-items-center rounded-md rounded-bl-none bg-violet-600/90 px-1 text-[10.5px] font-bold leading-none text-white">
              {o.score}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 ring-1 ring-amber-200">
              <Star size={10.5} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold leading-none text-ink-800">{o.rating}</span>
              <span className="text-[10.5px] font-semibold leading-none text-ink-500">({o.reviews})</span>
            </span>
          )}
          {kind === 'hotel' && <span className="text-[11px] font-semibold text-ink-500">{o.reviews}</span>}
          <span className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-bold text-ink-600">
            <Route size={10} /> {o.detour}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10.5px] font-bold text-violet-600">
            <MapPin size={10} /> {data.mapLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10.5px] font-bold text-violet-600">
            {data.source} <ExternalLink size={10} />
          </span>
        </div>
        {o.note && <p className="mt-1 text-[11px] leading-snug text-ink-400">{o.note}</p>}
      </div>
      {kind === 'hotel' && (
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[15px] font-extrabold leading-tight text-ink-900">
            {o.price}
            <span className="text-[10.5px] font-bold text-ink-400">{data.perNight}</span>
          </span>
          <span className="text-[10.5px] font-semibold text-ink-400">{data.total(o.price)}</span>
          <span className={`mt-1 items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-[10.5px] font-bold text-white ${hovered || picked ? 'inline-flex' : 'hidden'}`}>
            <Check size={10} strokeWidth={3.5} /> {data.pickCta}
          </span>
        </div>
      )}
      {kind !== 'hotel' && (hovered || picked) && (
        <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-lg bg-violet-600 px-2 py-1 text-[10.5px] font-bold text-white">
          <Check size={10} strokeWidth={3.5} /> {data.pickCta}
        </span>
      )}
    </div>
  )
}

/* transcript record once a proposal is picked (HotelPickRecord) */
export function PickRecord({ data, kind, choice }) {
  const Icon = kind === 'hotel' ? BedDouble : UtensilsCrossed
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2">
      <p className="flex items-start gap-1.5 text-[11.5px] font-semibold leading-snug text-violet-900/70">
        <Icon size={12} className="mt-px shrink-0 text-violet-400" />
        {data.recordTitle}
        <span className="font-medium text-violet-900/50">· {data.range}</span>
      </p>
      <div className="mt-1.5 pl-[18px]">
        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-200">
          <Check size={11} strokeWidth={3} className="text-violet-500" />
          {choice.name}
          {kind === 'hotel' && <span className="font-medium text-ink-400">{choice.price}{data.perNight}</span>}
        </span>
      </div>
    </div>
  )
}

/* ---------- planner chrome (Header, tabs, map controls) ---------- */

export function MockAppHeader({ header }) {
  return (
    <header className="z-10 mx-3 mt-3 rounded-2xl border border-ink-200 bg-white shadow-lg">
      <div className="flex flex-nowrap items-center gap-2 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl text-ink-400"><ChevronLeft size={19} /></span>
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-rose-500 text-white shadow-md shadow-brand-500/25">
            <Palmtree size={21} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold text-ink-900">{header.title}</p>
            <p className="truncate text-xs text-ink-500">{header.subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {header.stats.map((r) => (
            <div key={r.label} className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5">
              <div className="leading-tight">
                <div className="whitespace-nowrap text-[12.5px] font-bold text-ink-800">{r.value}</div>
                <div className="text-[9.5px] font-medium uppercase tracking-wide text-ink-400">{r.label}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
            <div className="leading-tight">
              <div className="whitespace-nowrap text-[12.5px] font-bold text-emerald-700">{header.budget}</div>
              <div className="text-[9.5px] font-medium uppercase tracking-wide text-emerald-600/70">Budget</div>
            </div>
          </div>
          <span className="relative grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-600">
            <Bot size={18} />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <span className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30">
            <Plus size={16} strokeWidth={2.6} /> {header.addDay}
          </span>
        </div>
      </div>
    </header>
  )
}

export function MockTabs({ tabs }) {
  const ICONS = [CalendarRange, Sparkles, ListChecks]
  return (
    <nav className="flex items-center gap-1 border-b border-ink-200 bg-white px-4 pt-2">
      {tabs.map((label, i) => {
        const Icon = ICONS[i]
        return (
          <span
            key={label}
            className={`flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-semibold ${
              i === 0 ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500'
            }`}
          >
            <Icon size={16} strokeWidth={2.4} /> {label}
          </span>
        )
      })}
    </nav>
  )
}

function LegChip({ active, color, children }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full border bg-white/95 px-3 py-1.5 text-[11.5px] font-bold shadow-sm backdrop-blur ${
        active ? 'text-ink-900' : 'border-ink-200 text-ink-500'
      }`}
      style={active ? { borderColor: color, boxShadow: `0 0 0 1px ${color}` } : {}}
    >
      {children}
    </span>
  )
}

export function MapControls({ ui, colors }) {
  return (
    <>
      <div className="absolute left-3 right-[248px] top-3 z-10 flex flex-nowrap gap-1.5 overflow-hidden [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
        <LegChip active color="#334155">{ui.wholeTrip}</LegChip>
        {colors.map((c, i) => (
          <LegChip key={c}>
            <span className="size-2 shrink-0 rounded-full" style={{ background: c }} />
            {ui.dayShort(i + 1)}
          </LegChip>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
        <span className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-ink-700 shadow-lg backdrop-blur">
          <Maximize2 size={14} /> {ui.fit}
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-ink-700 shadow-lg backdrop-blur">
          <Users size={14} />
        </span>
      </div>
    </>
  )
}

export function SearchPill({ placeholder }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-44 items-center gap-2 overflow-hidden whitespace-nowrap rounded-xl border border-ink-200 bg-white/95 px-3 text-[12.5px] text-ink-400 shadow-lg backdrop-blur [mask-image:linear-gradient(to_right,black_calc(100%-16px),transparent)]">
        <Search size={14} className="shrink-0" /> {placeholder}
      </div>
      <span className="grid size-10 place-items-center rounded-xl bg-blue-500 text-white shadow-lg">
        <Navigation size={15} />
      </span>
    </div>
  )
}
