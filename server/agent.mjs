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
import { homedir } from 'node:os'
import { createTripTools, TRIP_TOOL_NAMES } from './tools.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const read = (f) => readFileSync(join(__dirname, 'prompts', f), 'utf8')
const PLANNING_RULES = read('planning-rules.md')
const PLANNER_PROMPT = `${read('system.md')}\n\n${PLANNING_RULES}`
const INTERVIEW_PROMPT = `${read('interview.md')}\n\n${PLANNING_RULES}`
const CODEX_WORKSPACE = join(__dirname, 'codex-workspace')
/* prefer the project-pinned Codex CLI over whatever brew has */
const LOCAL_CODEX = join(__dirname, '..', 'node_modules', '.bin', 'codex')
export const CODEX_BIN = existsSync(LOCAL_CODEX) ? LOCAL_CODEX : 'codex'
const MAX_TURNS = 100
const CLAUDE_MODELS = new Set(['sonnet', 'opus', 'haiku'])
/* the model slugs OpenAI accepts for ChatGPT accounts change over time:
   read them from the CLI's own cache so the app never goes stale again */
const CODEX_FALLBACK = [
  { id: 'gpt-5.5', label: 'GPT-5.5' },
  { id: 'gpt-5.4', label: 'GPT-5.4' },
  { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
]
function codexModels() {
  try {
    const cache = JSON.parse(readFileSync(join(homedir(), '.codex', 'models_cache.json'), 'utf8'))
    const list = (cache.models ?? [])
      .filter((m) => m.visibility === 'list' && m.slug)
      .map((m) => ({ id: m.slug, label: m.display_name || m.slug, note: m.description || '' }))
    if (list.length) return list
  } catch { /* cache missing: first run or CLI never used */ }
  return CODEX_FALLBACK
}
function pickCodexModel(model) {
  const list = codexModels()
  if (list.some((m) => m.id === model)) return model
  return list.find((m) => m.id === 'gpt-5.4')?.id ?? list[0].id
}

/* the trip notebook rides along on every turn: it's the agent's memory */
const withNotes = (prompt, notes) =>
  notes?.trim() ? `${prompt}\n\n## Il tuo taccuino per questo viaggio (memoria corrente)\n${notes}` : prompt

export function createAgent(bridge, { mcpPort, auth }) {
  const tripServer = createTripTools(bridge)
  let active = null // { abort() }

  /* ---------- Claude (Agent SDK) ---------- */
  async function runClaude(text, { model, sessionId, mode, notes }) {
    const abort = new AbortController()
    active = { abort: () => abort.abort() }
    try {
      const q = query({
        prompt: text,
        options: {
          systemPrompt: withNotes(mode === 'interview' ? INTERVIEW_PROMPT : PLANNER_PROMPT, notes),
          mcpServers: { trip: tripServer },
          tools: ['WebSearch', 'WebFetch'],
          allowedTools: [...TRIP_TOOL_NAMES, 'WebSearch', 'WebFetch'],
          model: CLAUDE_MODELS.has(model) ? model : 'sonnet',
          permissionMode: 'bypassPermissions',
          maxTurns: MAX_TURNS,
          abortController: abort,
          includePartialMessages: true,
          /* ask_user blocks on human input: give MCP tools generous timeouts;
             a token captured by the guided in-app login wins over stale creds */
          env: {
            ...process.env,
            MCP_TOOL_TIMEOUT: '900000', MCP_TIMEOUT: '900000',
            ...(auth?.getClaudeToken() ? { CLAUDE_CODE_OAUTH_TOKEN: auth.getClaudeToken() } : {}),
          },
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
        const isAuth = /login|auth|credential|api key/i.test(String(e?.message))
        bridge.broadcast({ type: 'agent_error', error: String(e?.message ?? e), ...(isAuth ? { auth: 'claude' } : {}) })
      }
    }
  }

  /* ---------- Codex (ChatGPT subscription) ---------- */
  function runCodex(text, { model, sessionId, mode, notes }) {
    /* Codex reads AGENTS.md (planner persona); interview rules ride along
       with the first message of an interview chat, the notebook every turn */
    if (mode === 'interview' && !sessionId) {
      text = `<istruzioni_fase_intervista>\n${INTERVIEW_PROMPT}\n</istruzioni_fase_intervista>\n\nMessaggio dell'utente: ${text}`
    }
    if (notes?.trim()) {
      text = `<taccuino_viaggio>\n${notes}\n</taccuino_viaggio>\n\n${text}`
    }
    return new Promise((resolve) => {
      /* `exec resume` only takes --json/-m/-c flags (before the session id):
         sandbox and cwd must ride along as config overrides there */
      const flags = [
        '--json',
        '--skip-git-repo-check',
        '-m', pickCodexModel(model),
        '-c', `mcp_servers.trip.url="http://127.0.0.1:${mcpPort}/mcp"`,
        '-c', 'mcp_servers.trip.tool_timeout_sec=900',
        '-c', 'tools.web_search=true',
      ]
      const args = sessionId
        ? ['exec', 'resume', ...flags, '-c', 'sandbox_mode="read-only"', sessionId, text]
        : ['exec', ...flags, '--sandbox', 'read-only', '--cd', CODEX_WORKSPACE, text]

      console.log(`[codex] ${sessionId ? `resume ${sessionId.slice(0, 8)}…` : 'nuova sessione'} · modello ${pickCodexModel(model)}${model !== pickCodexModel(model) ? ` (richiesto: ${model})` : ''}`)
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
          console.error(`[codex] uscito con codice ${code}: ${stderr.trim().slice(-300)}`)
          const isAuth = /login|auth/i.test(stderr)
          bridge.broadcast({
            type: 'agent_error',
            error: `Codex è uscito con errore (${code}). ${stderr.slice(-300)}`,
            ...(isAuth ? { auth: 'codex' } : {}),
          })
        }
        resolve()
      })

      let lastError = ''
      function fmtCodexError(raw) {
        let msg = String(raw)
        const m = msg.match(/"message":"([^"]+)"/)
        if (m) msg = m[1]
        if (/model is not supported.*ChatGPT account/i.test(msg)) {
          msg += ' — Il login ChatGPT è probabilmente scaduto: ricollega l’account qui sotto.'
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
          console.error(`[codex] errore: ${String(ev.message).slice(0, 200)}`)
          lastError = fmtCodexError(ev.message)
          sawMessage = true
          const isAuth = /login|not supported.*ChatGPT|auth/i.test(ev.message)
          bridge.broadcast({ type: 'agent_error', error: lastError, ...(isAuth ? { auth: 'codex' } : {}) })
          return
        }
        if (ev.type === 'turn.failed') {
          const msg = fmtCodexError(ev.error?.message ?? 'turno fallito')
          if (msg !== lastError) {
            sawMessage = true
            const isAuth = /login|not supported.*ChatGPT|auth/i.test(msg)
            bridge.broadcast({ type: 'agent_error', error: msg, ...(isAuth ? { auth: 'codex' } : {}) })
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

  /* browser gone for good (not just a refresh): abort the orphaned turn,
     or it blocks every new chat with "un turno è già in corso" */
  let ghostTimer = null
  bridge.onTabsGone(() => {
    clearTimeout(ghostTimer)
    ghostTimer = setTimeout(() => {
      if (active) {
        console.log('[agent] nessuna scheda da 10s: interrompo il turno orfano')
        active.abort()
      }
    }, 10000)
  })
  bridge.onTabBack(() => clearTimeout(ghostTimer))

  bridge.onChat((msg) => {
    if (msg.type === 'chat' && typeof msg.text === 'string' && msg.text.trim()) {
      runTurn({ ...msg, text: msg.text.trim() })
    } else if (msg.type === 'stop') {
      active?.abort()
    } else if (msg.type === 'models_get') {
      bridge.broadcast({ type: 'codex_models', models: codexModels() })
    }
  })
}
