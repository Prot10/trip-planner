/* Trip Planner agent server: WebSocket bridge to the browser + Claude Agent
   SDK chat sessions. Run alongside Vite with `npm run dev`. */

import { createServer } from 'node:http'
import { createBridge } from './bridge.mjs'
import { createAgent } from './agent.mjs'

const PORT = Number(process.env.AGENT_PORT || 5200)

const http = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true, tabs: bridge?.tabCount ?? 0 }))
    return
  }
  /* localhost-only debug hook: exercise the browser bridge without the model */
  if (req.method === 'POST' && req.url === '/debug/tool') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', async () => {
      try {
        const { name, args } = JSON.parse(body || '{}')
        const result = await bridge.callBrowser(name, args ?? {})
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (e) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: String(e?.message ?? e) }))
      }
    })
    return
  }
  res.writeHead(404)
  res.end()
})

const bridge = createBridge(http)
createAgent(bridge)

http.listen(PORT, '127.0.0.1', () => {
  console.log(`[agent-server] pronto su ws://localhost:${PORT}/agent`)
})
