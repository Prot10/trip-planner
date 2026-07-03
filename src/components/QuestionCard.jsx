import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Send, CircleHelp } from 'lucide-react'
import { useAgentChat } from '../agent/socket'

/* Interactive card for the agent's ask_user tool: single choice, multiple
   choice or open answer. Answering resolves the agent's blocked tool call. */
export default function QuestionCard() {
  const q = useAgentChat((s) => s.pendingQuestion)
  const answer = useAgentChat((s) => s.answerQuestion)
  if (!q) return null
  /* keyed remount: selections and typed text must never leak into the next question */
  return <QuestionCardInner key={q.question} q={q} answer={answer} />
}

function QuestionCardInner({ q, answer }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState([])
  const [other, setOther] = useState('')

  const submitMulti = () => {
    const all = [...selected, ...(other.trim() ? [other.trim()] : [])]
    if (all.length) answer(all)
  }
  const submitOther = () => {
    if (other.trim()) answer(other.trim())
  }

  return (
    <div className="anim-fade-up mb-3 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-md shadow-violet-500/10">
      <div className="flex items-start gap-2.5 border-b border-violet-100 bg-violet-50/60 px-3.5 py-2.5">
        <CircleHelp size={16} className="mt-0.5 shrink-0 text-violet-600" />
        <p className="text-[13px] font-bold leading-snug text-ink-900">{q.question}</p>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        {/* single: click = answer */}
        {q.kind === 'single' && q.options.map((o) => (
          <button
            key={o.label}
            onClick={() => answer(o.label)}
            className="rounded-xl border border-ink-200 px-3 py-2 text-left transition hover:border-violet-400 hover:bg-violet-50/50"
          >
            <span className="block text-[12.5px] font-bold text-ink-800">{o.label}</span>
            {o.description && <span className="block text-[11px] leading-snug text-ink-400">{o.description}</span>}
          </button>
        ))}

        {/* multi: toggle + confirm */}
        {q.kind === 'multi' && (
          <>
            {q.options.map((o) => {
              const on = selected.includes(o.label)
              return (
                <button
                  key={o.label}
                  onClick={() => setSelected((s) => (on ? s.filter((x) => x !== o.label) : [...s, o.label]))}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                    on ? 'border-violet-400 bg-violet-50' : 'border-ink-200 hover:border-ink-300'
                  }`}
                >
                  <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border-[1.5px] transition ${
                    on ? 'border-violet-500 bg-violet-500 text-white' : 'border-ink-300 text-transparent'
                  }`}>
                    <Check size={11} strokeWidth={3.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-bold text-ink-800">{o.label}</span>
                    {o.description && <span className="block text-[11px] leading-snug text-ink-400">{o.description}</span>}
                  </span>
                </button>
              )
            })}
          </>
        )}

        {/* free text: open kind, or the "other" escape hatch */}
        {(q.kind === 'open' || q.allowOther) && (
          <div className="mt-0.5 flex items-end gap-2">
            <textarea
              value={other}
              onChange={(e) => setOther(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  q.kind === 'multi' ? submitMulti() : submitOther()
                }
              }}
              rows={Math.min(3, Math.max(1, other.split('\n').length))}
              placeholder={q.kind === 'open' ? t('question.openPlaceholder') : t('question.otherPlaceholder')}
              autoFocus={q.kind === 'open'}
              className="min-h-9 w-full resize-none rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-[13px] text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-400/20"
            />
            {q.kind !== 'multi' && (
              <button
                onClick={submitOther}
                disabled={!other.trim()}
                aria-label={t('question.send')}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        )}

        {q.kind === 'multi' && (
          <button
            onClick={submitMulti}
            disabled={selected.length === 0 && !other.trim()}
            className="mt-1 rounded-xl bg-violet-600 py-2 text-[12.5px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            {t('question.confirm')} {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        )}
      </div>
    </div>
  )
}

/* transcript record of an answered question: question + chosen answers, one block */
export function QARecord({ m }) {
  const answers = m.answers ?? (m.text ? m.text.split(' · ') : [])
  return (
    <div className="mb-2.5 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2">
      <p className="flex items-start gap-1.5 text-[11.5px] font-semibold leading-snug text-violet-900/70">
        <CircleHelp size={12} className="mt-px shrink-0 text-violet-400" />
        {m.question}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5 pl-[18px]">
        {answers.map((a, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[12px] font-semibold text-violet-800 ring-1 ring-violet-200">
            <Check size={11} strokeWidth={3} className="text-violet-500" />
            {a}
          </span>
        ))}
      </div>
    </div>
  )
}
