/* Chat engines behind one WebSocket protocol:
   - claude: Agent SDK, reuses the local `claude` CLI login (Pro/Max)
   - codex:  OpenAI Codex CLI (`codex exec --json`), ChatGPT sign-in
   Sessions are client-owned: each chat message carries the sessionId to
   resume, so saved conversations reopen with their full context. */

import { query } from '@anthropic-ai/claude-agent-sdk'
import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createTripTools, TRIP_TOOL_NAMES } from './tools.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts', 'system.md'), 'utf8')
const CODEX_WORKSPACE = join(__dirname, 'codex-workspace')
/* prefer the project-pinned Codex CLI over whatever brew has */
const LOCAL_CODEX = join(__dirname, '..', 'node_modules', '.bin', 'codex')
const CODEX_BIN = existsSync(LOCAL_CODEX) ? LOCAL_CODEX : 'codex'
const MAX_TURNS = 30
const CLAUDE_MODELS = new Set(['sonnet', 'opus', 'haiku'])

export function createAgent(bridge, { mcpPort }) {
  const tripServer = createTripTools(bridge)
  let active = null // { abort() }

  /* ---------- Claude (Agent SDK) ---------- */
  async function runClaude(text, { model, sessionId }) {
    const abort = new AbortController()
    active = { abort: () => abort.abort() }
    try {
      const q = query({
        prompt: text,
        options: {
          systemPrompt: SYSTEM_PROMPT,
          mcpServers: { trip: tripServer },
          tools: ['WebSearch', 'WebFetch'],
          allowedTools: [...TRIP_TOOL_NAMES, 'WebSearch', 'WebFetch'],
          model: CLAUDE_MODELS.has(model) ? model : 'sonnet',
          permissionMode: 'bypassPermissions',
          maxTurns: MAX_TURNS,
          abortController: abort,
          includePartialMessages: true,
          ...(sessionId ? { resume: sessionId } : {}),
        },
      })

      for await (const msg of q) {
        if (msg.type === 'system' && msg.subtype === 'init') {
          if (msg.session_id) bridge.broadcast({ type: 'session', sessionId: msg.session_id })
          if (msg.model) bridge.broadcast({ type: 'model', model: msg.model })
          continue
        }
        if (msg.type === 'stream_event') {
          const ev = msg.event
          if (ev?.type === 'content_block_delta' && ev.delta?.type === 'text_delta' && ev.delta.text) {
            bridge.broadcast({ type: 'assistant_delta', text: ev.delta.text })
          }
          continue
        }
        if (msg.type === 'assistant') {
          for (const block of msg.message?.content ?? []) {
            if (block.type === 'text' && block.text) {
              bridge.broadcast({ type: 'assistant_text', text: block.text })
            } else if (block.type === 'tool_use') {
              bridge.broadcast({
                type: 'agent_tool',
                name: String(block.name ?? '').replace(/^mcp__trip__/, ''),
                args: block.input ?? {},
              })
            }
          }
        }
        if (msg.type === 'result') {
          if (msg.session_id) bridge.broadcast({ type: 'session', sessionId: msg.session_id })
          if (msg.subtype !== 'success' && msg.subtype !== undefined) {
            bridge.broadcast({ type: 'agent_error', error: `Il turno si è interrotto (${msg.subtype}).` })
          }
        }
      }
    } catch (e) {
      if (!abort.signal.aborted) {
        const hint = /login|auth|credential/i.test(String(e?.message))
          ? " Verifica l'accesso con `claude` (abbonamento) sul terminale."
          : ''
        bridge.broadcast({ type: 'agent_error', error: `${e?.message ?? e}${hint}` })
      }
    }
  }

  /* ---------- Codex (ChatGPT subscription) ---------- */
  function runCodex(text, { sessionId }) {
    return new Promise((resolve) => {
      const flags = [
        '--json',
        '--skip-git-repo-check',
        '--sandbox', 'read-only',
        '--cd', CODEX_WORKSPACE,
        '-c', `mcp_servers.trip.url="http://127.0.0.1:${mcpPort}/mcp"`,
        '-c', 'tools.web_search=true',
      ]
      const args = sessionId
        ? ['exec', 'resume', sessionId, ...flags, text]
        : ['exec', ...flags, text]

      let child
      try {
        child = spawn(CODEX_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] })
      } catch {
        bridge.broadcast({ type: 'agent_error', error: 'Codex CLI non trovato: installa `codex` e accedi con ChatGPT.' })
        resolve()
        return
      }
      active = { abort: () => child.kill('SIGTERM') }
      bridge.broadcast({ type: 'model', model: 'codex' })

      let buf = ''
      let stderr = ''
      let sawMessage = false
      child.stdout.on('data', (chunk) => {
        buf += chunk.toString()
        let nl
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim()
          buf = buf.slice(nl + 1)
          if (!line) continue
          let ev
          try { ev = JSON.parse(line) } catch { continue }
          handleCodexEvent(ev)
        }
      })
      child.stderr.on('data', (c) => { stderr += c.toString() })
      child.on('error', () => {
        bridge.broadcast({ type: 'agent_error', error: 'Codex CLI non trovato: installa `codex` e accedi con ChatGPT.' })
        resolve()
      })
      child.on('close', (code) => {
        if (code !== 0 && !sawMessage) {
          const hint = /login|auth/i.test(stderr) ? ' Esegui `codex login` con il tuo account ChatGPT.' : ''
          bridge.broadcast({ type: 'agent_error', error: `Codex è uscito con errore (${code}). ${stderr.slice(-300)}${hint}` })
        }
        resolve()
      })

      let lastError = ''
      function fmtCodexError(raw) {
        let msg = String(raw)
        const m = msg.match(/"message":"([^"]+)"/)
        if (m) msg = m[1]
        if (/model is not supported.*ChatGPT account/i.test(msg)) {
          msg += ' — Il login ChatGPT è probabilmente scaduto: esegui `codex login` nel terminale e riprova.'
        }
        return msg
      }
      function handleCodexEvent(ev) {
        const id = ev.thread_id ?? ev.session_id
        if ((ev.type === 'thread.started' || ev.type === 'session.created') && id) {
          bridge.broadcast({ type: 'session', sessionId: id })
          return
        }
        if (ev.type === 'error' && ev.message) {
          if (/retrying \d/.test(ev.message)) return // transient retries: stay quiet
          lastError = fmtCodexError(ev.message)
          sawMessage = true
          bridge.broadcast({ type: 'agent_error', error: lastError })
          return
        }
        if (ev.type === 'turn.failed') {
          const msg = fmtCodexError(ev.error?.message ?? 'turno fallito')
          if (msg !== lastError) {
            sawMessage = true
            bridge.broadcast({ type: 'agent_error', error: msg })
          }
          return
        }
        const item = ev.item
        if (!item) return
        if (ev.type === 'item.completed' && item.type === 'agent_message' && item.text) {
          sawMessage = true
          bridge.broadcast({ type: 'assistant_text', text: item.text })
        }
        if (ev.type === 'item.started' && item.type === 'mcp_tool_call') {
          bridge.broadcast({
            type: 'agent_tool',
            name: String(item.tool ?? item.name ?? 'tool'),
            args: safeArgs(item.arguments),
          })
        }
        if (ev.type === 'item.started' && item.type === 'web_search') {
          bridge.broadcast({ type: 'agent_tool', name: 'WebSearch', args: { query: item.query ?? '' } })
        }
      }
    })
  }

  function safeArgs(a) {
    if (!a) return {}
    if (typeof a === 'object') return a
    try { return JSON.parse(a) } catch { return {} }
  }

  /* ---------- dispatch ---------- */
  async function runTurn(msg) {
    if (active) { bridge.broadcast({ type: 'agent_error', error: 'Un turno è già in corso.' }); return }
    bridge.broadcast({ type: 'turn_start' })
    try {
      if (msg.engine === 'codex') await runCodex(msg.text, msg)
      else await runClaude(msg.text, msg)
    } finally {
      active = null
      bridge.broadcast({ type: 'turn_end' })
    }
  }

  bridge.onChat((msg) => {
    if (msg.type === 'chat' && typeof msg.text === 'string' && msg.text.trim()) {
      runTurn({ ...msg, text: msg.text.trim() })
    } else if (msg.type === 'stop') {
      active?.abort()
    }
  })
}
