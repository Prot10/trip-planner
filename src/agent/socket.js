/* WebSocket client to the local agent server: streamed chat events, tool
   execution against the live store, per-edit undo, and persistent chats
   tied to each trip (localStorage). */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useTrip, activeTrip, toast } from '../store'
import { uid } from '../lib/utils'
import { executeTool, applyUndoOp, WRITE_TOOLS, hooks } from './toolExecutors'

const WS_URL = `ws://${location.hostname}:5200/agent`

/* ---------- saved conversations, per trip ---------- */
export const useChats = create(
  persist(
    (set) => ({
      byTrip: {},
      saveChat: (tripId, chat) =>
        set((s) => {
          const list = s.byTrip[tripId] ?? []
          const i = list.findIndex((c) => c.id === chat.id)
          const next = i >= 0 ? list.map((c) => (c.id === chat.id ? chat : c)) : [chat, ...list]
          return { byTrip: { ...s.byTrip, [tripId]: next.slice(0, 40) } }
        }),
      deleteChat: (tripId, chatId) =>
        set((s) => ({
          byTrip: { ...s.byTrip, [tripId]: (s.byTrip[tripId] ?? []).filter((c) => c.id !== chatId) },
        })),
    }),
    { name: 'tripplanner.chats.v1', storage: createJSONStorage(() => localStorage) },
  ),
)

const CLAUDE_MODELS = ['sonnet', 'opus', 'haiku']
const CODEX_MODELS = ['gpt-5.1-codex-max', 'gpt-5.1-codex', 'gpt-5.1-codex-mini']
const storedFor = (engine, fallback, valid) => {
  const v = localStorage.getItem(`agent.model.${engine}`)
  return valid.includes(v) ? v : fallback
}

export const useAgentChat = create((set, get) => ({
  connected: false,
  thinking: false,
  open: true,
  panelW: 0,
  messages: [],
  streamText: '',
  engine: localStorage.getItem('agent.engine') === 'codex' ? 'codex' : 'claude',
  models: {
    claude: storedFor('claude', 'sonnet', CLAUDE_MODELS),
    codex: storedFor('codex', 'gpt-5.1-codex', CODEX_MODELS),
  },
  chatId: null,                   // active saved-chat id
  sessionId: null,                // engine session/thread to resume
  edits: [],                      // per-turn write log: { id, name, args, result, undo, detail, reverted }
  progress: [],                   // live planning stepper: { id, step, status, detail }
  pendingQuestion: null,          // interactive ask_user card: { question, kind, options, allowOther, resolve }
  undoSnapshot: null,
  undoReady: false,
  showEdits: false,
  auth: { engine: null, phase: 'idle', url: null, needsCode: false, error: null }, // guided sign-in flow

  setOpen: (open) => set({ open }),

  /* guided sign-in: the server drives the CLI login, we render progress */
  startAuth(engine) {
    set({ auth: { engine, phase: 'waiting', url: null, needsCode: engine === 'claude', error: null } })
    sendWs({ type: 'auth_start', engine })
  },
  sendAuthCode(code) {
    if (!code.trim()) return
    sendWs({ type: 'auth_code', code: code.trim() })
    set((s) => ({ auth: { ...s.auth, phase: 'verifying' } }))
  },
  cancelAuth() {
    sendWs({ type: 'auth_cancel' })
    set({ auth: { engine: null, phase: 'idle', url: null, needsCode: false, error: null } })
  },
  setShowEdits: (showEdits) => set({ showEdits }),
  /* explicit engine+model selection: nothing is ever picked at random */
  select(engine, model) {
    const valid = engine === 'codex' ? CODEX_MODELS : CLAUDE_MODELS
    const m = valid.includes(model) ? model : valid.includes(get().models[engine]) ? get().models[engine] : valid[1] ?? valid[0]
    localStorage.setItem('agent.engine', engine)
    localStorage.setItem(`agent.model.${engine}`, m)
    if (engine !== get().engine && get().messages.length) get().newChat()
    set((s) => ({ engine, models: { ...s.models, [engine]: m } }))
  },

  send(text) {
    const t = text.trim()
    if (!t || !get().connected || get().thinking) return
    const chatId = get().chatId ?? uid()
    set((s) => ({
      chatId,
      messages: [...s.messages, { id: uid(), role: 'user', text: t }],
      undoReady: false,
      undoSnapshot: null,
      edits: [],
      progress: [],
      showEdits: false,
      streamText: '',
    }))
    persistChat()
    const phase = activeTrip(useTrip.getState())?.phase
    const trip = activeTrip(useTrip.getState())
    sendWs({
      type: 'chat', text: t,
      model: get().models[get().engine],
      engine: get().engine,
      sessionId: get().sessionId,
      mode: phase === 'interview' ? 'interview' : 'planner',
      notes: trip?.notes ?? '',
    })
  },

  stop: () => sendWs({ type: 'stop' }),

  /* after a successful guided sign-in: retry the message that hit the auth
     error, without duplicating the user bubble */
  resendLast() {
    const lastUser = [...get().messages].reverse().find((m) => m.role === 'user')
    if (!lastUser || get().thinking || !get().connected) return
    set({ undoReady: false, undoSnapshot: null, edits: [], progress: [], showEdits: false, streamText: '' })
    const trip = activeTrip(useTrip.getState())
    sendWs({
      type: 'chat', text: lastUser.text,
      model: get().models[get().engine],
      engine: get().engine,
      sessionId: get().sessionId,
      mode: trip?.phase === 'interview' ? 'interview' : 'planner',
      notes: trip?.notes ?? '',
    })
  },

  newChat() {
    if (get().thinking) sendWs({ type: 'stop' })
    set({
      messages: [], chatId: null, sessionId: null,
      undoReady: false, undoSnapshot: null, edits: [], progress: [], showEdits: false, thinking: false, streamText: '',
    })
  },

  openChat(chat) {
    if (get().thinking) sendWs({ type: 'stop' })
    set({
      messages: chat.messages ?? [],
      chatId: chat.id,
      sessionId: chat.sessionId ?? null,
      engine: chat.engine ?? 'claude',
      undoReady: false, undoSnapshot: null, edits: [], progress: [], showEdits: false, thinking: false, streamText: '',
    })
  },

  undoAll() {
    const snap = get().undoSnapshot
    if (!snap) return
    useTrip.getState().importTrip(snap)
    set((s) => ({
      undoReady: false, undoSnapshot: null,
      edits: s.edits.map((e) => ({ ...e, reverted: true })),
    }))
    toast('Modifiche del turno annullate')
  },

  /* answer the agent's interactive question; unblocks its tool call */
  answerQuestion(answer) {
    const q = get().pendingQuestion
    if (!q) return
    const answers = Array.isArray(answer) ? answer : [answer]
    set((s) => ({
      pendingQuestion: null,
      messages: [...s.messages, { id: uid(), role: 'qa', question: q.question, text: answers.join(' · '), answers }],
    }))
    persistChat()
    q.resolve({ ok: true, answer })
  },

  undoOne(editId) {
    const edit = get().edits.find((e) => e.id === editId)
    if (!edit || edit.reverted || !edit.undo) return
    try {
      applyUndoOp(edit.undo)
      set((s) => {
        const edits = s.edits.map((e) => (e.id === editId ? { ...e, reverted: true } : e))
        const anyLeft = edits.some((e) => !e.reverted)
        return { edits, undoReady: anyLeft && !!s.undoSnapshot }
      })
      toast('Modifica annullata')
    } catch (e) {
      toast(`Impossibile annullare: ${e?.message ?? e}`)
    }
  },
}))

/* write the working conversation into the saved-chats store */
function persistChat() {
  const s = useAgentChat.getState()
  const tripId = useTrip.getState().activeId
  if (!s.chatId || !tripId) return
  const firstUser = s.messages.find((m) => m.role === 'user')
  useChats.getState().saveChat(tripId, {
    id: s.chatId,
    engine: s.engine,
    model: s.models[s.engine],
    sessionId: s.sessionId,
    title: (firstUser?.text ?? 'Conversazione').slice(0, 70),
    updatedAt: Date.now(),
    messages: s.messages,
  })
}

/* executor hooks: live stepper + view flip on start_planning */
hooks.onProgress = (a) => {
  useAgentChat.setState((s) => {
    const existing = s.progress.find((p) => p.step === a.step)
    if (existing) {
      return { progress: s.progress.map((p) => (p.step === a.step ? { ...p, status: a.status, detail: a.detail ?? p.detail } : p)) }
    }
    return { progress: [...s.progress, { id: uid(), step: a.step, status: a.status, detail: a.detail }] }
  })
}
hooks.onStartPlanning = () => {
  useAgentChat.setState({ open: true })
}
hooks.onNotebook = () => {
  useAgentChat.setState({ notebookFlash: Date.now() })
}
hooks.onAskUser = (a, resolve) => {
  /* only one live question at a time: cancel a stale one */
  useAgentChat.getState().pendingQuestion?.resolve({ ok: false, error: 'Domanda sostituita da una nuova.' })
  useAgentChat.setState({
    pendingQuestion: {
      question: a.question,
      kind: a.kind ?? 'open',
      options: a.options ?? [],
      allowOther: !!a.allow_other,
      resolve,
    },
  })
}

let ws = null
let retryTimer = null

function sendWs(obj) {
  if (ws?.readyState === 1) ws.send(JSON.stringify(obj))
}

const push = (msg) => useAgentChat.setState((s) => ({ messages: [...s.messages, { id: uid(), ...msg }] }))

async function handleToolCall(msg) {
  if (WRITE_TOOLS.has(msg.name) && !useAgentChat.getState().undoSnapshot) {
    const t = activeTrip(useTrip.getState())
    if (t) useAgentChat.setState({ undoSnapshot: structuredClone(t) })
  }
  try {
    const result = await executeTool(msg.name, msg.args)
    if (WRITE_TOOLS.has(msg.name)) {
      const { undo, detail, ...rest } = result ?? {}
      useAgentChat.setState((s) => ({
        edits: [...s.edits, { id: uid(), name: msg.name, args: msg.args ?? {}, result: rest, undo, detail, reverted: false }],
      }))
    }
    sendWs({ type: 'tool_result', id: msg.id, result })
  } catch (e) {
    sendWs({ type: 'tool_result', id: msg.id, error: String(e?.message ?? e) })
  }
}

function handleEvent(msg) {
  switch (msg.type) {
    case 'tool_call':
      handleToolCall(msg)
      break
    case 'assistant_delta':
      useAgentChat.setState((s) => ({ streamText: s.streamText + msg.text }))
      break
    case 'assistant_text':
      useAgentChat.setState({ streamText: '' })
      push({ role: 'assistant', text: msg.text })
      persistChat()
      break
    case 'agent_tool':
      /* ask_user renders as the interactive card, report_progress as the stepper */
      if (msg.name !== 'ask_user' && msg.name !== 'report_progress') {
        push({ role: 'tool', name: msg.name, args: msg.args })
      }
      break
    case 'agent_error':
      if (msg.auth) push({ role: 'setup', engine: msg.auth, text: msg.error })
      else push({ role: 'error', text: msg.error })
      break
    case 'auth_event': {
      const cur = useAgentChat.getState().auth
      if (msg.engine !== cur.engine && msg.phase !== 'done') break
      if (msg.phase === 'started') useAgentChat.setState({ auth: { ...cur, phase: 'waiting' } })
      else if (msg.phase === 'url') useAgentChat.setState({ auth: { ...cur, phase: 'waiting', url: msg.url, needsCode: !!msg.needsCode || cur.needsCode } })
      else if (msg.phase === 'done') {
        useAgentChat.setState({ auth: { ...cur, engine: msg.engine, phase: 'done', error: null } })
        toast('Account collegato!')
        setTimeout(() => useAgentChat.getState().resendLast(), 800)
      } else if (msg.phase === 'error') useAgentChat.setState({ auth: { ...cur, phase: 'error', error: msg.error } })
      break
    }
    case 'model':
      break
    case 'session':
      useAgentChat.setState({ sessionId: msg.sessionId })
      persistChat()
      break
    case 'turn_start':
      useAgentChat.setState({ thinking: true })
      break
    case 'turn_end':
      useAgentChat.getState().pendingQuestion?.resolve({ ok: false, error: 'Turno terminato.' })
      useAgentChat.setState((s) => {
        const leftovers = s.streamText.trim()
        return {
          thinking: false,
          pendingQuestion: null,
          undoReady: s.edits.some((e) => !e.reverted) && !!s.undoSnapshot,
          streamText: '',
          messages: leftovers ? [...s.messages, { id: uid(), role: 'assistant', text: leftovers }] : s.messages,
        }
      })
      persistChat()
      break
  }
}

export function connectAgent() {
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return
  try {
    ws = new WebSocket(WS_URL)
  } catch {
    scheduleRetry()
    return
  }
  ws.onopen = () => useAgentChat.setState({ connected: true })
  ws.onmessage = (e) => {
    try { handleEvent(JSON.parse(e.data)) } catch { /* ignore malformed frames */ }
  }
  ws.onclose = () => {
    useAgentChat.setState({ connected: false, thinking: false })
    scheduleRetry()
  }
  ws.onerror = () => ws?.close()
}

function scheduleRetry() {
  clearTimeout(retryTimer)
  retryTimer = setTimeout(connectAgent, 3000)
}
