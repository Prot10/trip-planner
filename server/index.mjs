/* Trip Planner agent server: WebSocket bridge to the browser + Claude Agent
   SDK chat sessions. Run alongside Vite with `npm run dev`, or standalone
   with `npm start`: when a production build exists in dist/, this server
   also serves the app itself, so one port runs everything. */

import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, extname, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBridge } from './bridge.mjs'
import { createAgent, CODEX_BIN } from './agent.mjs'
import { createAuth } from './auth.mjs'
import { createMcpHandler } from './mcp-http.mjs'
import { createStorage } from './storage.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.AGENT_PORT || 5200)
/* 127.0.0.1 by default; Docker sets AGENT_HOST=0.0.0.0 */
const HOST = process.env.AGENT_HOST || '127.0.0.1'
const DIST = join(__dirname, '..', 'dist')
let mcpHandler = null

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.webp': 'image/webp', '.map': 'application/json',
}

/* serve the built SPA (index.html fallback for client-side routes) */
function serveStatic(req, res) {
  if (!existsSync(DIST)) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('No production build found. Run `npm run build` (or use `npm run dev`).')
    return
  }
  const url = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  let file = join(DIST, url === '/' ? 'index.html' : url)
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(DIST, 'index.html')
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}

/* storage broadcasts through the bridge, which is created after the server:
   route through a late-bound proxy */
const storage = createStorage({ broadcast: (o) => bridge?.broadcast(o) })

const http = createServer(async (req, res) => {
  if (await storage.handle(req, res)) return
  if (req.url === '/mcp') {
    mcpHandler?.(req, res)
    return
  }
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
  serveStatic(req, res)
})

const bridge = createBridge(http)
mcpHandler = createMcpHandler(bridge)
const auth = createAuth(bridge, { codexBin: process.env.CODEX_BIN || CODEX_BIN, getAuthPath: storage.getAuthPath })
createAgent(bridge, { mcpPort: PORT, auth })

http.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(
      `[agent-server] port ${PORT} is already in use: another \`npm run dev\` is probably still running.\n` +
      `[agent-server] close it, or free the port with:  lsof -ti tcp:${PORT} | xargs kill`,
    )
    process.exit(1)
  }
  throw e
})

http.listen(PORT, HOST, () => {
  console.log(`[agent-server] ready on ws://localhost:${PORT}/agent (MCP: http://localhost:${PORT}/mcp)`)
  if (existsSync(DIST)) console.log(`[agent-server] serving the app → http://localhost:${PORT}`)
})
