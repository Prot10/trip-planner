/* Trip tool definitions, shared by both engines:
   - Claude Agent SDK (in-process MCP server via createSdkMcpServer)
   - Codex (HTTP MCP endpoint, see mcp-http.mjs)
   Every tool is a thin RPC to the browser tab (bridge.mjs), where it runs
   against the live zustand store — that's what makes edits appear live. */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'

const ITEM_TYPES = z.enum(['activity', 'drive', 'food', 'hotel', 'info'])

export const TOOL_DEFS = [
  {
    name: 'get_trip',
    description:
      "Snapshot del viaggio attivo: giorni numerati (1-based) con attività (id, tipo, orario, durata, costo, coordinate), checklist, auto, budget e km. Con day_number restituisce le attività solo di quel giorno (più economico). Chiamalo prima di modificare, se non hai già lo stato aggiornato in contesto.",
    schema: { day_number: z.number().int().min(1).optional().describe('limita il dettaglio a un giorno') },
  },
  {
    name: 'add_activity',
    description:
      "Aggiunge un'attività al viaggio. Se optimal_placement è true (default quando non indichi day_number) viene inserita nel giorno e nel punto del percorso che aggiungono meno strada (serve lat/lng). Altrimenti va in coda al giorno indicato, o in posizione `index`.",
    schema: {
      title: z.string(),
      type: ITEM_TYPES.default('activity'),
      day_number: z.number().int().min(1).optional(),
      index: z.number().int().min(0).optional().describe('posizione nel giorno (0-based)'),
      optimal_placement: z.boolean().optional(),
      time: z.string().optional().describe('HH:MM'),
      duration_min: z.number().int().min(0).optional(),
      price_usd: z.number().min(0).optional(),
      notes: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
      must_see: z.boolean().optional(),
    },
  },
  {
    name: 'update_activity',
    description: "Modifica i campi di un'attività esistente (item_id da get_trip). Passa solo i campi da cambiare.",
    schema: {
      item_id: z.string(),
      title: z.string().optional(),
      type: ITEM_TYPES.optional(),
      time: z.string().optional(),
      duration_min: z.number().int().min(0).optional(),
      price_usd: z.number().min(0).optional(),
      notes: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
      must_see: z.boolean().optional(),
      done: z.boolean().optional(),
    },
  },
  { name: 'remove_activity', description: "Elimina un'attività dal viaggio.", schema: { item_id: z.string() } },
  {
    name: 'move_activity',
    description: "Sposta un'attività in un altro giorno e/o posizione. Con optimal_placement true ricalcola il punto migliore del percorso.",
    schema: {
      item_id: z.string(),
      day_number: z.number().int().min(1).optional(),
      index: z.number().int().min(0).optional(),
      optimal_placement: z.boolean().optional(),
    },
  },
  { name: 'add_day', description: 'Aggiunge un giorno in coda al viaggio.', schema: { title: z.string(), night: z.string().optional().describe('dove si dorme') } },
  {
    name: 'update_day',
    description: 'Modifica titolo o luogo della notte di un giorno.',
    schema: { day_number: z.number().int().min(1), title: z.string().optional(), night: z.string().optional() },
  },
  { name: 'remove_day', description: 'Elimina un giorno e tutte le sue attività. Usalo solo su richiesta esplicita.', schema: { day_number: z.number().int().min(1) } },
  { name: 'move_day', description: 'Sposta un giorno su o giù di una posizione.', schema: { day_number: z.number().int().min(1), direction: z.enum(['up', 'down']) } },
  {
    name: 'set_trip_meta',
    description: 'Imposta i metadati del viaggio: titolo, data di partenza (YYYY-MM-DD, le date dei giorni si ricalcolano), auto (consumo L/100km, prezzo benzina $/gallone).',
    schema: {
      title: z.string().optional(),
      start_date: z.string().optional(),
      car_l_per_100km: z.number().positive().optional(),
      car_gas_usd_per_gal: z.number().positive().optional(),
    },
  },
  { name: 'checklist_add', description: 'Aggiunge una voce alla checklist pre-partenza.', schema: { text: z.string() } },
  { name: 'checklist_toggle', description: 'Spunta/de-spunta una voce della checklist (id da get_trip).', schema: { check_id: z.string() } },
  { name: 'checklist_remove', description: 'Elimina una voce della checklist.', schema: { check_id: z.string() } },
  {
    name: 'search_places',
    description: 'Cerca un luogo per nome (geocoding gratuito Nominatim) e restituisce nome completo e coordinate. Usalo SEMPRE per ottenere lat/lng reali: non inventare mai coordinate.',
    schema: { query: z.string().describe('es. "Bixby Bridge, California"') },
  },
  {
    name: 'get_place_images',
    description: "Foto reali di un luogo (articoli Wikipedia geolocalizzati): fino a 5 URL con titolo. Usale quando descrivi o proponi un posto, incorporandole in markdown ![titolo](url).",
    schema: { lat: z.number(), lng: z.number() },
  },
  { name: 'list_suggestions', description: 'Elenca le tappe suggerite del catalogo (con stato attivo/inattivo e giorno ottimale stimato).', schema: {} },
  { name: 'toggle_suggestion', description: 'Attiva o disattiva una tappa suggerita del catalogo (inserimento nel punto ottimale del percorso).', schema: { suggestion_id: z.string() } },
  { name: 'get_route_info', description: 'Km su strada per giorno (OSRM) e totali, più tempi di guida dichiarati.', schema: {} },
]

/* fields captured browser-side for the edit-review UI, useless to the model */
const INTERNAL_FIELDS = ['undo', 'detail']

export function makeToolHandler(bridge, name) {
  return async (args) => {
    const r = await bridge.callBrowser(name, args)
    let payload = r.result ?? { ok: true }
    if (payload && typeof payload === 'object') {
      payload = Object.fromEntries(Object.entries(payload).filter(([k]) => !INTERNAL_FIELDS.includes(k)))
    }
    return {
      content: [{ type: 'text', text: r.ok ? JSON.stringify(payload) : `ERRORE: ${r.error}` }],
      isError: !r.ok,
    }
  }
}

/* --- Claude Agent SDK adapter --- */
export function createTripTools(bridge) {
  return createSdkMcpServer({
    name: 'trip',
    version: '1.0.0',
    tools: TOOL_DEFS.map((d) => tool(d.name, d.description, d.schema, makeToolHandler(bridge, d.name))),
  })
}

/* --- JSON Schema list for the HTTP MCP endpoint (Codex & future clients) --- */
export function toolJsonSchemas() {
  return TOOL_DEFS.map((d) => ({
    name: d.name,
    description: d.description,
    inputSchema: z.toJSONSchema(z.object(d.schema)),
  }))
}

export const TRIP_TOOL_NAMES = TOOL_DEFS.map((d) => `mcp__trip__${d.name}`)
