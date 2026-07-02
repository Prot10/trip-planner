/* Claude Agent SDK session driver: one chat session per browser connection,
   streamed back over the bridge. Uses the local `claude` CLI login
   (Pro/Max subscription) — no API key involved. */

import { query } from '@anthropic-ai/claude-agent-sdk'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createTripTools, TRIP_TOOL_NAMES } from './tools.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts', 'system.md'), 'utf8')
const MAX_TURNS = 30

export function createAgent(bridge) {
  const tripServer = createTripTools(bridge)
  let sessionId = null      // resume token for multi-turn context
  let active = null         // AbortController of the in-flight turn

  async function runTurn(text) {
    if (active) { bridge.broadcast({ type: 'agent_error', error: 'Un turno è già in corso.' }); return }
    const abort = new AbortController()
    active = abort
    bridge.broadcast({ type: 'turn_start' })

    try {
      const q = query({
        prompt: text,
        options: {
          systemPrompt: SYSTEM_PROMPT,
          mcpServers: { trip: tripServer },
          allowedTools: TRIP_TOOL_NAMES,
          tools: [],
          permissionMode: 'bypassPermissions',
          maxTurns: MAX_TURNS,
          abortController: abort,
          ...(sessionId ? { resume: sessionId } : {}),
        },
      })

      for await (const msg of q) {
        if (msg.type === 'system' && msg.subtype === 'init') {
          sessionId = msg.session_id ?? sessionId
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
          sessionId = msg.session_id ?? sessionId
          if (msg.subtype !== 'success' && msg.subtype !== undefined) {
            bridge.broadcast({ type: 'agent_error', error: `Il turno si è interrotto (${msg.subtype}).` })
          }
        }
      }
    } catch (e) {
      if (!abort.signal.aborted) {
        const hint = /login|auth|credential/i.test(String(e?.message))
          ? " Verifica di aver eseguito l'accesso con `claude` (abbonamento) sul terminale."
          : ''
        bridge.broadcast({ type: 'agent_error', error: `${e?.message ?? e}${hint}` })
      }
    } finally {
      active = null
      bridge.broadcast({ type: 'turn_end' })
    }
  }

  bridge.onChat((msg) => {
    if (msg.type === 'chat' && typeof msg.text === 'string' && msg.text.trim()) {
      runTurn(msg.text.trim())
    } else if (msg.type === 'stop') {
      active?.abort()
    } else if (msg.type === 'reset') {
      active?.abort()
      sessionId = null
      bridge.broadcast({ type: 'session_reset' })
    }
  })
}
