/* Trip tools exposed to the agent. Every tool is a thin RPC to the browser
   tab (see bridge.mjs), where it runs against the live zustand store —
   that's what makes each edit appear instantly in the UI. */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'

const ITEM_TYPES = z.enum(['activity', 'drive', 'food', 'hotel', 'info'])

export function createTripTools(bridge) {
  const call = (name) => async (args) => {
    const r = await bridge.callBrowser(name, args)
    return {
      content: [{ type: 'text', text: r.ok ? JSON.stringify(r.result ?? { ok: true }) : `ERRORE: ${r.error}` }],
      isError: !r.ok,
    }
  }

  const tools = [
    tool(
      'get_trip',
      "Snapshot completo del viaggio attivo: giorni numerati (1-based) con id, titolo, notte, data; attività con id, tipo, orario, durata, costo, coordinate, flag; checklist; auto; budget e km. Chiamalo SEMPRE prima di modificare qualcosa.",
      {},
      call('get_trip'),
    ),
    tool(
      'add_activity',
      "Aggiunge un'attività al viaggio. Se optimal_placement è true (default quando non indichi day_number) viene inserita nel giorno e nel punto del percorso che aggiungono meno strada (serve lat/lng). Altrimenti va in coda al giorno indicato, o in posizione `index`.",
      {
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
      call('add_activity'),
    ),
    tool(
      'update_activity',
      "Modifica i campi di un'attività esistente (identificata da item_id preso da get_trip). Passa solo i campi da cambiare.",
      {
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
      call('update_activity'),
    ),
    tool('remove_activity', "Elimina un'attività dal viaggio.", { item_id: z.string() }, call('remove_activity')),
    tool(
      'move_activity',
      "Sposta un'attività in un altro giorno e/o posizione. Con optimal_placement true ricalcola il punto migliore del percorso.",
      {
        item_id: z.string(),
        day_number: z.number().int().min(1).optional(),
        index: z.number().int().min(0).optional(),
        optimal_placement: z.boolean().optional(),
      },
      call('move_activity'),
    ),
    tool(
      'add_day',
      'Aggiunge un giorno in coda al viaggio.',
      { title: z.string(), night: z.string().optional().describe('dove si dorme') },
      call('add_day'),
    ),
    tool(
      'update_day',
      'Modifica titolo o luogo della notte di un giorno.',
      { day_number: z.number().int().min(1), title: z.string().optional(), night: z.string().optional() },
      call('update_day'),
    ),
    tool('remove_day', 'Elimina un giorno e tutte le sue attività. Usalo solo su richiesta esplicita.', { day_number: z.number().int().min(1) }, call('remove_day')),
    tool(
      'move_day',
      'Sposta un giorno su o giù di una posizione.',
      { day_number: z.number().int().min(1), direction: z.enum(['up', 'down']) },
      call('move_day'),
    ),
    tool(
      'set_trip_meta',
      "Imposta i metadati del viaggio: titolo, data di partenza (YYYY-MM-DD, le date dei giorni si ricalcolano), auto (consumo L/100km, prezzo benzina $/gallone).",
      {
        title: z.string().optional(),
        start_date: z.string().optional(),
        car_l_per_100km: z.number().positive().optional(),
        car_gas_usd_per_gal: z.number().positive().optional(),
      },
      call('set_trip_meta'),
    ),
    tool('checklist_add', 'Aggiunge una voce alla checklist pre-partenza.', { text: z.string() }, call('checklist_add')),
    tool('checklist_toggle', 'Spunta/de-spunta una voce della checklist (id da get_trip).', { check_id: z.string() }, call('checklist_toggle')),
    tool('checklist_remove', 'Elimina una voce della checklist.', { check_id: z.string() }, call('checklist_remove')),
    tool(
      'search_places',
      'Cerca un luogo per nome (geocoding gratuito Nominatim) e restituisce nome completo e coordinate. Usalo SEMPRE per ottenere lat/lng reali: non inventare mai coordinate.',
      { query: z.string().describe('es. "Bixby Bridge, California"') },
      call('search_places'),
    ),
    tool('list_suggestions', 'Elenca le tappe suggerite del catalogo (con stato attivo/inattivo e giorno ottimale stimato).', {}, call('list_suggestions')),
    tool('toggle_suggestion', 'Attiva o disattiva una tappa suggerita del catalogo (inserimento nel punto ottimale del percorso).', { suggestion_id: z.string() }, call('toggle_suggestion')),
    tool('get_route_info', 'Km su strada per giorno (OSRM) e totali, più tempi di guida dichiarati.', {}, call('get_route_info')),
  ]

  return createSdkMcpServer({ name: 'trip', version: '1.0.0', tools })
}

export const TRIP_TOOL_NAMES = [
  'get_trip', 'add_activity', 'update_activity', 'remove_activity', 'move_activity',
  'add_day', 'update_day', 'remove_day', 'move_day', 'set_trip_meta',
  'checklist_add', 'checklist_toggle', 'checklist_remove',
  'search_places', 'list_suggestions', 'toggle_suggestion', 'get_route_info',
].map((n) => `mcp__trip__${n}`)
