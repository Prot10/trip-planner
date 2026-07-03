import { useEffect, useRef, useState } from 'react'
import {
  Send, Square, ChevronLeft, Sparkles, TriangleAlert, NotebookPen, X,
} from 'lucide-react'
import { useAgentChat } from '../agent/socket'
import { useTrip, activeTrip } from '../store'
import Markdown from './Markdown'
import PlanningStepper from './PlanningStepper'
import QuestionCard, { QARecord } from './QuestionCard'
import { groupMessages, ToolChipGroup, SetupCard, ModelPicker, AgentAvatar } from './chatShared'

const STARTERS = [
  'Un weekend romantico a Parigi a fine settembre, senza auto',
  'Road trip di 10 giorni in Islanda ad agosto, natura e fotografia',
  'Una settimana in Giappone tra Tokyo e Kyoto coi mezzi pubblici',
  '5 giorni in Sicilia con bambini, mare e buon cibo',
]

/* Full-screen chat: a new trip can only be born through Marco Polo's interview */
export default function InterviewView() {
  const {
    connected, thinking, messages, streamText, pendingQuestion,
    send, stop,
  } = useAgentChat()
  const closeTrip = useTrip((s) => s.closeTrip)
  const setPhase = useTrip((s) => s.setPhase)
  const notes = useTrip((s) => activeTrip(s)?.notes ?? '')
  const [text, setText] = useState('')
  const [showNotesMobile, setShowNotesMobile] = useState(false)
  const scrollRef = useRef(null)

  const empty = messages.length === 0 && !streamText

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamText, thinking, pendingQuestion])

  const submit = () => {
    if (!text.trim()) return
    send(text)
    setText('')
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-violet-50 via-ink-50 to-brand-50/40">
      {/* minimal top bar */}
      <div className="z-10 flex items-center gap-2 px-4 py-3">
        <button
          onClick={closeTrip}
          className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-ink-500 transition hover:bg-white/70 hover:text-ink-800"
        >
          <ChevronLeft size={16} /> I miei viaggi
        </button>
        <div className="ml-auto flex items-center gap-2">
          {notes && (
            <button
              onClick={() => setShowNotesMobile((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-bold text-violet-600 transition hover:bg-white/70 xl:hidden"
            >
              <NotebookPen size={14} /> Taccuino
            </button>
          )}
          <div className="rounded-xl bg-white/70 px-1 py-0.5 backdrop-blur">
            <ModelPicker />
          </div>
        </div>
      </div>

      {/* conversation + notebook side by side on xl */}
      <div className="relative z-0 min-h-0 flex-1">
        <div ref={scrollRef} className="nice-scroll h-full overflow-y-auto px-4">
          <div className="mx-auto flex max-w-2xl flex-col pb-40">
            {/* hero, fades away after the first message */}
            <div
              className={`text-center transition-all duration-700 ${
                empty ? 'mt-[7vh] opacity-100' : 'mt-4 max-h-0 scale-95 overflow-hidden opacity-0'
              }`}
            >
              <div className="mx-auto w-fit"><AgentAvatar className="size-16" iconSize={30} /></div>
              <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
                Dove andiamo?
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                Sono <b>Marco Polo</b>, il tuo agente di viaggio. Raccontami cosa hai in mente:
                ti farò una domanda alla volta prendendo appunti, poi <b>costruirò l'itinerario
                completo per te</b> — lo vedrai nascere in tempo reale.
              </p>

              {connected ? (
                <div className="mx-auto mt-6 grid max-w-lg gap-2">
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
                <div className="mx-auto mt-6 max-w-md text-left">
                  <SetupCard engine="claude" />
                </div>
              )}
            </div>

            <div className={empty ? '' : 'pt-2'}>
              <PlanningStepper />
              {groupMessages(messages).map((m) => <Bubble key={m.id} m={m} />)}
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

        {/* Marco Polo's live notebook (desktop) */}
        <div className="pointer-events-none absolute inset-y-2 right-4 hidden w-72 items-start xl:flex">
          <NotebookCard notes={notes} />
        </div>
        {/* mobile notebook sheet */}
        {showNotesMobile && notes && (
          <div className="absolute inset-x-3 top-1 z-20 xl:hidden">
            <NotebookCard notes={notes} onClose={() => setShowNotesMobile(false)} />
          </div>
        )}
      </div>

      {/* composer: centered on the empty hero, glides to the bottom afterwards */}
      <div
        className={`pointer-events-none absolute inset-x-0 z-10 transition-all duration-700 ease-in-out ${
          empty ? 'bottom-[38vh]' : 'bottom-0'
        }`}
      >
        <div className="pointer-events-auto mx-auto max-w-2xl px-4 pb-4">
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
            L'itinerario si crea solo conversando con Marco Polo ·{' '}
            <button onClick={() => setPhase('active')} className="pointer-events-auto font-semibold text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-700">
              oppure crea manualmente
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

/* the agent's notebook, filling in live while it asks questions */
function NotebookCard({ notes, onClose }) {
  const flash = useAgentChat((s) => s.notebookFlash)
  const [highlight, setHighlight] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    setHighlight(true)
    const t = setTimeout(() => setHighlight(false), 1200)
    return () => clearTimeout(t)
  }, [flash])

  if (!notes) {
    return (
      <div className="pointer-events-auto mt-10 w-full rounded-2xl border border-dashed border-violet-200 bg-white/60 p-4 text-center backdrop-blur">
        <NotebookPen size={18} className="mx-auto text-violet-300" />
        <p className="mt-2 text-[11.5px] font-semibold text-ink-400">
          Il taccuino di Marco Polo si compilerà qui, risposta dopo risposta
        </p>
      </div>
    )
  }

  return (
    <div
      className={`pointer-events-auto mt-10 flex max-h-[75vh] w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-xl transition-all duration-500 ${
        highlight ? 'border-violet-400 shadow-violet-500/25 -rotate-1' : 'border-ink-200 rotate-0'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-ink-100 bg-gradient-to-r from-violet-50 to-brand-50/60 px-3.5 py-2.5">
        <NotebookPen size={14} className={`text-violet-600 transition-transform ${highlight ? 'animate-bounce' : ''}`} />
        <p className="flex-1 text-[12px] font-bold text-ink-800">Il taccuino di Marco Polo</p>
        {highlight && <span className="text-[10px] font-bold uppercase tracking-wide text-violet-500">sta scrivendo…</span>}
        {onClose && (
          <button onClick={onClose} aria-label="Chiudi taccuino" className="grid size-6 place-items-center rounded text-ink-400 hover:bg-white">
            <X size={13} />
          </button>
        )}
      </div>
      <div key={flash} className="nice-scroll anim-fade-in min-h-0 flex-1 overflow-y-auto px-3.5 py-3 text-[12px] leading-relaxed text-ink-700">
        <Markdown text={notes} />
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
  if (m.role === 'setup') return <SetupCard engine={m.engine} error={m.text} />
  if (m.role === 'toolgroup') return <ToolChipGroup group={m} />
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] leading-snug text-rose-700 ring-1 ring-rose-200">
      <TriangleAlert size={13} className="mt-0.5 shrink-0" />
      {m.text}
    </div>
  )
}
