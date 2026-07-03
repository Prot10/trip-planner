/* Fully guided in-app sign-in. The server (already on the user's machine)
   drives the CLI login flows; the browser UI just shows progress:
   - codex:  `codex login` starts a localhost OAuth callback and opens the
             ChatGPT consent page itself; we forward the URL as a fallback
             and report success when the CLI exits.
   - claude: `claude setup-token` runs inside a pty (BSD `script`), we
             extract the authorize URL, the user pastes the one-time code in
             the UI, and the captured long-lived token is stored for the SDK. */

import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = process.env.AUTH_FILE || join(__dirname, '.auth.json')
const FLOW_TIMEOUT_MS = 5 * 60 * 1000

/* prefer the project-pinned Claude Code CLI over whatever is on PATH,
   so a fresh clone works with just `npm install` */
const LOCAL_CLAUDE = join(__dirname, '..', 'node_modules', '.bin', 'claude')
const CLAUDE_BIN = process.env.CLAUDE_BIN || (existsSync(LOCAL_CLAUDE) ? LOCAL_CLAUDE : 'claude')

/* `script` lends the CLI a pty, but BSD (macOS) and util-linux (Linux)
   disagree on the syntax */
const ptyArgs = (cmd) =>
  process.platform === 'linux'
    ? ['-qec', cmd, '/dev/null']
    : ['-q', '/dev/null', 'sh', '-c', cmd]

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07]*\x07|\r/g, '')

function loadAuthFile() {
  try { return JSON.parse(readFileSync(AUTH_FILE, 'utf8')) } catch { return {} }
}

export function createAuth(bridge, { codexBin }) {
  let flow = null // { engine, child, timer }

  const send = (o) => {
    console.log(`[auth] ${o.engine} → ${o.phase}${o.error ? `: ${String(o.error).slice(0, 160)}` : ''}`)
    bridge.broadcast({ type: 'auth_event', ...o })
  }

  function endFlow() {
    if (!flow) return
    clearTimeout(flow.timer)
    try { flow.child.kill('SIGTERM') } catch { /* already dead */ }
    flow = null
  }

  function beginFlow(engine, child) {
    endFlow()
    flow = {
      engine,
      child,
      timer: setTimeout(() => {
        send({ engine, phase: 'error', error: 'Tempo scaduto (5 minuti): riprova.' })
        endFlow()
      }, FLOW_TIMEOUT_MS),
    }
    send({ engine, phase: 'started' })
  }

  /* ---------- ChatGPT / Codex ---------- */
  function startCodex() {
    let child
    try {
      child = spawn(codexBin, ['login'], { stdio: ['ignore', 'pipe', 'pipe'] })
    } catch {
      send({ engine: 'codex', phase: 'error', error: 'Codex CLI non trovato (npm install).' })
      return
    }
    beginFlow('codex', child)

    let out = ''
    let urlSent = false
    const onData = (c) => {
      out += stripAnsi(c.toString())
      const m = out.match(/https:\/\/auth\.openai\.com\S+/)
      if (m && !urlSent) {
        urlSent = true
        send({ engine: 'codex', phase: 'url', url: m[0].replace(/[)\].,]+$/, '') })
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('error', () => {
      send({ engine: 'codex', phase: 'error', error: 'Impossibile avviare Codex CLI.' })
      endFlow()
    })
    child.on('close', (code) => {
      if (!flow || flow.child !== child) return
      clearTimeout(flow.timer)
      flow = null
      if (code === 0 || /successfully logged in/i.test(out)) {
        send({ engine: 'codex', phase: 'done' })
      } else {
        send({ engine: 'codex', phase: 'error', error: out.trim().slice(-300) || `La CLI è uscita con codice ${code}.` })
      }
    })
  }

  /* ---------- Claude ---------- */
  function startClaude() {
    /* `claude setup-token` wants a TTY: BSD `script` lends it one and
       forwards our stdin writes (the pasted code) to the pty. The terminal
       must be wide, or the pty wraps the OAuth URL across lines. */
    let child
    try {
      child = spawn('script', ptyArgs(`stty cols 500 2>/dev/null; exec "${CLAUDE_BIN}" setup-token`), {
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch {
      send({ engine: 'claude', phase: 'error', error: 'Claude CLI non trovata: installa Claude Code.' })
      return
    }
    beginFlow('claude', child)

    let out = ''
    let urlSent = false
    let tokenSaved = false
    const onData = (c) => {
      out += stripAnsi(c.toString())
      if (!urlSent) {
        const m = out.match(/https:\/\/(?:claude\.(?:ai|com)|console\.anthropic\.com)\/\S*oauth\S+/)
        if (m) {
          urlSent = true
          send({ engine: 'claude', phase: 'url', url: m[0].replace(/[)\].,]+$/, ''), needsCode: true })
        }
      }
      const tok = out.match(/sk-ant-oat[0-9]*-[A-Za-z0-9_-]+/)
      if (tok && !tokenSaved) {
        tokenSaved = true
        writeFileSync(AUTH_FILE, JSON.stringify({ ...loadAuthFile(), claudeToken: tok[0] }, null, 2), { mode: 0o600 })
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('error', () => {
      send({ engine: 'claude', phase: 'error', error: 'Impossibile avviare la CLI di Claude.' })
      endFlow()
    })
    child.on('close', () => {
      if (!flow || flow.child !== child) return
      clearTimeout(flow.timer)
      flow = null
      if (tokenSaved) send({ engine: 'claude', phase: 'done' })
      else send({ engine: 'claude', phase: 'error', error: out.trim().slice(-300) || 'Login non completato.' })
    })
  }

  bridge.onAuth((msg) => {
    if (msg.type === 'auth_start' && msg.engine === 'codex') startCodex()
    else if (msg.type === 'auth_start' && msg.engine === 'claude') startClaude()
    else if (msg.type === 'auth_code' && flow?.engine === 'claude' && typeof msg.code === 'string') {
      flow.child.stdin.write(msg.code.trim() + '\n')
    } else if (msg.type === 'auth_cancel') {
      endFlow()
    }
  })

  return {
    /* long-lived token captured by the guided flow, if any */
    getClaudeToken: () => loadAuthFile().claudeToken ?? null,
  }
}
