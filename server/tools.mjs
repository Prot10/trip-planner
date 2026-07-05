/* Trip tool definitions, shared by both engines:
   - Claude Agent SDK (in-process MCP server via createSdkMcpServer)
   - Codex (HTTP MCP endpoint, see mcp-http.mjs)
   Every tool is a thin RPC to the browser tab (bridge.mjs), where it runs
   against the live zustand store — that's what makes edits appear live. */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'
import { searchHotels } from './booking.mjs'

const ITEM_TYPES = z.enum(['activity', 'drive', 'food', 'hotel', 'info'])
const TRANSPORT = z.enum(['car', 'walk', 'bus', 'train', 'plane', 'boat'])
const CATEGORY = z.enum(['attraction', 'museum', 'restaurant', 'cafe', 'hotel', 'park'])

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
      transport_mode: TRANSPORT.optional().describe('solo per type=drive: mezzo dello spostamento'),
      category: CATEGORY.optional().describe('categoria del luogo (badge e filtro mappa)'),
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
      transport_mode: TRANSPORT.optional().describe('solo per type=drive: mezzo dello spostamento'),
      category: CATEGORY.optional().describe('categoria del luogo (badge e filtro mappa)'),
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
    description: 'Modifica titolo, luogo della notte o colore (hex) di un giorno.',
    schema: { day_number: z.number().int().min(1), title: z.string().optional(), night: z.string().optional(), color: z.string().optional().describe('es. #f59e0b') },
  },
  { name: 'remove_day', description: 'Elimina un giorno e tutte le sue attività. Usalo solo su richiesta esplicita.', schema: { day_number: z.number().int().min(1) } },
  { name: 'move_day', description: 'Sposta un giorno su o giù di una posizione.', schema: { day_number: z.number().int().min(1), direction: z.enum(['up', 'down']) } },
  {
    name: 'set_trip_meta',
    description:
      "Imposta i metadati del viaggio: titolo, sottotitolo, data di partenza (YYYY-MM-DD, le date dei giorni si ricalcolano), mezzo principale, auto. Per l'auto: car_model (marca e modello, es. 'Dacia Duster'), car_l_per_100km (consumo), car_gas_price + car_gas_unit (prezzo del carburante NELL'UNITÀ LOCALE della destinazione: eur_l in Europa, usd_gal negli USA — cerca sul web il prezzo medio attuale).",
    schema: {
      title: z.string().optional(),
      subtitle: z.string().optional(),
      start_date: z.string().optional(),
      transport: z.enum(['car', 'walk', 'transit', 'mixed']).optional(),
      currency: z.enum(['USD', 'EUR']).optional().describe('valuta del viaggio: tutti i prezzi sono espressi in questa valuta'),
      car_model: z.string().optional(),
      car_l_per_100km: z.number().positive().optional(),
      car_gas_price: z.number().positive().optional(),
      car_gas_unit: z.enum(['usd_gal', 'usd_l', 'eur_l']).optional(),
      car_gas_usd_per_gal: z.number().positive().optional().describe('deprecato: usa car_gas_price + car_gas_unit'),
    },
  },
  {
    name: 'ask_user',
    description:
      "Fai le tue domande all'utente tramite un carosello interattivo e ATTENDI le risposte (il tool blocca finché non ha risposto a TUTTE). Passa in `questions` da 1 a 6 domande: RAGGRUPPA SEMPRE in un'unica chiamata tutte le domande che ti servono in quel momento — mai una chiamata per domanda, mai elenchi di domande nel testo. kind per ogni domanda: 'single' = una sola opzione, 'multi' = più opzioni, 'open' = risposta libera. Per single/multi fornisci 2-5 opzioni concrete (label breve + description opzionale) e metti allow_other=true se ha senso una risposta fuori lista. Il risultato contiene le risposte in ordine.",
    schema: {
      questions: z
        .array(
          z.object({
            question: z.string(),
            kind: z.enum(['single', 'multi', 'open']),
            options: z.array(z.object({ label: z.string(), description: z.string().optional() })).max(5).optional(),
            allow_other: z.boolean().optional(),
          }),
        )
        .min(1)
        .max(6)
        .describe('tutte le domande di questo momento, dalla più importante'),
    },
  },
  {
    name: 'update_notes',
    description:
      "Il tuo BLOCCO NOTE per questo viaggio (memoria persistente, markdown, sostituisce il contenuto precedente). Aggiornalo UNA volta dopo ogni batch di risposte di ask_user (tutte le novità in una sola chiamata; sezioni: Destinazione, Date, Viaggiatori, Mezzo, Stile e interessi, Budget, Alloggi, Vincoli) e dopo ogni decisione importante in pianificazione. Ti viene sempre re-iniettato: è la tua memoria tra i turni.",
    schema: { notes: z.string().describe('contenuto completo del blocco note in markdown') },
  },
  {
    name: 'add_suggestion',
    description:
      "Aggiunge un'idea al pannello Consigli del viaggio: tappe extra valide che NON hai inserito nell'itinerario (l'utente può attivarle con un click, inserite nel punto ottimale). Usale a fine pianificazione per le idee avanzate. Servono coordinate reali da search_places.",
    schema: {
      title: z.string(),
      type: z.enum(['activity', 'food', 'hotel']).optional(),
      category: CATEGORY.describe('categoria del luogo, SEMPRE obbligatoria: appare come badge e filtra la mappa'),
      duration_min: z.number().int().min(0).optional(),
      notes: z.string().describe('perché vale la pena, in 1-2 frasi'),
      lat: z.number(),
      lng: z.number(),
      recommended: z.boolean().optional(),
    },
  },
  { name: 'remove_suggestion', description: 'Elimina un consiglio dal pannello (id da list_suggestions).', schema: { suggestion_id: z.string() } },
  {
    name: 'set_trip_brief',
    description: "Aggiorna il profilo del viaggio (già salvato da start_planning): chi viaggia, periodo, stile e ritmo, mezzo, budget, alloggi, vincoli e interessi. È la memoria delle preferenze: consultala (via get_trip) prima di ogni scelta di pianificazione; riscrivila qui quando l'utente cambia idea.",
    schema: { brief: z.string() },
  },
  {
    name: 'start_planning',
    description: "Chiude l'intervista e apre il planner: salva il brief, imposta i metadati e porta il viaggio in fase attiva (l'interfaccia cambia vista). Appena l'utente conferma il riassunto, questa è la tua PRIMA chiamata — i tool di costruzione (giorni, tappe, checklist, consigli) restano bloccati finché non la fai. Chiamala UNA sola volta, poi prosegui subito con la pianificazione completa nello stesso turno.",
    schema: {
      title: z.string().describe('titolo evocativo del viaggio'),
      subtitle: z.string().optional().describe('sintesi del percorso, es. "Roma → Firenze → Venezia · 5 giorni"'),
      destination: z.string().describe('città o area principale del viaggio, es. "Tokyo, Giappone": centra subito la mappa lì'),
      brief: z.string().describe('il profilo completo raccolto in intervista: chi viaggia, periodo, stile e ritmo, mezzo, budget, alloggi, vincoli e interessi'),
      transport: z.enum(['car', 'walk', 'transit', 'mixed']),
      start_date: z.string().optional().describe('YYYY-MM-DD'),
      car_l_per_100km: z.number().positive().optional(),
      car_gas_usd_per_gal: z.number().positive().optional(),
    },
  },
  {
    name: 'report_progress',
    description:
      "Lo stepper di avanzamento visibile all'utente. All'INIZIO della costruzione dichiara l'INTERO piano in una chiamata sola con `steps` (tutte le macro-fasi, status 'pending'). Poi, man mano che lavori, chiama con la singola `step`: status 'start' quando la apri, 'done' sulla STESSA step quando la chiudi. Niente passi a sorpresa: se serve una fase nuova aggiungila con 'pending' prima di iniziarla. È l'unico feedback visivo durante il lavoro lungo.",
    schema: {
      step: z.string().optional().describe('titolo breve della fase, max 6 parole'),
      status: z.enum(['pending', 'start', 'done', 'error']).optional(),
      detail: z.string().optional(),
      steps: z.array(z.string()).optional().describe("dichiarazione iniziale: TUTTE le fasi del piano, in ordine"),
    },
  },
  {
    name: 'estimate_travel',
    description: "Stima realistica di uno spostamento tra due punti: km e minuti su strade reali per auto/bus/piedi (OSRM); per treno/aereo/traghetto solo distanza (la durata va verificata con la ricerca web). USALO per ogni spostamento che crei: mai inventare durate di viaggio.",
    schema: {
      from_lat: z.number(), from_lng: z.number(),
      to_lat: z.number(), to_lng: z.number(),
      mode: TRANSPORT,
    },
  },
  { name: 'checklist_add', description: 'Aggiunge una voce alla checklist pre-partenza.', schema: { text: z.string() } },
  { name: 'checklist_toggle', description: 'Spunta/de-spunta una voce della checklist (id da get_trip).', schema: { check_id: z.string() } },
  { name: 'checklist_remove', description: 'Elimina una voce della checklist.', schema: { check_id: z.string() } },
  {
    name: 'search_hotels',
    description:
      "Cerca alloggi REALI su Booking.com per una località e date precise: nome, prezzo TOTALE reale del soggiorno, punteggio recensioni, disponibilità per quelle date (available=false = al completo) e link diretto con date e ospiti precompilati. USALO per ogni notte prima di creare l'item hotel: prezzo/notte = total_price/nights, link 'Booking.com' tra i links dell'item. Se properties è vuoto, usa search_url come link e stima il prezzo dal budget dichiarandolo stima. Richiede qualche secondo: chiamalo una volta per località-notte, non per singolo hotel.",
    schema: {
      location: z.string().describe('località della notte, es. "Vík í Mýrdal, Iceland"'),
      checkin: z.string().describe('YYYY-MM-DD'),
      checkout: z.string().describe('YYYY-MM-DD'),
      adults: z.number().int().min(1).max(10).optional().describe('default 2'),
      rooms: z.number().int().min(1).max(5).optional().describe('default 1'),
      currency: z.enum(['EUR', 'USD']).optional().describe('valuta del viaggio'),
      max_results: z.number().int().min(1).max(10).optional().describe('default 6'),
    },
    handler: searchHotels,
  },
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
  const def = TOOL_DEFS.find((d) => d.name === name)
  /* tools with a `handler` run HERE on the server (network, headless
     Chrome…): the browser tab never sees them */
  if (def?.handler) {
    return async (args) => {
      try {
        const payload = await def.handler(args ?? {})
        return { content: [{ type: 'text', text: JSON.stringify(payload) }], isError: false }
      } catch (e) {
        return { content: [{ type: 'text', text: `ERRORE: ${String(e?.message ?? e)}` }], isError: true }
      }
    }
  }
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
