import { useEffect, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import {
  Send, Square, ChevronLeft, ChevronRight, TriangleAlert, NotebookPen, X,
  Landmark, Mountain, Train, Sun,
} from 'lucide-react'
import { useAgentChat } from '../agent/socket'
import { useTrip, activeTrip } from '../store'
import { demoPrompt } from '../demo/prefill'
import Markdown from './Markdown'
import PlanningStepper from './PlanningStepper'
import QuestionCard, { QARecord } from './QuestionCard'
import { groupMessages, ToolChipGroup, SetupCard, ModelPicker, AgentAvatar } from './chatShared'
import LanguageSwitcher from './LanguageSwitcher'

const DEMO = import.meta.env.VITE_DEMO === '1'

/* Full-screen chat: a new trip can only be born through Ulisse's interview */
export default function InterviewView() {
  const { t, i18n } = useTranslation()
  const {
    connected, thinking, messages, streamText, pendingQuestion,
    send, stop,
  } = useAgentChat()
  const closeTrip = useTrip((s) => s.closeTrip)
  const setPhase = useTrip((s) => s.setPhase)
  const notes = useTrip((s) => activeTrip(s)?.notes ?? '')
  const currency = useTrip((s) => activeTrip(s)?.currency ?? null)
  const setCurrency = useTrip((s) => s.setCurrency)
  const [currencyNudge, setCurrencyNudge] = useState(false)
  const [text, setText] = useState('')
  const [showNotesMobile, setShowNotesMobile] = useState(false)
  const scrollRef = useRef(null)

  const empty = messages.length === 0 && !streamText

  /* demo: the conversation starts ready-made — Iceland prompt already in the
     composer, EUR already chosen; the visitor only has to hit send */
  useEffect(() => {
    if (!DEMO || !empty) return
    setText(demoPrompt(i18n.language))
    if (!currency) setCurrency('EUR')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, empty])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamText, thinking, pendingQuestion])

  const needCurrency = !currency && empty
  const nudgeCurrency = () => {
    setCurrencyNudge(true)
    setTimeout(() => setCurrencyNudge(false), 1200)
  }
  const submit = () => {
    if (!text.trim()) return
    if (needCurrency) { nudgeCurrency(); return }
    send(text)
    setText('')
  }
  const sendIdea = (idea) => {
    if (needCurrency) { nudgeCurrency(); return }
    send(idea.send)
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-violet-50 via-ink-50 to-brand-50/40">
      {/* minimal top bar */}
      <div className="z-10 flex items-center gap-2 px-4 py-3">
        <button
          onClick={closeTrip}
          className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-ink-500 transition hover:bg-white/70 hover:text-ink-800"
        >
          <ChevronLeft size={16} /> {t('dashboard.title')}
        </button>
        <div className="ml-auto flex items-center gap-2">
          {notes && (
            <button
              onClick={() => setShowNotesMobile((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-bold text-violet-600 transition hover:bg-white/70 xl:hidden"
            >
              <NotebookPen size={14} /> {t('interview.notebook')}
            </button>
          )}
        </div>
      </div>

      {/* conversation + notebook side by side on xl */}
      <div className="relative z-0 min-h-0 flex-1">
        <div ref={scrollRef} className="nice-scroll h-full overflow-y-auto px-4">
          <div className="mx-auto flex min-h-full max-w-2xl flex-col">
            {/* hero, fades away after the first message */}
            <div
              className={`text-center transition-all duration-700 ${
                empty ? 'mt-[6vh] opacity-100' : 'mt-0 max-h-0 scale-95 overflow-hidden opacity-0'
              }`}
            >
              <div className="mx-auto w-fit"><AgentAvatar className="size-16" iconSize={30} /></div>
              <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
                {t('interview.heroTitle')}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                <Trans i18nKey="interview.heroIntro" components={{ b: <b /> }} />
              </p>
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
                  {t('interview.thinking')}
                </div>
              )}
            </div>

            {/* trip ideas: above the composer, as rich cards (hidden in the
                demo, where the prompt arrives pre-written) */}
            {!DEMO && connected && (
              <div
                className={`transition-all duration-500 ${
                  empty ? 'max-h-[420px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'
                }`}
              >
                <IdeaCards onPick={sendIdea} />
              </div>
            )}

            {/* pushes the composer to the bottom once the conversation starts */}
            <div className={`transition-[flex-grow] duration-700 ease-in-out ${empty ? 'grow-0' : 'grow'}`} />

            {/* composer: in the flow on the empty hero (it can never cover
                anything), docked to the bottom while chatting */}
            <div className={`z-10 pt-3 ${empty ? '' : 'sticky bottom-0'}`}>
              <Composer
                text={text} setText={setText} submit={submit} stop={stop}
                connected={connected} thinking={thinking} pendingQuestion={pendingQuestion}
                needCurrency={needCurrency} currency={currency} setCurrency={setCurrency}
                currencyNudge={currencyNudge} demoLocked={DEMO && empty}
              />
              <p className="pb-2 pt-2 text-center text-[11px] text-ink-400">
                {t('interview.footerHint')}
                {!DEMO && (
                  <>
                    {' · '}
                    <button onClick={() => setPhase('active')} className="font-semibold text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-700">
                      {t('interview.orManually')}
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* sign-in card when no engine is connected yet */}
            {!connected && (
              <div className={`transition-all duration-500 ${empty ? 'max-h-[480px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                <div className="mx-auto max-w-md pt-1 text-left">
                  <SetupCard engine="claude" />
                </div>
              </div>
            )}
            <div className="shrink-0 pb-4" />
          </div>
        </div>

        {/* Ulisse's live notebook (desktop) */}
        <div className="pointer-events-none absolute inset-y-2 right-4 hidden w-[clamp(19rem,24vw,28rem)] items-start xl:flex">
          <NotebookCard notes={notes} />
        </div>
        {/* mobile notebook sheet */}
        {showNotesMobile && notes && (
          <div className="absolute inset-x-3 top-1 z-20 xl:hidden">
            <NotebookCard notes={notes} onClose={() => setShowNotesMobile(false)} />
          </div>
        )}
      </div>

    </div>
  )
}

/* destination ideas as rich cards, above the composer */
const IDEA_VISUALS = [
  { Icon: Landmark, tint: 'from-rose-400 to-pink-500' },
  { Icon: Mountain, tint: 'from-sky-400 to-cyan-500' },
  { Icon: Train, tint: 'from-violet-400 to-fuchsia-500' },
  { Icon: Sun, tint: 'from-amber-400 to-orange-500' },
]

function IdeaCards({ onPick }) {
  const { t } = useTranslation()
  const ideas = t('interview.ideas', { returnObjects: true })
  return (
    <div className="pt-6">
      <p className="text-center text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-400">
        {t('interview.ideasKicker')}
      </p>
      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
        {ideas.map((idea, i) => {
          const { Icon, tint } = IDEA_VISUALS[i % IDEA_VISUALS.length]
          return (
            <button
              key={idea.t}
              onClick={() => onPick(idea)}
              className="group flex items-center gap-3 rounded-2xl border border-ink-200 bg-white/80 p-3 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white hover:shadow-md"
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tint} text-white shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}>
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[13px] font-bold text-ink-900">{idea.t}</span>
                <span className="block truncate text-[11.5px] text-ink-500">{idea.d}</span>
              </span>
              <ChevronRight size={15} className="shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* the input box: textarea + send/stop, currency pills, engine/model, language.
   demoLocked = demo build, first message: the prompt is pre-written and the
   only interaction is hitting send. */
function Composer({
  text, setText, submit, stop, connected, thinking, pendingQuestion,
  needCurrency, currency, setCurrency, currencyNudge, demoLocked,
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-2 shadow-lg">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
          }}
          rows={Math.min(4, Math.max(text.split('\n').length, Math.ceil(text.length / 70), 1))}
          placeholder={pendingQuestion ? t('interview.placeholderAnswer') : !connected ? t('interview.placeholderOffline') : needCurrency ? t('interview.placeholderCurrency') : t('interview.placeholder')}
          disabled={!connected || !!pendingQuestion}
          readOnly={demoLocked}
          className="max-h-32 min-h-10 w-full resize-none bg-transparent px-2 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-300 disabled:opacity-50"
        />
        {thinking ? (
          <button
            onClick={stop}
            aria-label={t('interview.stop')}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-white transition hover:bg-ink-700"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!connected || !text.trim()}
            aria-label={t('interview.send')}
            className={`grid size-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700 active:scale-95 disabled:opacity-40 disabled:shadow-none ${
              demoLocked && text.trim() ? 'animate-pulse ring-4 ring-violet-300/60' : ''
            }`}
          >
            <Send size={15} />
          </button>
        )}
      </div>
      {/* currency (required before the first message) + engine/model, inside
          the composer — one flex row that compacts instead of overlapping */}
      <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-ink-100 pt-1.5">
        {demoLocked ? (
          <span className="shrink-0 rounded-lg bg-violet-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm">
            {t('interview.currencyEUR')}
          </span>
        ) : (
          <div
            className={`flex shrink-0 items-center gap-1 rounded-xl p-0.5 transition ${
              currencyNudge ? 'animate-bounce bg-rose-50 ring-2 ring-rose-300' : needCurrency ? 'bg-violet-50 ring-1 ring-violet-200' : ''
            }`}
          >
            {[['EUR', t('interview.currencyEUR')], ['USD', t('interview.currencyUSD')]].map(([code, label]) => (
              <button
                key={code}
                onClick={() => setCurrency(code)}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                  currency === code ? 'bg-violet-600 text-white shadow-sm' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="min-w-0">
          <ModelPicker up />
        </div>
        <div className="shrink-0">
          <LanguageSwitcher compact up />
        </div>
      </div>
    </div>
  )
}

/* the agent's notebook, filling in live while it asks questions */
function NotebookCard({ notes, onClose }) {
  const { t } = useTranslation()
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
          {t('interview.notebookEmpty')}
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
        <p className="flex-1 text-[12px] font-bold text-ink-800">{t('interview.notebookTitle')}</p>
        {highlight && <span className="text-[10px] font-bold uppercase tracking-wide text-violet-500">{t('interview.writing')}</span>}
        {onClose && (
          <button onClick={onClose} aria-label={t('interview.notebookClose')} className="grid size-6 place-items-center rounded text-ink-400 hover:bg-white">
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
