import { useEffect, useRef, useState } from 'react'
import {
  Bot, Send, Square, ChevronLeft, Sparkles, TerminalSquare, TriangleAlert, Wrench,
} from 'lucide-react'
import { useAgentChat } from '../agent/socket'
import { useTrip } from '../store'
import Markdown from './Markdown'
import PlanningStepper from './PlanningStepper'
import QuestionCard, { QARecord } from './QuestionCard'

const STARTERS = [
  'Un weekend romantico a Parigi a fine settembre, senza auto',
  'Road trip di 10 giorni in Islanda ad agosto, natura e fotografia',
  'Una settimana in Giappone tra Tokyo e Kyoto coi mezzi pubblici',
  '5 giorni in Sicilia con bambini, mare e buon cibo',
]

/* Full-screen chat: a new trip can only be born through the agent interview */
export default function InterviewView() {
  const {
    connected, thinking, messages, streamText, engine, modelChoice, pendingQuestion,
    send, stop, setEngine, setModelChoice,
  } = useAgentChat()
  const closeTrip = useTrip((s) => s.closeTrip)
  const setPhase = useTrip((s) => s.setPhase)
  const [text, setText] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamText, thinking, pendingQuestion])

  const submit = () => {
    if (!text.trim()) return
    send(text)
    setText('')
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-violet-50 via-ink-50 to-brand-50/40">
      {/* minimal top bar */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={closeTrip}
          className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-ink-500 transition hover:bg-white/70 hover:text-ink-800"
        >
          <ChevronLeft size={16} /> I miei viaggi
        </button>
        <div className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-ink-400">
          <div className="flex overflow-hidden rounded-lg ring-1 ring-ink-200">
            {['claude', 'codex'].map((e) => (
              <button
                key={e}
                onClick={() => setEngine(e)}
                className={`px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide transition ${
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
              className="cursor-pointer appearance-none rounded bg-transparent font-bold text-violet-600 outline-none"
            >
              <option value="sonnet">Sonnet</option>
              <option value="opus">Opus</option>
              <option value="haiku">Haiku</option>
            </select>
          )}
        </div>
      </div>

      {/* conversation */}
      <div ref={scrollRef} className="nice-scroll min-h-0 flex-1 overflow-y-auto px-4">
        <div className="mx-auto flex max-w-2xl flex-col pb-6">
          {messages.length === 0 && !streamText && (
            <div className="mt-[8vh] text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-xl shadow-violet-500/30">
                <Bot size={30} />
              </div>
              <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
                Dove andiamo?
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                Raccontami il viaggio che hai in mente: ti farò qualche domanda per capire
                stile, tempi e mezzi, poi <b>costruirò l'itinerario completo per te</b> —
                lo vedrai nascere in tempo reale.
              </p>

              {connected ? (
                <div className="mx-auto mt-7 grid max-w-lg gap-2">
                  {STARTERS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => send(ex)}
                      className="rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-left text-[13px] font-medium text-ink-600 shadow-sm backdrop-blur transition hover:border-violet-300 hover:bg-white hover:shadow-md"
                    >
                      <Sparkles size={12} className="mr-1.5 inline text-violet-500" />
                      {ex}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mx-auto mt-7 max-w-md rounded-2xl border border-ink-200 bg-white/90 p-4 text-left shadow-sm">
                  <p className="flex items-center gap-2 text-[13px] font-bold text-ink-800">
                    <TerminalSquare size={15} className="text-violet-500" /> Assistente non attivo
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-ink-500">
                    <li>Avvia l'app con <code className="rounded bg-ink-100 px-1 font-mono">npm run dev</code> (parte anche il server agente)</li>
                    <li>Per Claude: accedi una volta con <code className="rounded bg-ink-100 px-1 font-mono">claude</code> → <code className="rounded bg-ink-100 px-1 font-mono">/login</code></li>
                    <li>Per Codex: <code className="rounded bg-ink-100 px-1 font-mono">codex login</code> col tuo account ChatGPT</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <PlanningStepper />
            {messages.map((m) => <Bubble key={m.id} m={m} />)}
            {streamText && (
              <div className="mb-3 max-w-[95%] text-[13.5px] leading-relaxed text-ink-800">
                <Markdown text={streamText} />
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse rounded bg-violet-500 align-middle" />
              </div>
            )}
            <QuestionCard />
            {thinking && !streamText && !pendingQuestion && (
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-400">
                <span className="flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-violet-400" />
                  <span className="size-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '150ms' }} />
                  <span className="size-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '300ms' }} />
                </span>
                sto pensando…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* composer */}
      <div className="px-4 pb-4 pt-2">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-lg">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
              }}
              rows={Math.min(4, Math.max(1, text.split('\n').length))}
              placeholder={pendingQuestion ? 'Rispondi alla domanda qui sopra' : connected ? 'Descrivi il viaggio che sogni…' : 'Assistente non connesso'}
              disabled={!connected || !!pendingQuestion}
              className="max-h-32 min-h-10 w-full resize-none bg-transparent px-2 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-300 disabled:opacity-50"
            />
            {thinking ? (
              <button
                onClick={stop}
                aria-label="Interrompi"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-white transition hover:bg-ink-700"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!connected || !text.trim()}
                aria-label="Invia"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700 active:scale-95 disabled:opacity-40 disabled:shadow-none"
              >
                <Send size={15} />
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-400">
            L'itinerario si crea solo conversando con l'assistente ·{' '}
            <button onClick={() => setPhase('active')} className="font-semibold text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-700">
              oppure crea manualmente
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Bubble({ m }) {
  if (m.role === 'user') {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-violet-600 px-4 py-2.5 text-[13.5px] leading-relaxed text-white shadow-sm">
          {m.text}
        </div>
      </div>
    )
  }
  if (m.role === 'assistant') {
    return (
      <div className="mb-3 max-w-[95%] text-[13.5px] leading-relaxed text-ink-800">
        <Markdown text={m.text} />
      </div>
    )
  }
  if (m.role === 'qa') return <QARecord m={m} />
  if (m.role === 'tool') {
    return (
      <div className="mb-2 flex">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-ink-500 ring-1 ring-ink-200">
          <Wrench size={11} className="text-violet-500" /> {m.name}
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
