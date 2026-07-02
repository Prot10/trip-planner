import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet'
import {
  Bot, X, Send, Square, RotateCcw, Wrench, TriangleAlert, Undo2, MapPin, Trash2,
  Pencil, CalendarPlus, Search, Sparkles, ListChecks, Route, Settings2, Camera,
  ChevronDown, Eye, EyeOff, Crosshair, History, Globe, Plus, Check,
} from 'lucide-react'
import { useAgentChat, useChats } from '../agent/socket'
import { useTrip, useUI, activeTrip } from '../store'
import Markdown from './Markdown'

const TOOL_META = {
  get_trip: { Icon: Route, label: () => 'Lettura del viaggio' },
  get_route_info: { Icon: Route, label: () => 'Lettura percorso e km' },
  get_place_images: { Icon: Camera, label: () => 'Ricerca foto del luogo' },
  add_activity: { Icon: MapPin, label: (a) => `Aggiunta: ${a.title ?? 'attività'}` },
  update_activity: { Icon: Pencil, label: (a, r) => `Modifica: ${r?.title ?? a.title ?? 'attività'}` },
  remove_activity: { Icon: Trash2, label: (a, r) => `Rimozione: ${r?.removed ?? 'attività'}` },
  move_activity: { Icon: MapPin, label: (a, r) => `Spostamento: ${r?.title ?? 'attività'}` },
  add_day: { Icon: CalendarPlus, label: (a) => `Nuovo giorno: ${a.title ?? ''}` },
  update_day: { Icon: Pencil, label: (a) => `Modifica giorno ${a.day_number ?? ''}` },
  remove_day: { Icon: Trash2, label: (a) => `Eliminazione giorno ${a.day_number ?? ''}` },
  move_day: { Icon: CalendarPlus, label: (a) => `Spostamento giorno ${a.day_number ?? ''}` },
  set_trip_meta: { Icon: Settings2, label: () => 'Impostazioni viaggio' },
  checklist_add: { Icon: ListChecks, label: (a) => `Checklist: ${a.text ?? ''}` },
  checklist_toggle: { Icon: ListChecks, label: () => 'Checklist aggiornata' },
  checklist_remove: { Icon: ListChecks, label: () => 'Voce checklist rimossa' },
  search_places: { Icon: Search, label: (a) => `Ricerca luogo: ${a.query ?? ''}` },
  list_suggestions: { Icon: Sparkles, label: () => 'Lettura tappe consigliate' },
  toggle_suggestion: { Icon: Sparkles, label: (a, r) => r?.action === 'removed' ? `Consiglio rimosso: ${r.title}` : `Consiglio attivato: ${r?.title ?? ''}` },
  WebSearch: { Icon: Globe, label: (a) => `Ricerca web: ${a.query ?? ''}` },
  WebFetch: { Icon: Globe, label: () => 'Lettura pagina web' },
}

const MODELS = [
  { id: 'sonnet', label: 'Sonnet' },
  { id: 'opus', label: 'Opus' },
  { id: 'haiku', label: 'Haiku' },
]

const prettyModel = (m) => {
  if (!m) return null
  if (m === 'codex') return 'GPT (Codex)'
  if (m.includes('opus')) return 'Opus'
  if (m.includes('sonnet')) return 'Sonnet'
  if (m.includes('haiku')) return 'Haiku'
  return m
}

const EXAMPLES = [
  'Aggiungi una cena romantica a Monterey la sera del giorno 2',
  'Il giorno 4 è troppo pieno? Suggerisci cosa tagliare',
  'Trova una spiaggia poco affollata vicino al percorso del giorno 3',
  'Quanto sto spendendo di hotel? Dove posso risparmiare?',
]

export default function ChatPanel({ onClose }) {
  const {
    connected, thinking, messages, streamText, undoReady, edits, showEdits, model, modelChoice, engine,
    send, stop, newChat, undoAll, setShowEdits, setModelChoice, setEngine,
  } = useAgentChat()
  const [text, setText] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking, streamText, showEdits])

  const submit = () => {
    if (!text.trim()) return
    send(text)
    setText('')
  }

  const visibleEdits = edits.filter((e) => e.detail?.length || e.undo)

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-ink-200 px-4 py-3">
        <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-md shadow-violet-500/25">
          <Bot size={18} />
          <span
            className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white ${
              connected ? 'bg-emerald-500' : 'bg-ink-300'
            }`}
            title={connected ? 'Connesso' : 'Server non raggiungibile'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[14px] font-bold text-ink-900">Assistente di viaggio</h3>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-400">
            {/* engine switch */}
            <div className="flex overflow-hidden rounded-md ring-1 ring-ink-200">
              {['claude', 'codex'].map((e) => (
                <button
                  key={e}
                  onClick={() => setEngine(e)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition ${
                    engine === e ? 'bg-violet-600 text-white' : 'bg-white text-ink-400 hover:text-ink-600'
                  }`}
                >
                  {e === 'claude' ? 'Claude' : 'Codex'}
                </button>
              ))}
            </div>
            {engine === 'claude' && (
              <select
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value)}
                title="Modello (dal tuo abbonamento)"
                className="cursor-pointer appearance-none rounded bg-transparent font-bold text-violet-600 outline-none hover:text-violet-700"
              >
                {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            )}
            {model && <span className="truncate text-ink-300">in uso: {prettyModel(model)}</span>}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowHistory((v) => !v)}
            title="Conversazioni salvate"
            aria-label="Conversazioni salvate"
            className={`grid size-8 place-items-center rounded-lg transition ${showHistory ? 'bg-violet-50 text-violet-600' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700'}`}
          >
            <History size={15} />
          </button>
          {showHistory && <HistoryPopover onClose={() => setShowHistory(false)} />}
        </div>
        <button
          onClick={newChat}
          title="Nuova conversazione"
          aria-label="Nuova conversazione"
          className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <Plus size={16} />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Chiudi chat"
            className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* messages */}
      <div ref={scrollRef} className="nice-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !streamText && (
          <div className="mt-2">
            <p className="text-[13px] leading-relaxed text-ink-500">
              Chiedimi qualsiasi cosa sul viaggio: posso <b>aggiungere, spostare e modificare tappe</b>,
              cercare luoghi, foto e informazioni aggiornate sul web, e ottimizzare il percorso.
              Ogni modifica appare subito nell'itinerario e puoi rivederla o annullarla, anche singolarmente.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  disabled={!connected}
                  className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-left text-xs font-medium text-ink-600 transition hover:border-brand-300 hover:bg-brand-50/50 disabled:opacity-40"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => <Message key={m.id} m={m} />)}

        {streamText && (
          <div className="mb-3 max-w-[95%] text-[13px] leading-relaxed text-ink-800">
            <Markdown text={streamText} />
            <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse rounded bg-brand-500 align-middle" />
          </div>
        )}

        {thinking && !streamText && (
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-400">
            <span className="flex gap-1">
              <Dot delay="0ms" /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </span>
            sto lavorando…
          </div>
        )}
      </div>

      {/* per-turn edits: review + undo (all or one by one) */}
      {undoReady && visibleEdits.length > 0 && (
        <div className="anim-fade-up border-t border-amber-200 bg-amber-50">
          {showEdits && (
            <div className="nice-scroll max-h-72 overflow-y-auto border-b border-amber-200/70 px-3 py-2">
              {visibleEdits.map((e) => <EditRow key={e.id} edit={e} />)}
            </div>
          )}
          <div className="flex items-center gap-2 px-3.5 py-2.5">
            <p className="min-w-0 flex-1 text-[11.5px] font-semibold leading-snug text-amber-800">
              {visibleEdits.length === 1 ? '1 modifica' : `${visibleEdits.length} modifiche`} in questo turno
            </p>
            <button
              onClick={() => setShowEdits(!showEdits)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-amber-700 ring-1 ring-amber-300 transition hover:bg-amber-100"
            >
              {showEdits ? <EyeOff size={12} /> : <Eye size={12} />} {showEdits ? 'Nascondi' : 'Mostra'}
            </button>
            <button
              onClick={undoAll}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-rose-600 ring-1 ring-rose-300 transition hover:bg-rose-50"
            >
              <Undo2 size={12} /> Annulla tutto
            </button>
          </div>
        </div>
      )}

      {/* composer */}
      <div className="border-t border-ink-200 p-3">
        {!connected && (
          <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-[11.5px] font-semibold leading-snug text-rose-700">
            Server agente non raggiungibile: avvia l'app con <code className="font-mono">npm run dev</code>.
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
            }}
            rows={Math.min(4, Math.max(1, text.split('\n').length))}
            placeholder="Scrivi all'assistente…"
            disabled={!connected}
            className="max-h-32 min-h-10 w-full resize-none rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-400/20 disabled:opacity-50"
          />
          {thinking ? (
            <button
              onClick={stop}
              title="Interrompi"
              aria-label="Interrompi"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-white transition hover:bg-ink-700"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!connected || !text.trim()}
              title="Invia"
              aria-label="Invia"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- saved conversations ---------- */

function HistoryPopover({ onClose }) {
  const tripId = useTrip((s) => s.activeId)
  const chats = useChats((s) => s.byTrip[tripId] ?? [])
  const deleteChat = useChats((s) => s.deleteChat)
  const openChat = useAgentChat((s) => s.openChat)
  const currentId = useAgentChat((s) => s.chatId)
  const ref = useRef(null)

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const rel = (ts) => {
    const m = Math.round((Date.now() - ts) / 60000)
    if (m < 1) return 'adesso'
    if (m < 60) return `${m} min fa`
    const h = Math.round(m / 60)
    if (h < 24) return `${h} h fa`
    return `${Math.round(h / 24)} g fa`
  }

  return (
    <div ref={ref} className="anim-fade-up absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-2xl border border-ink-200 bg-white p-2 shadow-xl">
      <p className="px-2 pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-wider text-ink-400">
        Conversazioni di questo viaggio
      </p>
      {chats.length === 0 && (
        <p className="px-2 pb-2 text-xs text-ink-400">Ancora nessuna conversazione salvata.</p>
      )}
      <div className="nice-scroll max-h-72 overflow-y-auto">
        {chats.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-ink-50 ${
              c.id === currentId ? 'bg-violet-50' : ''
            }`}
          >
            <button onClick={() => { openChat(c); onClose() }} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-xs font-semibold text-ink-800">{c.title}</span>
              <span className="text-[10px] font-medium text-ink-400">
                {c.engine === 'codex' ? 'Codex' : 'Claude'} · {rel(c.updatedAt)}
              </span>
            </button>
            <button
              onClick={() => deleteChat(tripId, c.id)}
              aria-label="Elimina conversazione"
              className="grid size-6 shrink-0 place-items-center rounded-md text-ink-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- per-turn edit review ---------- */

function EditRow({ edit }) {
  const meta = TOOL_META[edit.name] ?? { Icon: Wrench, label: () => edit.name }
  const setFocusItem = useUI((s) => s.setFocusItem)
  const setTab = useUI((s) => s.setTab)
  const undoOne = useAgentChat((s) => s.undoOne)
  const [open, setOpen] = useState(false)

  const itemId = edit.result?.item_id
  const dayN = edit.result?.day_number ?? edit.args?.day_number
  const highlight = latLngOf(edit)

  return (
    <div className={`border-b border-amber-200/60 py-1.5 last:border-0 ${edit.reverted ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown size={11} className={`shrink-0 text-amber-500 transition-transform ${open ? '' : '-rotate-90'}`} />
          <meta.Icon size={12} className="shrink-0 text-amber-600" />
          <span className={`min-w-0 flex-1 truncate text-[11.5px] font-semibold text-amber-900 ${edit.reverted ? 'line-through' : ''}`}>
            {meta.label(edit.args, edit.result)}
            {dayN ? <span className="font-medium text-amber-700/70"> · Giorno {dayN}</span> : null}
          </span>
        </button>
        {itemId && !edit.reverted && (
          <button
            onClick={() => {
              if (window.innerWidth < 1024) setTab('itinerary')
              setFocusItem(itemId, '#f59e0b')
            }}
            title="Mostra nell'itinerario"
            aria-label="Mostra nell'itinerario"
            className="grid size-6 shrink-0 place-items-center rounded-md text-amber-600 transition hover:bg-amber-100"
          >
            <Crosshair size={12} />
          </button>
        )}
        {edit.reverted ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
            <Check size={10} /> annullata
          </span>
        ) : (
          edit.undo && (
            <button
              onClick={() => undoOne(edit.id)}
              title="Annulla solo questa modifica"
              className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-bold text-rose-600 transition hover:bg-rose-50"
            >
              <Undo2 size={11} /> annulla
            </button>
          )
        )}
      </div>

      {open && (
        <div className="anim-fade-in ml-6 mt-1.5">
          {edit.detail?.length > 0 && (
            <div className="mb-1.5 flex flex-col gap-0.5">
              {edit.detail.map((d, i) => (
                <div key={i} className="flex items-baseline gap-1.5 text-[11px]">
                  <span className="font-bold uppercase tracking-wide text-amber-700/70">{d.field}</span>
                  <span className="text-ink-500 line-through decoration-ink-300">{d.from}</span>
                  <span className="text-ink-400">→</span>
                  <span className="font-semibold text-ink-800">{d.to}</span>
                </div>
              ))}
            </div>
          )}
          {(dayN || highlight) && <MiniMap dayNumber={dayN} highlight={highlight} />}
        </div>
      )}
    </div>
  )
}

/* affected coordinates for the map preview, wherever they live */
function latLngOf(edit) {
  const r = edit.result ?? {}
  const a = edit.args ?? {}
  if (typeof r.lat === 'number') return [r.lat, r.lng]
  if (typeof a.lat === 'number') return [a.lat, a.lng]
  if (edit.undo?.item && typeof edit.undo.item.lat === 'number') return [edit.undo.item.lat, edit.undo.item.lng]
  return null
}

/* non-interactive route preview for one edit: the day's path + the touched stop */
function MiniMap({ dayNumber, highlight }) {
  const trip = useTrip((s) => activeTrip(s))
  const day = dayNumber ? trip?.days[dayNumber - 1] : null
  const coords = (day?.items ?? []).filter((i) => i.lat != null).map((i) => [i.lat, i.lng])
  const all = highlight ? [...coords, highlight] : coords
  if (all.length === 0) return null

  const bounds = all.length > 1
    ? all
    : [[all[0][0] - 0.05, all[0][1] - 0.05], [all[0][0] + 0.05, all[0][1] + 0.05]]

  return (
    <div className="pointer-events-none h-32 w-full overflow-hidden rounded-xl ring-1 ring-amber-200">
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [18, 18] }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" subdomains="abcd" />
        {coords.length > 1 && (
          <Polyline positions={coords} pathOptions={{ color: day?.color ?? '#f59e0b', weight: 3, opacity: 0.75 }} />
        )}
        {coords.map((c, i) => (
          <CircleMarker key={i} center={c} radius={3.5} pathOptions={{ color: '#fff', weight: 1.5, fillColor: day?.color ?? '#f59e0b', fillOpacity: 1 }} />
        ))}
        {highlight && (
          <CircleMarker
            center={highlight}
            radius={7}
            pathOptions={{ color: '#dc2626', weight: 3, fillColor: '#fecaca', fillOpacity: 0.9 }}
          />
        )}
      </MapContainer>
    </div>
  )
}

function Message({ m }) {
  if (m.role === 'user') {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 px-3.5 py-2 text-[13px] leading-relaxed text-white shadow-sm">
          {m.text}
        </div>
      </div>
    )
  }
  if (m.role === 'assistant') {
    return (
      <div className="mb-3 max-w-[95%] text-[13px] leading-relaxed text-ink-800">
        <Markdown text={m.text} />
      </div>
    )
  }
  if (m.role === 'tool') {
    const meta = TOOL_META[m.name] ?? { Icon: Wrench, label: () => m.name }
    return (
      <div className="mb-2 flex">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-500 ring-1 ring-ink-500/10">
          <meta.Icon size={11} className="text-brand-500" /> {meta.label(m.args ?? {}, null)}
        </span>
      </div>
    )
  }
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] leading-snug text-rose-700 ring-1 ring-rose-200">
      <TriangleAlert size={13} className="mt-0.5 shrink-0" />
      {m.text}
    </div>
  )
}

function Dot({ delay }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-brand-400"
      style={{ animationDelay: delay }}
    />
  )
}
