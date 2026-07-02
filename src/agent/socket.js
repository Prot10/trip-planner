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

const storedModel = localStorage.getItem('agent.model')

export const useAgentChat = create((set, get) => ({
  connected: false,
  thinking: false,
  open: false,
  panelW: 0,
  messages: [],
  streamText: '',
  model: null,                    // model id reported by the engine
  modelChoice: ['sonnet', 'opus', 'haiku'].includes(storedModel) ? storedModel : 'sonnet',
  engine: localStorage.getItem('agent.engine') === 'codex' ? 'codex' : 'claude',
  chatId: null,                   // active saved-chat id
  sessionId: null,                // engine session/thread to resume
  edits: [],                      // per-turn write log: { id, name, args, result, undo, detail, reverted }
  progress: [],                   // live planning stepper: { id, step, status, detail }
  undoSnapshot: null,
  undoReady: false,
  showEdits: false,

  setOpen: (open) => set({ open }),
  setShowEdits: (showEdits) => set({ showEdits }),
  setModelChoice: (modelChoice) => {
    localStorage.setItem('agent.model', modelChoice)
    set({ modelChoice })
  },
  setEngine(engine) {
    if (engine === get().engine) return
    localStorage.setItem('agent.engine', engine)
    get().newChat()
    set({ engine, model: null })
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
    sendWs({
      type: 'chat', text: t,
      model: get().modelChoice,
      engine: get().engine,
      sessionId: get().sessionId,
      mode: phase === 'interview' ? 'interview' : 'planner',
    })
  },

  stop: () => sendWs({ type: 'stop' }),

  newChat() {
    if (get().thinking) sendWs({ type: 'stop' })
    set({
      messages: [], chatId: null, sessionId: null, model: null,
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
      modelChoice: ['sonnet', 'opus', 'haiku'].includes(chat.model) ? chat.model : get().modelChoice,
      model: null,
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
    model: s.modelChoice,
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
      push({ role: 'tool', name: msg.name, args: msg.args })
      break
    case 'agent_error':
      push({ role: 'error', text: msg.error })
      break
    case 'model':
      useAgentChat.setState({ model: msg.model })
      break
    case 'session':
      useAgentChat.setState({ sessionId: msg.sessionId })
      persistChat()
      break
    case 'turn_start':
      useAgentChat.setState({ thinking: true })
      break
    case 'turn_end':
      useAgentChat.setState((s) => {
        const leftovers = s.streamText.trim()
        return {
          thinking: false,
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
