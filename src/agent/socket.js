/* WebSocket client to the local agent server: receives streamed chat events,
   executes tool calls against the live store, manages per-turn undo. */

import { create } from 'zustand'
import { useTrip, activeTrip, toast } from '../store'
import { uid } from '../lib/utils'
import { executeTool, WRITE_TOOLS } from './toolExecutors'

const WS_URL = `ws://${location.hostname}:5200/agent`

export const useAgentChat = create((set, get) => ({
  connected: false,
  thinking: false,
  open: false,
  messages: [],           // { id, role: 'user'|'assistant'|'tool'|'error', text, name, args }
  undoSnapshot: null,     // trip snapshot taken before the first write of the current turn
  undoReady: false,       // a finished turn has edits that can be reverted

  setOpen: (open) => set({ open }),

  send(text) {
    const t = text.trim()
    if (!t || !get().connected || get().thinking) return
    set((s) => ({
      messages: [...s.messages, { id: uid(), role: 'user', text: t }],
      undoReady: false,
      undoSnapshot: null,
    }))
    sendWs({ type: 'chat', text: t })
  },

  stop: () => sendWs({ type: 'stop' }),

  reset() {
    sendWs({ type: 'reset' })
    set({ messages: [], undoReady: false, undoSnapshot: null, thinking: false })
  },

  undo() {
    const snap = get().undoSnapshot
    if (!snap) return
    useTrip.getState().importTrip(snap)
    set({ undoReady: false, undoSnapshot: null })
    toast('Modifiche del turno annullate')
  },
}))

let ws = null
let retryTimer = null

function sendWs(obj) {
  if (ws?.readyState === 1) ws.send(JSON.stringify(obj))
}

const push = (msg) => useAgentChat.setState((s) => ({ messages: [...s.messages, { id: uid(), ...msg }] }))

async function handleToolCall(msg) {
  /* snapshot the trip before the first write of the turn, for undo */
  if (WRITE_TOOLS.has(msg.name) && !useAgentChat.getState().undoSnapshot) {
    const t = activeTrip(useTrip.getState())
    if (t) useAgentChat.setState({ undoSnapshot: structuredClone(t) })
  }
  try {
    const result = await executeTool(msg.name, msg.args)
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
    case 'agent_tool':
      push({ role: 'tool', name: msg.name, args: msg.args })
      break
    case 'assistant_text':
      push({ role: 'assistant', text: msg.text })
      break
    case 'agent_error':
      push({ role: 'error', text: msg.error })
      break
    case 'turn_start':
      useAgentChat.setState({ thinking: true })
      break
    case 'turn_end':
      useAgentChat.setState((s) => ({ thinking: false, undoReady: !!s.undoSnapshot }))
      break
    case 'session_reset':
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
