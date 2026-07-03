import { useEffect, useRef, useState } from 'react'
import {
  Wrench, MapPin, Trash2, Pencil, CalendarPlus, Search, Sparkles, ListChecks, Route,
  Settings2, Camera, Globe, ChevronDown, TerminalSquare, Copy, Check, NotebookPen, Bot, Loader2, LogIn,
} from 'lucide-react'
import { useAgentChat } from '../agent/socket'

/* ---------- tool chip metadata ---------- */

export const TOOL_META = {
  get_trip: { Icon: Route, label: () => 'Lettura del viaggio' },
  get_route_info: { Icon: Route, label: () => 'Lettura percorso e km' },
  get_place_images: { Icon: Camera, label: (a) => 'Ricerca foto del luogo' },
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
  add_suggestion: { Icon: Sparkles, label: (a) => `Nuovo consiglio: ${a.title ?? ''}` },
  remove_suggestion: { Icon: Sparkles, label: () => 'Consiglio eliminato' },
  update_notes: { Icon: NotebookPen, label: () => 'Taccuino aggiornato' },
  set_trip_brief: { Icon: ListChecks, label: () => 'Brief del viaggio salvato' },
  start_planning: { Icon: Sparkles, label: () => 'Apertura del planner' },
  estimate_travel: { Icon: Route, label: (a) => `Stima spostamento (${a.mode ?? ''})` },
  WebSearch: { Icon: Globe, label: (a) => `Ricerca web: ${a.query ?? ''}` },
  WebFetch: { Icon: Globe, label: () => 'Lettura pagina web' },
  web_search: { Icon: Globe, label: (a) => `Ricerca web: ${a.query ?? ''}` },
}

/* plural labels for grouped runs of the same tool */
const GROUP_LABELS = {
  add_activity: (n) => `Aggiunte ${n} attività`,
  update_activity: (n) => `Modificate ${n} attività`,
  remove_activity: (n) => `Rimosse ${n} attività`,
  move_activity: (n) => `Spostate ${n} attività`,
  add_day: (n) => `Creati ${n} giorni`,
  search_places: (n) => `${n} ricerche luogo`,
  get_place_images: (n) => `${n} ricerche foto`,
  estimate_travel: (n) => `${n} stime spostamento`,
  WebSearch: (n) => `${n} ricerche web`,
  web_search: (n) => `${n} ricerche web`,
  checklist_add: (n) => `${n} voci in checklist`,
  add_suggestion: (n) => `${n} nuovi consigli`,
  get_trip: (n) => `${n} letture del viaggio`,
  update_notes: (n) => `Taccuino aggiornato ${n} volte`,
}

/* collapse consecutive same-tool messages into groups for rendering */
export function groupMessages(messages) {
  const out = []
  for (const m of messages) {
    const last = out[out.length - 1]
    if (m.role === 'tool' && last?.role === 'toolgroup' && last.name === m.name) {
      last.items.push(m)
    } else if (m.role === 'tool') {
      out.push({ role: 'toolgroup', id: m.id, name: m.name, items: [m] })
    } else {
      out.push(m)
    }
  }
  return out
}

/* one chip per tool run — or a grouped chip with a hover menu listing all */
export function ToolChipGroup({ group }) {
  const meta = TOOL_META[group.name] ?? { Icon: Wrench, label: () => group.name }
  const n = group.items.length

  if (n === 1) {
    const m = group.items[0]
    return (
      <div className="mb-2 flex">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-500 ring-1 ring-ink-500/10">
          <meta.Icon size={11} className="text-brand-500" /> {meta.label(m.args ?? {}, m.result)}
        </span>
      </div>
    )
  }

  const label = (GROUP_LABELS[group.name] ?? ((x) => `${meta.label({}, null)} ×${x}`))(n)
  return (
    <div className="group/tg relative mb-2 flex">
      <span className="inline-flex cursor-default items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600 ring-1 ring-ink-500/10 transition group-hover/tg:ring-brand-300">
        <meta.Icon size={11} className="text-brand-500" /> {label}
        <ChevronDown size={10} className="text-ink-400" />
      </span>
      {/* hover breakdown, like the budget badge */}
      <div className="invisible absolute bottom-[calc(100%+6px)] left-0 z-30 w-72 rounded-xl border border-ink-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-150 group-hover/tg:visible group-hover/tg:opacity-100">
        <div className="nice-scroll max-h-56 overflow-y-auto">
          {group.items.map((m) => (
            <div key={m.id} className="flex items-start gap-2 rounded-md px-1.5 py-1 text-[11px] text-ink-600 hover:bg-ink-50">
              <meta.Icon size={10} className="mt-0.5 shrink-0 text-brand-400" />
              <span className="min-w-0 flex-1 truncate">{meta.label(m.args ?? {}, m.result)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- guided engine sign-in (auth errors) ---------- */

const SETUP = {
  claude: {
    title: 'Collega il tuo abbonamento Claude',
    account: 'account Claude (Pro/Max)',
    steps: [
      { text: 'Apri il terminale e avvia Claude Code', cmd: 'claude' },
      { text: 'Dentro Claude Code esegui il login col tuo abbonamento', cmd: '/login' },
      { text: 'Torna qui e rimanda il messaggio.' },
    ],
  },
  codex: {
    title: 'Collega il tuo account ChatGPT',
    account: 'account ChatGPT (Plus)',
    steps: [
      { text: 'Apri il terminale nella cartella del progetto ed esegui', cmd: 'npx codex login' },
      { text: "Completa l'accesso nel browser con il tuo account ChatGPT (Plus)" },
      { text: 'Torna qui e rimanda il messaggio.' },
    ],
  },
}

/* one-click sign-in: the local server runs the CLI login for the user; the
   browser opens by itself, Claude additionally asks to paste back a code */
export function SetupCard({ engine, error }) {
  const cfg = SETUP[engine] ?? SETUP.claude
  const connected = useAgentChat((s) => s.connected)
  const auth = useAgentChat((s) => s.auth)
  const startAuth = useAgentChat((s) => s.startAuth)
  const sendAuthCode = useAgentChat((s) => s.sendAuthCode)
  const [code, setCode] = useState('')
  const [manual, setManual] = useState(false)

  const mine = auth.engine === engine ? auth : { phase: 'idle' }

  return (
    <div className="anim-fade-up mb-3 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-ink-100 bg-ink-50/70 px-3.5 py-2.5">
        <TerminalSquare size={15} className="text-violet-600" />
        <p className="text-[12.5px] font-bold text-ink-900">{cfg.title}</p>
      </div>

      <div className="p-3.5">
        {mine.phase === 'done' ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-200">
            <Check size={15} strokeWidth={3} className="shrink-0 text-emerald-600" />
            <p className="text-[12px] font-semibold leading-snug text-emerald-800">
              Account collegato! Riprovo subito col tuo messaggio.
            </p>
          </div>
        ) : mine.phase === 'waiting' || mine.phase === 'verifying' ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 rounded-xl bg-violet-50 px-3 py-2.5 ring-1 ring-violet-200">
              <Loader2 size={15} className="shrink-0 animate-spin text-violet-600" />
              <p className="text-[12px] font-semibold leading-snug text-violet-900">
                {mine.phase === 'verifying'
                  ? 'Verifico il codice…'
                  : `Completa l'accesso nella scheda del browser appena aperta, col tuo ${cfg.account}.`}
              </p>
            </div>
            {mine.url && mine.phase === 'waiting' && (
              <a
                href={mine.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-800"
              >
                Non si è aperta nessuna scheda? Clicca qui per aprire la pagina di accesso
              </a>
            )}
            {mine.needsCode && mine.phase === 'waiting' && (
              <div className="flex items-center gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendAuthCode(code) }}
                  placeholder="Incolla qui il codice mostrato a fine accesso…"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 font-mono text-[11.5px] text-ink-800 outline-none transition placeholder:font-sans placeholder:text-ink-300 focus:border-violet-400 focus:bg-white"
                />
                <button
                  onClick={() => sendAuthCode(code)}
                  disabled={!code.trim()}
                  className="rounded-xl bg-violet-600 px-3 py-2 text-[11.5px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-40"
                >
                  Conferma
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => startAuth(engine)}
              disabled={!connected}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-[12.5px] font-bold text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700 active:scale-[.98] disabled:opacity-40 disabled:shadow-none"
            >
              <LogIn size={14} /> Collega con un click
            </button>
            <p className="mt-1.5 text-center text-[10.5px] leading-snug text-ink-400">
              {connected
                ? `Si aprirà la pagina di accesso del tuo ${cfg.account}: nessuna API key, nessun terminale.`
                : 'Serve il server locale: avvia `npm run dev` nella cartella del progetto.'}
            </p>
            {mine.phase === 'error' && (
              <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] leading-snug text-rose-700 ring-1 ring-rose-200">
                {mine.error}
              </p>
            )}
          </>
        )}

        {/* terminal fallback for who prefers it */}
        <button
          onClick={() => setManual((m) => !m)}
          className="mt-2.5 flex items-center gap-1 text-[10.5px] font-semibold text-ink-400 transition hover:text-ink-600"
        >
          <ChevronDown size={10} className={`transition-transform ${manual ? 'rotate-180' : ''}`} />
          Preferisci il terminale?
        </button>
        {manual && (
          <ol className="mt-2 flex flex-col gap-2">
            {cfg.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-violet-100 text-[10.5px] font-bold text-violet-700">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-snug text-ink-600">{s.text}</p>
                  {s.cmd && <CopyCmd cmd={s.cmd} />}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {error && (
        <p className="border-t border-ink-100 px-3.5 py-2 text-[10.5px] leading-snug text-ink-400">{error}</p>
      )}
    </div>
  )
}

function CopyCmd({ cmd }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(cmd)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="mt-1 inline-flex items-center gap-2 rounded-lg bg-ink-900 px-2.5 py-1 font-mono text-[11.5px] text-emerald-300 transition hover:bg-ink-700"
    >
      {cmd}
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-ink-400" />}
    </button>
  )
}

/* ---------- engine + model picker ---------- */

const ENGINES = [
  {
    id: 'claude',
    name: 'Claude',
    note: 'abbonamento Pro/Max',
    models: [
      { id: 'sonnet', label: 'Sonnet', note: 'veloce e brillante — consigliato' },
      { id: 'opus', label: 'Opus', note: 'il più profondo, più lento' },
      { id: 'haiku', label: 'Haiku', note: 'leggerissimo, per modifiche rapide' },
    ],
  },
  {
    id: 'codex',
    name: 'ChatGPT',
    note: 'abbonamento Plus (Codex)',
    models: [
      { id: 'gpt-5.5', label: 'GPT-5.5', note: 'il più capace' },
      { id: 'gpt-5.4', label: 'GPT-5.4', note: 'equilibrato — consigliato' },
      { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', note: 'rapido ed economico' },
    ],
  },
]

/* Italian one-liners for known slugs; unknown ones keep the CLI description */
const CODEX_NOTES_IT = {
  'gpt-5.5': 'il più capace',
  'gpt-5.4': 'equilibrato — consigliato',
  'gpt-5.4-mini': 'rapido ed economico',
}

export function ModelPicker() {
  const engine = useAgentChat((s) => s.engine)
  const models = useAgentChat((s) => s.models)
  const select = useAgentChat((s) => s.select)
  const codexModels = useAgentChat((s) => s.codexModels)
  const resolvedClaude = useAgentChat((s) => s.resolvedClaude)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  /* both columns stay current without hardcoded lists: ChatGPT mirrors the
     CLI's model cache; Claude's aliases always resolve to the newest model
     of each family — the id reported by the SDK is shown on its row */
  const engines = ENGINES.map((e) => {
    if (e.id === 'codex' && codexModels?.length) {
      return {
        ...e,
        models: codexModels.map((m) => ({
          id: m.id,
          label: m.label ?? m.id,
          note: CODEX_NOTES_IT[m.id] ?? (m.note ? m.note.slice(0, 60) : ''),
        })),
      }
    }
    if (e.id === 'claude' && resolvedClaude) {
      return {
        ...e,
        models: e.models.map((m) =>
          resolvedClaude.includes(m.id) ? { ...m, note: `${m.note} · ora: ${resolvedClaude}` } : m,
        ),
      }
    }
    return e
  })

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const eng = engines.find((e) => e.id === engine)
  const model = eng.models.find((m) => m.id === models[engine]) ?? eng.models[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Scegli motore e modello"
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-bold transition ${
          open ? 'bg-violet-50 text-violet-700' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-700'
        }`}
      >
        <span className={`size-1.5 rounded-full ${engine === 'claude' ? 'bg-brand-500' : 'bg-emerald-500'}`} />
        {eng.name} · {model.label}
        <ChevronDown size={11} className={`text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="anim-fade-up absolute left-0 top-[calc(100%+6px)] z-40 w-72 rounded-2xl border border-ink-200 bg-white p-2 shadow-xl">
          {engines.map((e) => (
            <div key={e.id} className="mb-1 last:mb-0">
              <p className="flex items-baseline gap-1.5 px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                <span className={`size-1.5 translate-y-[-1px] rounded-full ${e.id === 'claude' ? 'bg-brand-500' : 'bg-emerald-500'}`} />
                {e.name} <span className="font-medium normal-case tracking-normal">{e.note}</span>
              </p>
              {e.models.map((m) => {
                const active = engine === e.id && models[e.id] === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => { select(e.id, m.id); setOpen(false) }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition ${
                      active ? 'bg-violet-50' : 'hover:bg-ink-50'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[12.5px] font-bold ${active ? 'text-violet-700' : 'text-ink-800'}`}>{m.label}</span>
                      <span className="block text-[10.5px] text-ink-400">{m.note}</span>
                    </span>
                    {active && <Check size={13} className="shrink-0 text-violet-600" strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* the agent's avatar, shared everywhere */
export function AgentAvatar({ className = 'size-9', iconSize = 18, connected }) {
  return (
    <div className={`relative grid ${className} shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-md shadow-violet-500/25`}>
      <Bot size={iconSize} />
      {connected !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white ${connected ? 'bg-emerald-500' : 'bg-ink-300'}`}
          title={connected ? 'Connesso' : 'Server non raggiungibile'}
        />
      )}
    </div>
  )
}
