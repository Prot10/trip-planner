/* Minimal MCP server over Streamable HTTP (stateless, JSON responses).
   Lets any MCP client — Codex today, Claude Desktop / ChatGPT connectors
   tomorrow — call the trip tools; execution still happens in the browser. */

import { toolJsonSchemas, makeToolHandler } from './tools.mjs'

const PROTOCOL_VERSION = '2025-03-26'

export function createMcpHandler(bridge) {
  const handlers = new Map()
  for (const t of toolJsonSchemas()) handlers.set(t.name, makeToolHandler(bridge, t.name))

  return function handleMcp(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405, { allow: 'POST' })
      res.end()
      return
    }
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', async () => {
      let msg
      try { msg = JSON.parse(body || '{}') } catch {
        respond(res, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
        return
      }
      /* notifications need no response body */
      if (msg.id === undefined || msg.id === null) {
        res.writeHead(202)
        res.end()
        return
      }
      try {
        const result = await dispatch(msg)
        respond(res, { jsonrpc: '2.0', id: msg.id, result })
      } catch (e) {
        respond(res, { jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: String(e?.message ?? e) } })
      }
    })
  }

  async function dispatch(msg) {
    switch (msg.method) {
      case 'initialize':
        return {
          protocolVersion: msg.params?.protocolVersion ?? PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: 'trip-planner', version: '1.0.0' },
        }
      case 'ping':
        return {}
      case 'tools/list':
        return { tools: toolJsonSchemas() }
      case 'tools/call': {
        const fn = handlers.get(msg.params?.name)
        if (!fn) throw new Error(`Tool sconosciuto: ${msg.params?.name}`)
        return await fn(msg.params?.arguments ?? {})
      }
      default:
        throw new Error(`Metodo non supportato: ${msg.method}`)
    }
  }
}

function respond(res, payload) {
  const data = JSON.stringify(payload)
  res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) })
  res.end(data)
}
