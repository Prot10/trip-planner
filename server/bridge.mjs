/* WebSocket hub between the agent server and the browser tab(s).
   The browser is the source of truth for trip data: tool calls are forwarded
   to the tab, executed against the zustand store, and the result comes back. */

import { WebSocketServer } from 'ws'

const TOOL_TIMEOUT_MS = 20000
const INTERACTIVE_TIMEOUT_MS = 15 * 60 * 1000 // ask_user waits for a human

export function createBridge(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/agent' })
  /* listen errors (e.g. EADDRINUSE) are reported by the http server */
  wss.on('error', () => {})
  const tabs = new Set()
  const pending = new Map() // rpc id -> { resolve, timer }
  let nextId = 1
  let chatHandler = null // set by agent.mjs: (msg, ws) => void
  let authHandler = null // set by auth.mjs: guided sign-in flows

  wss.on('connection', (ws) => {
    tabs.add(ws)
    ws.send(JSON.stringify({ type: 'hello', tabs: tabs.size }))

    ws.on('message', (raw) => {
      let msg
      try { msg = JSON.parse(raw.toString()) } catch { return }

      if (msg.type === 'tool_result' && pending.has(msg.id)) {
        const { resolve, timer } = pending.get(msg.id)
        clearTimeout(timer)
        pending.delete(msg.id)
        resolve(msg)
        return
      }
      if (msg.type === 'chat' || msg.type === 'stop' || msg.type === 'reset') {
        chatHandler?.(msg, ws)
      }
      if (msg.type?.startsWith('auth_')) {
        authHandler?.(msg, ws)
      }
    })

    ws.on('close', () => tabs.delete(ws))
    ws.on('error', () => tabs.delete(ws))
  })

  /* run a tool in the browser tab and await its result */
  function callBrowser(name, args) {
    return new Promise((resolve) => {
      const tab = [...tabs].at(-1) // most recent tab wins
      if (!tab || tab.readyState !== 1) {
        resolve({ ok: false, error: "Nessuna scheda dell'app aperta nel browser: apri il Trip Planner e riprova." })
        return
      }
      const id = nextId++
      const timeoutMs = name === 'ask_user' ? INTERACTIVE_TIMEOUT_MS : TOOL_TIMEOUT_MS
      const timer = setTimeout(() => {
        pending.delete(id)
        resolve({ ok: false, error: name === 'ask_user' ? "L'utente non ha risposto alla domanda." : 'Timeout: il browser non ha risposto alla tool call.' })
      }, timeoutMs)
      pending.set(id, { resolve: (msg) => resolve({ ok: !msg.error, result: msg.result, error: msg.error }), timer })
      tab.send(JSON.stringify({ type: 'tool_call', id, name, args }))
    })
  }

  /* push a chat event to every connected tab */
  function broadcast(event) {
    const data = JSON.stringify(event)
    for (const tab of tabs) if (tab.readyState === 1) tab.send(data)
  }

  return {
    callBrowser,
    broadcast,
    onChat(fn) { chatHandler = fn },
    onAuth(fn) { authHandler = fn },
    get tabCount() { return tabs.size },
  }
}
