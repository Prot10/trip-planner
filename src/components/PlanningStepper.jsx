import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Check, TriangleAlert, ListTodo, ChevronDown, Circle } from 'lucide-react'
import { useAgentChat } from '../agent/socket'

/* Live progress of the agent's planning work, driven by report_progress */
export default function PlanningStepper() {
  const { t } = useTranslation()
  const progress = useAgentChat((s) => s.progress)
  const thinking = useAgentChat((s) => s.thinking)
  const [collapsed, setCollapsed] = useState(false)

  if (!progress.length) return null
  const doneCount = progress.filter((p) => p.status === 'done').length
  const allDone = !thinking

  /* sticky: the todo-list stays pinned while the chat scrolls underneath */
  return (
    <div className="anim-fade-up sticky top-0 z-20 mb-3 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/95 shadow-sm backdrop-blur">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-600 text-white">
          {allDone ? <Check size={14} strokeWidth={3} /> : <Loader2 size={14} className="animate-spin" />}
        </span>
        <span className="min-w-0 flex-1 text-[12.5px] font-bold text-violet-900">
          {allDone ? t('stepper.done') : t('stepper.building')}
          <span className="ml-1.5 font-semibold text-violet-500">{doneCount}/{progress.length}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-violet-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </button>

      {!collapsed && (
        <ol className="nice-scroll flex max-h-56 flex-col gap-1 overflow-y-auto px-3.5 pb-3">
          {progress.map((p) => (
            <li key={p.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center">
                {p.status === 'done' ? (
                  <Check size={13} strokeWidth={3} className="text-emerald-600" />
                ) : p.status === 'error' ? (
                  <TriangleAlert size={13} className="text-rose-500" />
                ) : p.status === 'pending' ? (
                  <Circle size={11} strokeWidth={2.5} className="text-violet-300" />
                ) : (
                  <Loader2 size={13} className="animate-spin text-violet-500" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[12px] font-semibold leading-snug ${
                  p.status === 'done' ? 'text-ink-500' : p.status === 'pending' ? 'text-ink-400' : 'text-ink-800'
                }`}>
                  {p.step}
                </span>
                {p.detail && p.status !== 'done' && (
                  <span className="block truncate text-[10.5px] text-ink-400">{p.detail}</span>
                )}
              </span>
            </li>
          ))}
          {thinking && (
            <li className="flex items-center gap-2.5 pt-0.5 text-[11px] font-medium text-violet-400">
              <ListTodo size={13} className="ml-0.5" /> {t('stepper.liveNote')}
            </li>
          )}
        </ol>
      )}
    </div>
  )
}
