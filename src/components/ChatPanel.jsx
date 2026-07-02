import { useEffect, useRef, useState } from 'react'
import {
  Bot, X, Send, Square, RotateCcw, Wrench, TriangleAlert, Undo2, MapPin, Trash2,
  Pencil, CalendarPlus, Search, Sparkles, ListChecks, Route, Settings2, ChevronDown,
} from 'lucide-react'
import { useAgentChat } from '../agent/socket'

const TOOL_META = {
  get_trip: { Icon: Route, label: () => 'Lettura del viaggio' },
  get_route_info: { Icon: Route, label: () => 'Lettura percorso e km' },
  add_activity: { Icon: MapPin, label: (a) => `Aggiunta: ${a.title ?? 'attività'}` },
  update_activity: { Icon: Pencil, label: (a) => `Modifica attività${a.title ? `: ${a.title}` : ''}` },
  remove_activity: { Icon: Trash2, label: () => 'Eliminazione attività' },
  move_activity: { Icon: MapPin, label: () => 'Spostamento attività' },
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
  toggle_suggestion: { Icon: Sparkles, label: () => 'Tappa consigliata attivata/rimossa' },
}

const EXAMPLES = [
  'Aggiungi una cena romantica a Monterey la sera del giorno 2',
  'Il giorno 4 è troppo pieno? Suggerisci cosa tagliare',
  'Trova una spiaggia poco affollata vicino al percorso del giorno 3',
  'Quanto sto spendendo di hotel? Dove posso risparmiare?',
]

export default function ChatPanel({ onClose }) {
  const { connected, thinking, messages, undoReady, send, stop, reset, undo } = useAgentChat()
  const [text, setText] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const submit = () => {
    if (!text.trim()) return
    send(text)
    setText('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-ink-200 px-4 py-3">
        <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-md shadow-violet-500/25">
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
          <button
            className="flex items-center gap-1 text-[11px] font-semibold text-ink-400"
            title="Motore: Claude (abbonamento). Codex/ChatGPT in arrivo."
          >
            Claude <ChevronDown size={10} /> <span className="text-ink-300">· Codex presto</span>
          </button>
        </div>
        <button
          onClick={reset}
          title="Nuova conversazione"
          aria-label="Nuova conversazione"
          className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <RotateCcw size={15} />
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
        {messages.length === 0 && (
          <div className="mt-2">
            <p className="text-[13px] leading-relaxed text-ink-500">
              Chiedimi qualsiasi cosa sul viaggio: posso <b>aggiungere, spostare e modificare tappe</b>,
              cercare luoghi, attivare i consigli e ottimizzare il percorso. Ogni modifica appare
              subito nell'itinerario e puoi annullarla.
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

        {thinking && (
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-400">
            <span className="flex gap-1">
              <Dot delay="0ms" /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </span>
            sto lavorando…
          </div>
        )}
      </div>

      {/* undo bar */}
      {undoReady && (
        <div className="anim-fade-up flex items-center gap-2.5 border-t border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="min-w-0 flex-1 text-[11.5px] font-semibold leading-snug text-amber-800">
            L'assistente ha modificato l'itinerario in questo turno.
          </p>
          <button
            onClick={undo}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-amber-700 ring-1 ring-amber-300 transition hover:bg-amber-100"
          >
            <Undo2 size={12} /> Annulla modifiche
          </button>
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
      <div className="mb-3 max-w-[92%] whitespace-pre-wrap text-[13px] leading-relaxed text-ink-800">
        {m.text}
      </div>
    )
  }
  if (m.role === 'tool') {
    const meta = TOOL_META[m.name] ?? { Icon: Wrench, label: () => m.name }
    return (
      <div className="mb-2 flex">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-500 ring-1 ring-ink-500/10">
          <meta.Icon size={11} className="text-brand-500" /> {meta.label(m.args ?? {})}
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
