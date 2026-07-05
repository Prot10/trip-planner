/* Demo-mode content: the scripted Ulisse conversation and the Iceland trip
   it builds live, in both languages. Pure data — the playback engine that
   turns this into streamed events lives in agent.js. */

const L = (lang, it, en) => (lang === 'it' ? it : en)

/* ---------- interview questions ---------- */

export const questions = (lang) => [
  {
    question: L(lang, 'Quante giornate piene avete a disposizione?', 'How many full days do you have?'),
    kind: 'single',
    options: [
      { label: L(lang, '5 giorni', '5 days'), description: L(lang, 'Golden Circle e costa sud fino alla laguna di Jökulsárlón', 'Golden Circle and the south coast to the Jökulsárlón lagoon') },
      { label: L(lang, 'Una settimana', 'A full week'), description: L(lang, "TUTTO l'anello: l'isola intera, Ring Road completa", 'The FULL ring: the whole island, complete Ring Road') },
      { label: L(lang, '10 giorni', '10 days'), description: L(lang, 'Anello con calma + penisola di Snæfellsnes', 'The ring at an easier pace + the Snæfellsnes peninsula') },
    ],
    allow_other: true,
  },
  {
    question: L(lang, 'Che ritmo preferite?', 'What pace do you prefer?'),
    kind: 'single',
    options: [
      { label: L(lang, 'Giornate piene', 'Full-on days'), description: L(lang, 'Sveglie presto, si vede tutto il possibile', 'Early starts, see as much as possible') },
      { label: L(lang, 'Un buon mix', 'A good mix'), description: L(lang, 'Un paio di alzatacce solo per i posti top', 'A couple of early alarms, only for the highlights') },
      { label: L(lang, 'Con calma', 'Take it easy'), description: L(lang, 'Meno tappe, più tempo in ognuna', 'Fewer stops, more time at each one') },
    ],
    allow_other: false,
  },
  {
    question: L(lang, 'Cosa non può assolutamente mancare?', 'What absolutely cannot be missed?'),
    kind: 'multi',
    options: [
      { label: L(lang, 'Cascate', 'Waterfalls'), description: L(lang, 'Gullfoss, Seljalandsfoss, Skógafoss…', 'Gullfoss, Seljalandsfoss, Skógafoss…') },
      { label: L(lang, 'Ghiacciai e lagune', 'Glaciers and lagoons'), description: L(lang, 'Sólheimajökull, Jökulsárlón, Diamond Beach', 'Sólheimajökull, Jökulsárlón, Diamond Beach') },
      { label: L(lang, 'Spiagge nere', 'Black sand beaches'), description: L(lang, 'Reynisfjara e Dyrhólaey', 'Reynisfjara and Dyrhólaey') },
      { label: L(lang, 'Terme e piscine calde', 'Hot springs and pools'), description: L(lang, 'Sky Lagoon, Seljavallalaug', 'Sky Lagoon, Seljavallalaug') },
      { label: L(lang, 'Posti segreti', 'Hidden gems'), description: L(lang, 'Brúarfoss, Kvernufoss, Fjallsárlón…', 'Brúarfoss, Kvernufoss, Fjallsárlón…') },
    ],
    allow_other: true,
  },
]

/* ---------- conversation texts ---------- */

export const texts = (lang) => ({
  greeting: L(
    lang,
    "Cascate, ghiacciai, spiagge nere, fiordi **e** bagni caldi: l'Islanda a inizio agosto è esattamente questo — e con la Ring Road si può fare il giro completo dell'isola senza mai rifare la stessa strada. Ottima scelta anche per la guida: strade buone, luce fino alle dieci di sera.\n\nPrima di disegnare l'itinerario mi servono tre risposte veloci: le trovi tutte qui sotto, scorrile e rispondi. Appena ho tutto prendo nota sul mio taccuino, lo vedi accanto alla chat.\n\n*(Questa è una demo interattiva: la conversazione è preregistrata, ma tutto quello che vedi — tappe, mappa, budget — viene costruito dal vivo, esattamente come col vero Ulisse.)*",
    "Waterfalls, glaciers, black beaches, fjords **and** hot soaks: Iceland in early August is exactly that — and the Ring Road loops the whole island without ever driving the same road twice. Great call on driving too: good roads, daylight until 10pm.\n\nBefore I sketch the itinerary I need three quick answers — you'll find them all right below, swipe through and answer. Once I have everything I jot it down in my notebook, right next to the chat.\n\n*(This is an interactive demo: the conversation is pre-recorded, but everything you see — stops, map, budget — is built live, exactly like with the real Ulisse.)*",
  ),
  ready: L(
    lang,
    "Ho tutto quello che mi serve. Apro il planner e costruisco l'itinerario tappa per tappa: guarda la mappa riempirsi.",
    'I have everything I need. Opening the planner and building the itinerary stop by stop — watch the map fill up.',
  ),
  rebuilding: L(
    lang,
    "Riprendo da capo l'itinerario per ricostruirlo pulito.",
    'Starting the itinerary over so I can rebuild it cleanly.',
  ),
  summary: L(
    lang,
    `Ecco il vostro viaggio: **il Grande Anello in 7 giorni** — tutta l'Islanda in senso orario, da Reykjavík alla laguna di Jökulsárlón, su per i fiordi orientali, Mývatn e la costa nord, e ritorno dalla porta ovest. Con quattro gemme fuori dai flussi: **Brúarfoss**, **Kvernufoss**, **Stuðlagil** e **Fjallsárlón**.

Come l'ho costruito:
- **Ritmo**: partenze tra le 7:30 e le 8:15, mai dopo — ad agosto la luce dura fino alle 22 ma i parcheggi dei posti famosi alle 10 sono pieni. L'unica vera alzataccia è l'alba a Stokksnes, e ne vale ogni minuto.
- **Notti** sempre in avanzamento (Selfoss → Vík → Höfn → Seyðisfjörður → Mývatn → Borgarnes): è un anello, la stessa strada non si rifà MAI. Le tratte lunghe (fiordi, costa nord) sono spezzate da soste vere, non riempitivi.
- **Budget** in alto a destra: hotel, pasti, ingressi e carburante sui km veri del percorso (~1.700 km). Le voci grosse sono gli hotel di Vík, Höfn e Mývatn — prenotateli per primi, ad agosto finiscono.
- Nella tab **Consigli** trovate gli extra pronti da attivare: Blue Lagoon, le balene da Húsavík, il relitto del DC-3, lo zodiac tra gli iceberg…

Tre cose da non dimenticare: a **Reynisfjara** mai dare le spalle all'oceano; controllate [vedur.is](https://en.vedur.is) e [road.is](https://www.road.is) ogni mattina; fate il pieno quando capita — tra Vík e Höfn e sugli altopiani del nord-est le stazioni sono rare. Buon viaggio!`,
    `Here is your trip: **the full Ring Road in 7 days** — all of Iceland clockwise, from Reykjavík to the Jökulsárlón lagoon, up the East Fjords, Mývatn and the north coast, and back in through the west door. With four gems away from the crowds: **Brúarfoss**, **Kvernufoss**, **Stuðlagil** and **Fjallsárlón**.

How I built it:
- **Pace**: departures between 7:30 and 8:15, never later — in August the light lasts until 10pm but the famous car parks fill up by 10am. The only real early alarm is sunrise at Stokksnes, and it is worth every minute.
- **Nights** always moving forward (Selfoss → Vík → Höfn → Seyðisfjörður → Mývatn → Borgarnes): it is a loop, you NEVER drive the same road twice. The long legs (fjords, north coast) are broken up by real stops, not fillers.
- **Budget** top right: hotels, meals, entry fees and fuel computed on the real route distance (~1,700 km). The big items are the Vík, Höfn and Mývatn hotels — book those first, they sell out in August.
- The **Suggestions** tab holds ready-to-enable extras: Blue Lagoon, whales from Húsavík, the DC-3 plane wreck, the iceberg zodiac tour…

Three things to remember: at **Reynisfjara** never turn your back on the ocean; check [vedur.is](https://en.vedur.is) and [road.is](https://www.road.is) every morning; top up fuel whenever you can — stations are scarce between Vík and Höfn and on the north-east highlands. Enjoy!`,
  ),
  plannerIntro: L(
    lang,
    "In questa demo sono un copione, non un modello vero: non posso rispondere davvero alla tua richiesta. Però ti faccio vedere come lavoro quando modifico un viaggio esistente.",
    "In this demo I'm a script, not a real model, so I can't truly answer your request. But let me show you how I work when editing an existing trip.",
  ),
  plannerSuggest: L(
    lang,
    "Guardo i consigli ancora in lista e attivo i più interessanti: ogni tappa finisce da sola nel punto migliore del percorso.",
    'I will check the remaining suggestions and enable the best ones — each stop lands automatically at the best point of the route.',
  ),
  plannerDone: L(
    lang,
    "Fatto — trovi le modifiche evidenziate nell'itinerario e riepilogate qui sopra: ogni singola modifica si può annullare col pulsante accanto, o tutte insieme.\n\nCol vero Ulisse puoi chiedere qualsiasi cosa: *«aggiungi un giorno a Londra»*, *«troppa guida il giovedì, alleggerisci»*, *«trova un ristorante tipico vicino all'hotel»*…",
    "Done — the changes are highlighted in the itinerary and summarized above: every single edit can be undone with the button next to it, or all at once.\n\nWith the real Ulisse you can ask anything: *\"add a day in London\"*, *\"Thursday has too much driving, lighten it\"*, *\"find a traditional restaurant near the hotel\"*…",
  ),
  plannerChecklist: L(
    lang,
    "Un'altra cosa che faccio spesso: tenere aggiornata la **checklist** pre-partenza. Aggiungo un paio di voci che in Islanda salvano la giornata.",
    "Another thing I do a lot: keeping the pre-departure **checklist** up to date. Let me add a couple of items that save the day in Iceland.",
  ),
  plannerEnd: L(
    lang,
    "E qui finisce il repertorio della demo! Per provare Ulisse davvero — con Claude o Codex, usando i tuoi abbonamenti, senza API key — installa Trip Planner dal [repository GitHub](https://github.com/Prot10/trip-planner): basta un doppio click.",
    "And that's the end of the demo's repertoire! To try the real Ulisse — powered by Claude or Codex through your subscriptions, no API keys — install Trip Planner from the [GitHub repository](https://github.com/Prot10/trip-planner): one double click is all it takes.",
  ),
  progressSteps: [
    L(lang, 'Struttura del viaggio', 'Trip structure'),
    L(lang, 'Tappe giorno per giorno', 'Stops, day by day'),
    L(lang, 'Checklist e consigli', 'Checklist and suggestions'),
    L(lang, 'Rifiniture e budget', 'Final touches and budget'),
  ],
  notesAll: (a1, a2, a3) =>
    L(
      lang,
      `# Islanda — il Grande Anello · inizio agosto\n\n## Richieste\n- In **due**, auto a noleggio, guida ok\n- **Durata**: ${a1} · **Ritmo**: ${a2}\n- **Priorità**: ${a3}\n\n## Piano\n- Ring Road completa in senso orario: Reykjavík → Golden Circle → costa sud → Jökulsárlón → fiordi orientali → Mývatn → Akureyri → costa nord-ovest → Reykjavík\n- Notti in avanzamento: Selfoss → Vík → Höfn → Seyðisfjörður → Mývatn → Borgarnes (mai la stessa strada due volte: è un anello)\n- Gemme fuori flusso: Brúarfoss, Kvernufoss, Stuðlagil, Fjallsárlón\n- Prenotare SUBITO: hotel Vík, Höfn e Mývatn, Sky Lagoon\n- Alzataccia unica: alba a Stokksnes (giorno 4)`,
      `# Iceland — the full Ring Road · early August\n\n## Requirements\n- **Two** travellers, rental car, happy to drive\n- **Duration**: ${a1} · **Pace**: ${a2}\n- **Priorities**: ${a3}\n\n## Plan\n- Complete Ring Road, clockwise: Reykjavík → Golden Circle → south coast → Jökulsárlón → East Fjords → Mývatn → Akureyri → north-west coast → Reykjavík\n- Nights always moving forward: Selfoss → Vík → Höfn → Seyðisfjörður → Mývatn → Borgarnes (never the same road twice: it is a loop)\n- Off-the-flow gems: Brúarfoss, Kvernufoss, Stuðlagil, Fjallsárlón\n- Book NOW: Vík, Höfn & Mývatn hotels, Sky Lagoon\n- One early alarm: Stokksnes sunrise (day 4)`,
    ),
})

/* ---------- the trip Ulisse builds, as tool-call arguments ---------- */

export const tripMeta = (lang) => ({
  title: L(lang, 'Islanda — il Grande Anello', 'Iceland — The Ring Road'),
  subtitle: L(
    lang,
    'Reykjavík → Vík → Jökulsárlón → fiordi orientali → Mývatn → Akureyri → Reykjavík · 7 giorni / 6 notti',
    'Reykjavík → Vík → Jökulsárlón → East Fjords → Mývatn → Akureyri → Reykjavík · 7 days / 6 nights',
  ),
  brief: L(
    lang,
    'Coppia, giro completo dell’Islanda (Ring Road, senso orario) a inizio agosto, 7 giorni, 4x4 a noleggio. Ritmo: buon mix (un paio di alzatacce solo per i posti top). Priorità: cascate e posti segreti; graditi ghiacciai, spiagge nere, fiordi e bagni caldi. Budget medio, hotel comodi lungo il percorso, notti sempre in avanzamento.',
    'Couple, full lap of Iceland (Ring Road, clockwise) in early August, 7 days, rental 4x4. Pace: a good mix (a couple of early alarms only for the highlights). Priorities: waterfalls and hidden gems; glaciers, black beaches, fjords and hot soaks welcome. Mid-range budget, comfortable hotels along the route, nights always moving forward.',
  ),
  transport: 'car',
  start_date: '2026-08-03',
})

export const carMeta = () => ({
  car_model: 'Dacia Duster 4x4',
  car_l_per_100km: 7.2,
  car_gas_price: 2.35,
  car_gas_unit: 'eur_l',
})

export const days = (lang) => [
  {
    title: L(lang, 'Reykjavík → Golden Circle', 'Reykjavík → Golden Circle'),
    night: 'Selfoss',
    items: [
      { type: 'activity', time: '07:30', duration_min: 30, title: L(lang, 'Ritiro del 4x4 a Reykjavík', 'Pick up the 4x4 in Reykjavík'), notes: L(lang, 'Fotografate ogni graffio prima di firmare. Assicurazione ghiaia (gravel) inclusa: sulle strade islandesi serve davvero.', 'Photograph every scratch before signing. Gravel protection included — you will want it on Icelandic roads.'), lat: 64.1466, lng: -21.9426 },
      { type: 'info', title: L(lang, 'Vento e portiere: la regola n. 1', 'Wind and car doors: rule no. 1'), notes: L(lang, 'Il vento islandese strappa le portiere dalle mani (ed è il danno più comune, NON coperto da tutte le assicurazioni). Aprite sempre tenendole con due mani.', 'Icelandic wind rips car doors out of your hands (the most common damage, NOT covered by every policy). Always open them with two hands.') },
      { type: 'drive', time: '08:10', duration_min: 45, title: L(lang, 'Reykjavík → Þingvellir', 'Reykjavík → Þingvellir'), notes: L(lang, 'Strada 36 lungo il lago Þingvallavatn, si sale sull’altopiano.', 'Road 36 along lake Þingvallavatn, up onto the plateau.') },
      { type: 'activity', time: '09:00', duration_min: 100, title: 'Þingvellir National Park', notes: L(lang, 'Si cammina nella faglia di Almannagjá, TRA la placca americana e quella europea, fino alla cascata Öxarárfoss. Qui nacque il primo parlamento al mondo (930 d.C.). Parcheggio P1, patrimonio UNESCO.', 'Walk inside the Almannagjá rift, BETWEEN the American and European plates, to the Öxarárfoss waterfall. The world’s first parliament was founded here (930 AD). Park at P1, UNESCO site.'), lat: 64.2559, lng: -21.1295, price_usd: 9, must_see: true, links: [{ label: L(lang, 'Sito ufficiale', 'Official site'), url: 'https://www.thingvellir.is/en/' }] },
      { type: 'drive', time: '10:50', duration_min: 40, title: L(lang, 'Þingvellir → Brúarfoss', 'Þingvellir → Brúarfoss'), notes: '' },
      { type: 'activity', time: '11:30', duration_min: 75, title: L(lang, 'Brúarfoss, la cascata blu', 'Brúarfoss, the blue waterfall'), notes: L(lang, 'La cascata più blu d’Islanda, un turchese irreale — e quasi nessuno ci va. 3,5 km a/r a piedi dal parcheggio ufficiale, sentiero facile lungo il fiume Brúará.', 'Iceland’s bluest waterfall, an unreal turquoise — and almost nobody goes. 3.5 km round trip on an easy trail along the Brúará river.'), lat: 64.2647, lng: -20.5158, price_usd: 8, must_see: true },
      { type: 'drive', time: '12:50', duration_min: 20, title: L(lang, 'Brúarfoss → Geysir', 'Brúarfoss → Geysir'), notes: '' },
      { type: 'food', time: '13:10', duration_min: 45, title: L(lang, 'Pranzo al Geysir Center', 'Lunch at the Geysir Center'), notes: L(lang, 'Zuppa di agnello (kjötsúpa) o lo skyr bar. Veloce, onesto, caro il giusto.', 'Lamb soup (kjötsúpa) or the skyr bar. Quick, decent, Icelandic-priced.'), lat: 64.3097, lng: -20.2989, price_usd: 38 },
      { type: 'activity', time: '14:00', duration_min: 45, title: L(lang, 'Geysir e Strokkur', 'Geysir and Strokkur'), notes: L(lang, 'Strokkur erutta ogni 5–10 minuti fino a 20 metri: mettetevi sopravvento e tenete la fotocamera pronta. Il Geysir originale (quello che dà il nome a tutti) dorme qui accanto.', 'Strokkur erupts every 5–10 minutes, up to 20 metres: stay upwind, camera ready. The original Geysir — the one all geysers are named after — sleeps right next to it.'), lat: 64.3104, lng: -20.3024, must_see: true },
      { type: 'drive', time: '14:55', duration_min: 10, title: 'Geysir → Gullfoss', notes: '' },
      { type: 'activity', time: '15:10', duration_min: 60, title: 'Gullfoss', notes: L(lang, 'La “cascata d’oro”: doppio salto di 32 metri nel canyon dell’Hvítá, 140 m³ al secondo. Fate sia il sentiero alto che la piattaforma bassa (se aperta): sono due cascate diverse.', 'The “golden waterfall”: a 32-metre double drop into the Hvítá canyon, 140 m³ per second. Do both the upper trail and the lower platform (if open) — they feel like two different waterfalls.'), lat: 64.3271, lng: -20.1199, must_see: true, links: [{ label: 'Info', url: 'https://www.gullfoss.is' }] },
      { type: 'drive', time: '16:20', duration_min: 50, title: L(lang, 'Gullfoss → Kerið', 'Gullfoss → Kerið'), notes: L(lang, 'Si ridiscende verso sud sulla 35.', 'Back south on road 35.') },
      { type: 'activity', time: '17:15', duration_min: 35, title: L(lang, 'Cratere Kerið', 'Kerið crater'), notes: L(lang, 'Cratere vulcanico di 3.000 anni con un lago turchese sul fondo: il giro del bordo richiede 20 minuti, la luce del tardo pomeriggio accende il rosso delle pareti.', 'A 3,000-year-old volcanic crater with a turquoise lake at the bottom: the rim loop takes 20 minutes, and late-afternoon light sets the red walls on fire.'), lat: 64.0413, lng: -20.885, price_usd: 5 },
      { type: 'drive', time: '18:00', duration_min: 25, title: 'Kerið → Selfoss', notes: '' },
      { type: 'hotel', time: '18:30', title: L(lang, 'Notte a Selfoss', 'Night in Selfoss'), notes: L(lang, 'Base comoda per attaccare la costa sud domattina. Cena: Tryggvaskáli (nella casa più vecchia del paese, prenotate) o Kaffi Krús.', 'A handy base to hit the south coast tomorrow morning. Dinner: Tryggvaskáli (in the town’s oldest house, book ahead) or Kaffi Krús.'), lat: 63.9339, lng: -21.0011, price_usd: 185 },
    ],
  },
  {
    title: L(lang, 'Cascate e spiagge nere', 'Waterfalls and black beaches'),
    night: 'Vík í Mýrdal',
    items: [
      { type: 'info', title: L(lang, 'Rituale del mattino: vedur.is + road.is', 'Morning ritual: vedur.is + road.is'), notes: L(lang, 'Due minuti a colazione: meteo su vedur.is, stato delle strade su road.is. In Islanda il tempo cambia in un’ora e il piano B è parte del piano.', 'Two minutes at breakfast: weather on vedur.is, road status on road.is. Icelandic weather turns in an hour — plan B is part of the plan.'), links: [{ label: 'vedur.is', url: 'https://en.vedur.is' }, { label: 'road.is', url: 'https://www.road.is' }] },
      { type: 'drive', time: '08:00', duration_min: 65, title: L(lang, 'Selfoss → Seljalandsfoss', 'Selfoss → Seljalandsfoss'), notes: L(lang, 'Ring Road verso est: a sinistra compare l’Eyjafjallajökull, il vulcano che fermò l’Europa nel 2010.', 'Ring Road east: on your left rises Eyjafjallajökull, the volcano that grounded Europe in 2010.') },
      { type: 'activity', time: '09:10', duration_min: 80, title: 'Seljalandsfoss + Gljúfrabúi', notes: L(lang, 'Qui si cammina DIETRO la cascata: k-way obbligatorio, scarpe con grip. Poi 600 metri a piedi verso nord: Gljúfrabúi, nascosta DENTRO una gola — si entra nel canyon guadando il ruscello. In molti se la perdono.', 'Here you walk BEHIND the waterfall: rain jacket required, grippy shoes. Then 600 metres north on foot: Gljúfrabúi, hidden INSIDE a gorge — you wade the creek into the canyon. Most people miss it.'), lat: 63.6156, lng: -19.9886, price_usd: 8, must_see: true },
      { type: 'drive', time: '10:35', duration_min: 25, title: 'Seljalandsfoss → Skógafoss', notes: '' },
      { type: 'activity', time: '11:05', duration_min: 60, title: 'Skógafoss', notes: L(lang, '60 metri di muro d’acqua e, col sole, doppio arcobaleno quasi garantito. I 527 gradini a destra portano alla vista dall’alto — da lì parte il trekking del Fimmvörðuháls, per un’altra volta.', 'A 60-metre wall of water and, with sun, a near-guaranteed double rainbow. The 527 steps on the right lead to the top view — the Fimmvörðuháls trek starts there, for another trip.'), lat: 63.5321, lng: -19.5114, must_see: true },
      { type: 'activity', time: '12:10', duration_min: 50, title: L(lang, 'Kvernufoss, la vicina segreta', 'Kvernufoss, the secret neighbour'), notes: L(lang, 'A 20 minuti a piedi dal museo di Skógar: una cascata in una gola verde dietro cui si può camminare, con un decimo della folla di Skógafoss. La gemma del giorno.', 'A 20-minute walk from the Skógar museum: a waterfall in a green gorge you can walk behind, with a tenth of Skógafoss’s crowd. Today’s gem.'), lat: 63.5279, lng: -19.4993, must_see: true },
      { type: 'food', time: '13:10', duration_min: 40, title: L(lang, 'Pranzo a Skógar', 'Lunch in Skógar'), notes: L(lang, 'Mia’s Country Van: fish & chips di merluzzo fresco da un furgone rosso. Oppure il bistro del museo.', 'Mia’s Country Van: fresh cod fish & chips from a red van. Or the museum bistro.'), lat: 63.5306, lng: -19.5083, price_usd: 32 },
      { type: 'drive', time: '13:55', duration_min: 20, title: L(lang, 'Skógar → Sólheimajökull', 'Skógar → Sólheimajökull'), notes: '' },
      { type: 'activity', time: '14:15', duration_min: 60, title: L(lang, 'Lingua glaciale Sólheimajökull', 'Sólheimajökull glacier tongue'), notes: L(lang, '20 minuti a piedi dal parcheggio e siete davanti a un ghiacciaio vero: cenere nera su ghiaccio blu, crepacci, laguna di fusione. Si tocca con mano quanto arretra ogni anno. Con guida si sale sopra (extra).', 'A 20-minute walk from the car park puts you before a real glacier: black ash on blue ice, crevasses, a meltwater lagoon. You can see how far it retreats each year. Guided walks go on top (extra).'), lat: 63.5304, lng: -19.351, price_usd: 6 },
      { type: 'drive', time: '15:25', duration_min: 25, title: 'Sólheimajökull → Dyrhólaey', notes: '' },
      { type: 'activity', time: '15:50', duration_min: 45, title: 'Dyrhólaey', notes: L(lang, 'L’arco di roccia nera alto 120 metri e — da giugno ad agosto — i pulcinella di mare che nidificano sulle scogliere. Salite al faro col 4x4: la vista abbraccia tutta la costa fino a Vík.', 'The 120-metre black rock arch and — June to August — puffins nesting on the cliffs. Drive up to the lighthouse with the 4x4: the view sweeps the whole coast to Vík.'), lat: 63.4023, lng: -19.13, must_see: true },
      { type: 'drive', time: '16:50', duration_min: 15, title: 'Dyrhólaey → Reynisfjara', notes: '' },
      { type: 'activity', time: '17:05', duration_min: 50, title: L(lang, 'Spiaggia nera di Reynisfjara', 'Reynisfjara black beach'), notes: L(lang, 'Colonne di basalto perfette come canne d’organo, la grotta Hálsanefshellir e i faraglioni Reynisdrangar — secondo la leggenda, troll pietrificati dall’alba.', 'Basalt columns as perfect as organ pipes, the Hálsanefshellir cave and the Reynisdrangar sea stacks — trolls petrified by sunrise, legend says.'), lat: 63.4043, lng: -19.074, must_see: true },
      { type: 'info', title: L(lang, 'Sneaker waves: prendetele sul serio', 'Sneaker waves: take them seriously'), notes: L(lang, 'A Reynisfjara onde anomale risalgono la spiaggia senza preavviso e qui la gente è morta davvero. MAI dare le spalle all’oceano, rispettate le zone segnalate dai cartelli luminosi.', 'At Reynisfjara rogue waves surge up the beach without warning — people have actually died here. NEVER turn your back on the ocean; respect the light-marked safety zones.') },
      { type: 'hotel', time: '18:15', title: L(lang, 'Notte a Vík', 'Night in Vík'), notes: L(lang, 'Il paese più a sud d’Islanda, sotto la chiesetta rossa sulla collina. Cena: Sudur-Vík (atmosfera) o Smiðjan Brugghús (burger e birre proprie).', 'Iceland’s southernmost village, below the little red hilltop church. Dinner: Sudur-Vík (atmosphere) or Smiðjan Brugghús (burgers and house-brewed beers).'), lat: 63.4187, lng: -19.006, price_usd: 225 },
    ],
  },
  {
    title: L(lang, 'Vík → laguna glaciale', 'Vík → glacier lagoon'),
    night: 'Höfn',
    items: [
      { type: 'info', title: L(lang, 'Benzina: si parte col pieno', 'Fuel: leave with a full tank'), notes: L(lang, 'Tra Vík e Höfn le stazioni sono rare: pieno a Vík, eventuale rabbocco alla N1 di Kirkjubæjarklaustur. Le pompe self-service vogliono una carta con PIN.', 'Stations are scarce between Vík and Höfn: fill up in Vík, top up at the N1 in Kirkjubæjarklaustur if needed. Self-service pumps want a card with a PIN.') },
      { type: 'drive', time: '07:45', duration_min: 60, title: 'Vík → Fjaðrárgljúfur', notes: L(lang, 'Si attraversa Eldhraun, la colata lavica del 1783 coperta da un muschio spesso mezzo metro. Non calpestatelo: impiega decenni a ricrescere.', 'You cross Eldhraun, the 1783 lava flow under half a metre of moss. Don’t step on it — it takes decades to regrow.') },
      { type: 'activity', time: '08:50', duration_min: 60, title: L(lang, 'Canyon Fjaðrárgljúfur', 'Fjaðrárgljúfur canyon'), notes: L(lang, 'Due milioni di anni di erosione: una gola serpeggiante profonda 100 metri, col sentiero sul bordo e piattaforme a strapiombo. Arrivando presto l’avrete quasi per voi.', 'Two million years of erosion: a winding 100-metre-deep gorge with a rim trail and overhanging platforms. Arrive early and it is almost yours alone.'), lat: 63.7714, lng: -18.1716, must_see: true },
      { type: 'drive', time: '10:00', duration_min: 70, title: 'Fjaðrárgljúfur → Skaftafell', notes: L(lang, 'Le sandur: pianure di sabbia nera create dalle piene glaciali, ponti a corsia unica (precedenza a chi arriva prima).', 'The sandur: black outwash plains built by glacial floods, single-lane bridges (first to arrive has right of way).') },
      { type: 'activity', time: '11:15', duration_min: 110, title: L(lang, 'Skaftafell — sentiero per Svartifoss', 'Skaftafell — Svartifoss trail'), notes: L(lang, '5,5 km a/r nel parco nazionale del Vatnajökull fino alla “cascata nera”, incorniciata da canne d’organo di basalto che ispirarono la Hallgrímskirkja. Proseguite 10 minuti fino a Sjónarsker per la vista sul ghiacciaio.', 'A 5.5 km round hike in Vatnajökull National Park to the “black waterfall”, framed by the basalt organ pipes that inspired Hallgrímskirkja. Push 10 more minutes to Sjónarsker for the glacier view.'), lat: 64.0163, lng: -16.9663, price_usd: 9, must_see: true, links: [{ label: 'Vatnajökull NP', url: 'https://www.vatnajokulsthjodgardur.is/en' }] },
      { type: 'food', time: '13:10', duration_min: 35, title: L(lang, 'Pranzo veloce al visitor center', 'Quick lunch at the visitor centre'), notes: L(lang, 'Panini e zuppa del giorno: oggi il tempo serve alla laguna.', 'Sandwiches and the soup of the day — today the time belongs to the lagoon.'), lat: 64.0167, lng: -16.9705, price_usd: 28 },
      { type: 'drive', time: '13:50', duration_min: 55, title: 'Skaftafell → Jökulsárlón', notes: L(lang, 'Il Vatnajökull — la calotta più grande d’Europa — vi accompagna a sinistra per tutta la strada.', 'Vatnajökull — Europe’s largest ice cap — rides along on your left the whole way.') },
      { type: 'activity', time: '14:50', duration_min: 80, title: L(lang, 'Laguna glaciale di Jökulsárlón', 'Jökulsárlón glacier lagoon'), notes: L(lang, 'Iceberg blu elettrico che si staccano dal Breiðamerkurjökull e navigano verso il mare; le foche fanno capolino tra i blocchi. Il punto migliore è la collinetta a est del parcheggio.', 'Electric-blue icebergs calve off Breiðamerkurjökull and sail out to sea; seals pop up between the blocks. Best vantage point: the small hill east of the car park.'), lat: 64.0784, lng: -16.2306, must_see: true },
      { type: 'activity', time: '16:15', duration_min: 45, title: 'Diamond Beach', notes: L(lang, 'Dall’altra parte della strada: i blocchi di ghiaccio levigati dall’oceano brillano sulla sabbia nera come diamanti. Ogni ora la marea ne porta di nuovi.', 'Just across the road: ocean-polished ice chunks glitter on the black sand like diamonds. The tide delivers new ones every hour.'), lat: 64.0426, lng: -16.1774, must_see: true },
      { type: 'activity', time: '17:10', duration_min: 45, title: L(lang, 'Fjallsárlón, la laguna intima', 'Fjallsárlón, the intimate lagoon'), notes: L(lang, 'A 10 minuti di strada: la sorella piccola di Jökulsárlón, col fronte del ghiacciaio molto più vicino e quasi nessun pullman. Nel silenzio si sente il ghiaccio scricchiolare.', '10 minutes down the road: Jökulsárlón’s little sister, with the glacier face much closer and hardly a tour bus in sight. In the silence you can hear the ice creak.'), lat: 64.0157, lng: -16.3757, must_see: true },
      { type: 'drive', time: '18:10', duration_min: 60, title: 'Fjallsárlón → Höfn', notes: '' },
      { type: 'food', time: '19:30', duration_min: 90, title: L(lang, 'Cena: astice a Höfn', 'Dinner: langoustine in Höfn'), notes: L(lang, 'Höfn è la capitale islandese dell’astice (humar). Pakkhús, sul porto: zuppa di humar e code alla griglia — prenotate, si riempie sempre.', 'Höfn is Iceland’s langoustine (humar) capital. Pakkhús, on the harbour: humar soup and grilled tails — book ahead, it always fills up.'), lat: 64.2506, lng: -15.2021, price_usd: 60, links: [{ label: 'Pakkhús', url: 'https://pakkhus.is' }] },
      { type: 'hotel', time: '21:15', title: L(lang, 'Notte a Höfn', 'Night in Höfn'), notes: L(lang, 'Domattina sveglia presto per l’alba a Stokksnes: preparate lo zaino stasera.', 'Early alarm tomorrow for the Stokksnes sunrise: pack your bag tonight.'), lat: 64.2547, lng: -15.2103, price_usd: 205 },
    ],
  },
  {
    title: L(lang, 'Alba a Stokksnes e fiordi orientali', 'Stokksnes sunrise and the East Fjords'),
    night: 'Seyðisfjörður',
    items: [
      { type: 'activity', time: '05:45', duration_min: 90, title: L(lang, 'Alba a Stokksnes / Vestrahorn', 'Sunrise at Stokksnes / Vestrahorn'), notes: L(lang, 'La montagna più fotogenica d’Islanda: 454 metri di picchi neri che si specchiano sulla sabbia bagnata, tra dune coperte d’erba. Pedaggio al Viking Café. L’unica alzataccia del viaggio — e la ricorderete per sempre.', 'Iceland’s most photogenic mountain: 454 metres of black spikes mirrored on wet sand, among grass-tufted dunes. Small toll at the Viking Café. The trip’s only early alarm — you will remember it forever.'), lat: 64.2472, lng: -14.9797, price_usd: 8, must_see: true },
      { type: 'food', time: '07:20', duration_min: 35, title: L(lang, 'Colazione al Viking Café', 'Breakfast at the Viking Café'), notes: L(lang, 'Caffè e waffle guardando il Vestrahorn. Meritatissimi.', 'Coffee and waffles with a view of Vestrahorn. Thoroughly earned.'), lat: 64.2497, lng: -15.029, price_usd: 14 },
      { type: 'drive', time: '08:05', duration_min: 100, title: L(lang, 'Stokksnes → Djúpivogur', 'Stokksnes → Djúpivogur'), notes: L(lang, 'La Ring Road si infila nei fiordi orientali: la strada gira attorno a ogni braccio di mare, con le Alpi orientali a picco sull’acqua. Da qui in poi i pullman spariscono.', 'The Ring Road threads into the East Fjords: the road bends around every arm of sea, eastern peaks dropping straight into the water. From here on the tour buses vanish.') },
      { type: 'activity', time: '09:50', duration_min: 40, title: L(lang, 'Djúpivogur e le uova di Gleðivík', 'Djúpivogur and the Gleðivík eggs'), notes: L(lang, 'Porticciolo di pescatori fuori dal tempo e, sul molo, «Eggin í Gleðivík»: 34 uova giganti di granito, una per ogni uccello che nidifica qui. Il paese aderisce a Cittaslow — e si sente.', 'A timeless fishing harbour and, on the pier, “Eggin í Gleðivík”: 34 giant granite eggs, one for every local nesting bird. The village is a Cittaslow member — and it shows.'), lat: 64.656, lng: -14.2837 },
      { type: 'drive', time: '10:35', duration_min: 70, title: 'Djúpivogur → Stöðvarfjörður', notes: L(lang, 'Fiordo dopo fiordo: Breiðdalsvík e le scogliere dove nidificano le sterne.', 'Fjord after fjord: Breiðdalsvík and the cliffs where arctic terns nest.') },
      { type: 'activity', time: '11:50', duration_min: 50, title: L(lang, 'La collezione di pietre di Petra', 'Petra’s Stone Collection'), notes: L(lang, 'A Stöðvarfjörður, la casa di Petra Sveinsdóttir: una vita passata a raccogliere i minerali dei fiordi — giardino e stanze stracolmi di diaspri, agate e cristalli. Uno dei musei più amati (e più strani) d’Islanda.', 'In Stöðvarfjörður, Petra Sveinsdóttir’s home: a lifetime spent collecting the fjords’ minerals — garden and rooms overflowing with jasper, agate and crystals. One of Iceland’s best-loved (and strangest) museums.'), lat: 64.8339, lng: -13.8809, price_usd: 13, links: [{ label: L(lang, 'Sito ufficiale', 'Official site'), url: 'https://steinapetra.is' }] },
      { type: 'drive', time: '12:45', duration_min: 25, title: 'Stöðvarfjörður → Fáskrúðsfjörður', notes: '' },
      { type: 'food', time: '13:10', duration_min: 45, title: L(lang, 'Pranzo a Fáskrúðsfjörður', 'Lunch in Fáskrúðsfjörður'), notes: L(lang, 'Il paese dei pescatori francesi: fino al 1914 qui svernava la flotta bretone e i cartelli stradali sono ancora bilingui. Café Sumarlína: zuppa di pesce e pane caldo.', 'The French fishermen’s village: the Breton fleet wintered here until 1914 and the street signs are still bilingual. Café Sumarlína: fish soup and warm bread.'), lat: 64.9316, lng: -14.0221, price_usd: 30 },
      { type: 'drive', time: '14:10', duration_min: 75, title: L(lang, 'Fáskrúðsfjörður → Egilsstaðir → passo di Fjarðarheiði', 'Fáskrúðsfjörður → Egilsstaðir → Fjarðarheiði pass'), notes: L(lang, 'Pieno a Egilsstaðir (la “capitale” dell’est), poi su per il passo: 620 metri di altopiano lunare e la discesa a tornanti nel fiordo più bello d’Islanda.', 'Fill up in Egilsstaðir (the east’s “capital”), then over the pass: a 620-metre lunar plateau and a hairpin descent into Iceland’s prettiest fjord.') },
      { type: 'activity', time: '15:30', duration_min: 25, title: 'Gufufoss', notes: L(lang, 'L’ultima curva prima del paese: la cascata “del vapore” incassata tra pareti di basalto, a due passi dalla strada. Anteprima perfetta di Seyðisfjörður.', 'The last bend before town: the “steam waterfall” tucked between basalt walls, steps from the road. The perfect preview of Seyðisfjörður.'), lat: 65.251, lng: -14.071 },
      { type: 'activity', time: '16:10', duration_min: 90, title: L(lang, 'Seyðisfjörður, la via arcobaleno', 'Seyðisfjörður and the rainbow street'), notes: L(lang, 'Case di legno norvegesi in fondo a un fiordo verticale, la via arcobaleno che sale alla chiesetta azzurra, atelier di artisti e il traghetto per la Danimarca. Il paese più bohémien d’Islanda: perdetevi senza fretta.', 'Norwegian timber houses at the foot of a vertical fjord, the rainbow path climbing to the pale-blue church, artists’ studios and the ferry to Denmark. Iceland’s most bohemian town: wander with no agenda.'), lat: 65.2609, lng: -14.0104, must_see: true },
      { type: 'hotel', time: '19:00', title: L(lang, 'Notte a Seyðisfjörður', 'Night in Seyðisfjörður'), notes: L(lang, 'Cena da Norð Austur, sopra il vecchio emporio: sushi di pesce islandese pescato a poche miglia — sembra un azzardo, è il migliore del paese. Prenotate.', 'Dinner at Norð Austur, above the old general store: sushi from Icelandic fish landed a few miles away — sounds like a gamble, it’s the country’s best. Book ahead.'), lat: 65.2609, lng: -14.0104, price_usd: 195, links: [{ label: 'Norð Austur', url: 'https://nordaustur.is' }] },
    ],
  },
  {
    title: L(lang, 'Stuðlagil, Dettifoss e Mývatn', 'Stuðlagil, Dettifoss and Mývatn'),
    night: L(lang, 'Mývatn (Reykjahlíð)', 'Mývatn (Reykjahlíð)'),
    items: [
      { type: 'drive', time: '08:00', duration_min: 105, title: L(lang, 'Seyðisfjörður → valle di Jökuldalur', 'Seyðisfjörður → Jökuldalur valley'), notes: L(lang, 'Di nuovo oltre il passo e poi a ovest sulla Ring Road, dentro la valle glaciale di Jökuldalur.', 'Back over the pass, then west on the Ring Road into the glacial Jökuldalur valley.') },
      { type: 'activity', time: '09:50', duration_min: 90, title: L(lang, 'Canyon di Stuðlagil', 'Stuðlagil canyon'), notes: L(lang, 'La gemma dell’est: colonne di basalto perfette alte 30 metri su un fiume verde smeraldo. Il canyon è emerso solo nel 2009, quando una diga ha abbassato il fiume. Sponda est a piedi (5 km a/r da Klaustursel): la vista vera è lì.', 'The east’s gem: perfect 30-metre basalt columns over an emerald river. The canyon only surfaced in 2009, when a dam lowered the water. Walk the east bank (5 km round trip from Klaustursel): that’s where the real view is.'), lat: 65.1622, lng: -15.3068, must_see: true },
      { type: 'drive', time: '11:30', duration_min: 45, title: L(lang, 'Stuðlagil → Möðrudalur', 'Stuðlagil → Möðrudalur'), notes: L(lang, 'Si sale sull’altopiano: deserto di lava e sabbia nera fino alla fattoria più alta d’Islanda.', 'Up onto the highlands: a desert of lava and black sand, to Iceland’s highest farm.') },
      { type: 'food', time: '12:20', duration_min: 45, title: L(lang, 'Pranzo a Fjallakaffi (Möðrudalur)', 'Lunch at Fjallakaffi (Möðrudalur)'), notes: L(lang, 'La fattoria abitata più alta del paese (469 m), con la chiesetta di torba e il caffè di montagna: zuppa d’agnello e kleinur appena fritte, con il vulcano Herðubreið all’orizzonte.', 'The country’s highest inhabited farm (469 m), with its turf-roof chapel and mountain café: lamb soup and fresh-fried kleinur, the Herðubreið volcano on the horizon.'), lat: 65.355, lng: -15.887, price_usd: 30 },
      { type: 'drive', time: '13:15', duration_min: 65, title: L(lang, 'Möðrudalur → Dettifoss (strada 862)', 'Möðrudalur → Dettifoss (road 862)'), notes: '' },
      { type: 'activity', time: '14:25', duration_min: 75, title: 'Dettifoss + Selfoss', notes: L(lang, 'La cascata più potente d’Europa: 100 metri di fronte, 193 m³ al secondo di acqua grigia di ghiacciaio che fa tremare la roccia sotto i piedi (è l’apertura di Prometheus). Poi 15 minuti a monte c’è Selfoss, la sorella elegante.', 'Europe’s most powerful waterfall: a 100-metre front, 193 m³ per second of grey glacier water shaking the rock underfoot (it opens Prometheus). Then 15 minutes upstream is Selfoss, the elegant sister.'), lat: 65.8145, lng: -16.385, must_see: true },
      { type: 'drive', time: '15:50', duration_min: 45, title: 'Dettifoss → Hverir', notes: '' },
      { type: 'activity', time: '16:40', duration_min: 40, title: L(lang, 'Hverir, le fumarole di Námaskarð', 'Hverir, the Námaskarð fumaroles'), notes: L(lang, 'Marte, ma in Islanda: pozze di fango che ribollono, fumarole che fischiano e terra ocra-arancio ai piedi del Námafjall. L’odore di zolfo si dimentica, i colori no.', 'Mars, but in Iceland: boiling mud pots, hissing fumaroles and ochre-orange earth below Námafjall. You forget the sulphur smell; you don’t forget the colours.'), lat: 65.641, lng: -16.81, must_see: true },
      { type: 'activity', time: '17:30', duration_min: 25, title: 'Grjótagjá', notes: L(lang, 'La grotta lavica con la sorgente turchese dove si scaldavano i fuorilegge (e Jon Snow): oggi l’acqua è troppo calda per il bagno, ma l’occhiata dentro la fessura vale la sosta.', 'The lava cave with the turquoise spring where outlaws (and Jon Snow) once bathed: the water is too hot to swim in now, but peeking into the fissure is worth the stop.'), lat: 65.6262, lng: -16.8825 },
      { type: 'activity', time: '18:10', duration_min: 100, title: 'Mývatn Nature Baths', notes: L(lang, 'La Blue Lagoon del nord, senza la folla: acqua lattiginosa a 38-40° con vista sul lago e sui crateri. Il tramonto da qui, dopo 400 km di giornata, è la ricompensa perfetta.', 'The north’s Blue Lagoon, without the crowds: milky 38-40° water overlooking the lake and craters. Sunset from here, after a 400 km day, is the perfect reward.'), lat: 65.6314, lng: -16.848, price_usd: 48, must_see: true, links: [{ label: L(lang, 'Prenotazioni', 'Bookings'), url: 'https://myvatnnaturebaths.is' }] },
      { type: 'hotel', time: '20:15', title: L(lang, 'Notte a Reykjahlíð (Mývatn)', 'Night in Reykjahlíð (Mývatn)'), notes: L(lang, 'Cena da Vogafjós, il «caffè della stalla»: si mangia agnello e trota affumicata guardando le mucche nella stalla a vetri. Geotermia ovunque, anche nel pane cotto sottoterra.', 'Dinner at Vogafjós, the “cowshed café”: lamb and smoked trout with the cows watching through the glass barn wall. Geothermal everything — even the bread is baked underground.'), lat: 65.6431, lng: -16.9159, price_usd: 210, links: [{ label: 'Vogafjós', url: 'https://vogafjos.is' }] },
    ],
  },
  {
    title: L(lang, 'Goðafoss, Akureyri e la costa nord-ovest', 'Goðafoss, Akureyri and the north-west coast'),
    night: 'Borgarnes',
    items: [
      { type: 'info', title: L(lang, 'La tratta lunga: oggi si macina', 'The long leg: big miles today'), notes: L(lang, 'Circa 430 km, ma spezzati bene: due cascate-icona, una città vera, case di torba e un drago di basalto. Partenza puntuale e serbatoio pieno a Akureyri.', 'About 430 km, but well broken up: two icon waterfalls, a real town, turf houses and a basalt dragon. Leave on time and fill the tank in Akureyri.') },
      { type: 'drive', time: '08:15', duration_min: 40, title: 'Reykjahlíð → Goðafoss', notes: '' },
      { type: 'activity', time: '09:00', duration_min: 50, title: 'Goðafoss', notes: L(lang, 'La «cascata degli dèi»: nell’anno 1000 il legislatore Þorgeir, scelto il cristianesimo, gettò qui le statue degli dèi norreni. Ferro di cavallo di 30 metri, raggiungibile da entrambe le sponde.', 'The “waterfall of the gods”: in the year 1000 lawspeaker Þorgeir, having chosen Christianity, threw the Norse idols in here. A 30-metre horseshoe, reachable from both banks.'), lat: 65.6827, lng: -17.5497, must_see: true },
      { type: 'drive', time: '09:55', duration_min: 40, title: 'Goðafoss → Akureyri', notes: L(lang, 'Lungo l’Eyjafjörður, il fiordo più lungo del nord.', 'Along Eyjafjörður, the north’s longest fjord.') },
      { type: 'activity', time: '10:40', duration_min: 80, title: L(lang, 'Akureyri, la capitale del nord', 'Akureyri, capital of the north'), notes: L(lang, 'Ventimila abitanti e un cuore da città vera: la chiesa sulla scalinata, il giardino botanico più a nord del mondo (gratis) e i semafori a forma di cuore, nati per tirare su il morale dopo il crac del 2008.', 'Twenty thousand people and a proper town heart: the hilltop church, the world’s northernmost botanical garden (free) and heart-shaped traffic lights, born to lift spirits after the 2008 crash.'), lat: 65.6795, lng: -18.0907 },
      { type: 'food', time: '12:00', duration_min: 45, title: L(lang, 'Pranzo ad Akureyri', 'Lunch in Akureyri'), notes: L(lang, 'Akureyri Fish & Chips al porto, oppure un brunch da Berlín su Skipagata. Pieno di carburante prima di ripartire: da qui a Borgarnes conviene non contare sulle pompe minori.', 'Akureyri Fish & Chips by the harbour, or brunch at Berlín on Skipagata. Fill the tank before leaving: between here and Borgarnes don’t count on the smaller pumps.'), lat: 65.6839, lng: -18.0894, price_usd: 30 },
      { type: 'drive', time: '12:50', duration_min: 95, title: L(lang, 'Akureyri → Glaumbær', 'Akureyri → Glaumbær'), notes: L(lang, 'Si attraversa la valle di Öxnadalur, stretta tra creste dentate: Ring Road da manuale.', 'Through the Öxnadalur valley, squeezed between jagged ridges: textbook Ring Road.') },
      { type: 'activity', time: '14:25', duration_min: 45, title: L(lang, 'Fattoria di torba di Glaumbær', 'Glaumbær turf farm'), notes: L(lang, 'Il grande maso di torba del Settecento: tredici casette dai tetti d’erba unite da un corridoio scavato, abitate fino al 1947. Il modo più concreto per capire come si sopravviveva agli inverni islandesi.', 'The great 18th-century turf farm: thirteen grass-roofed houses joined by a dug corridor, inhabited until 1947. The most tangible way to grasp how people survived Icelandic winters.'), lat: 65.6086, lng: -19.5064, price_usd: 13 },
      { type: 'drive', time: '15:15', duration_min: 80, title: L(lang, 'Glaumbær → Hvítserkur (ultimi km sterrati)', 'Glaumbær → Hvítserkur (last stretch on gravel)'), notes: L(lang, 'La 711 sulla penisola di Vatnsnes è sterrata ma tranquilla col 4x4: guidate piano, panorami sul fiordo a ogni curva.', 'Road 711 on the Vatnsnes peninsula is gravel but easy with the 4x4: drive gently, fjord views at every bend.') },
      { type: 'activity', time: '16:40', duration_min: 45, title: 'Hvítserkur', notes: L(lang, 'Il drago che beve: faraglione di basalto di 15 metri con due arcate, piantato nella marea. Con la bassa marea si scende alla spiaggia nera; sui banchi di sabbia dell’estuario riposano decine di foche.', 'The drinking dragon: a 15-metre basalt stack on two arched legs, planted in the tide. At low tide you can walk the black beach below; dozens of seals haul out on the estuary sandbars.'), lat: 65.606, lng: -20.641, must_see: true },
      { type: 'drive', time: '17:35', duration_min: 115, title: 'Hvítserkur → Borgarnes', notes: L(lang, 'Ultima tratta di giornata, dritta verso sud-ovest col sole basso sul Húnaflói.', 'The day’s last leg, straight south-west with the low sun over Húnaflói bay.') },
      { type: 'hotel', time: '19:45', title: L(lang, 'Notte a Borgarnes', 'Night in Borgarnes'), notes: L(lang, 'Cittadina delle saghe su una lingua di terra nel fiordo. Cena a Englendingavík, nella vecchia casa dei mercanti sul porticciolo, o al bistro del Settlement Center.', 'A saga town on a spit in the fjord. Dinner at Englendingavík, in the old merchants’ house by the tiny harbour, or at the Settlement Center bistro.'), lat: 64.539, lng: -21.921, price_usd: 180 },
    ],
  },
  {
    title: L(lang, 'Hraunfossar, Reykjavík e Sky Lagoon', 'Hraunfossar, Reykjavík and Sky Lagoon'),
    night: '',
    items: [
      { type: 'drive', time: '08:30', duration_min: 35, title: 'Borgarnes → Deildartunguhver', notes: '' },
      { type: 'activity', time: '09:05', duration_min: 25, title: 'Deildartunguhver', notes: L(lang, 'La sorgente termale più potente d’Europa: 180 litri al secondo di acqua a 97° che erutta letteralmente dalla roccia. Il vapore scalda le serre (e i pomodori) di mezza regione.', 'Europe’s most powerful hot spring: 180 litres per second at 97°, literally erupting from the rock. Its steam heats half the region’s greenhouses (and tomatoes).'), lat: 64.6635, lng: -21.411 },
      { type: 'drive', time: '09:35', duration_min: 25, title: 'Deildartunguhver → Hraunfossar', notes: '' },
      { type: 'activity', time: '10:00', duration_min: 45, title: 'Hraunfossar + Barnafoss', notes: L(lang, 'Un chilometro di cascatelle azzurre che filtrano DA SOTTO un campo di lava, senza nessun fiume in vista — e cento metri a monte Barnafoss, che si strozza in una gola turchese. Uniche al mondo.', 'A kilometre of pale-blue cascades seeping out FROM UNDER a lava field, no river in sight — and a hundred metres upstream Barnafoss, choking through a turquoise slot. Nothing else like it.'), lat: 64.7028, lng: -20.978, must_see: true },
      { type: 'drive', time: '10:50', duration_min: 95, title: L(lang, 'Hraunfossar → Reykjavík', 'Hraunfossar → Reykjavík'), notes: L(lang, 'Si chiude l’anello: sotto il fiordo di Hvalfjörður nel tunnel, poi la capitale.', 'The ring closes: under Hvalfjörður through the tunnel, then the capital.') },
      { type: 'food', time: '12:35', duration_min: 30, title: L(lang, 'L’hot dog di Bæjarins Beztu', 'The Bæjarins Beztu hot dog'), notes: L(lang, 'Dal 1937, il chiosco più famoso d’Islanda (ci ha mangiato pure Bill Clinton). Ordinate «eina með öllu» — una con tutto: cipolla croccante, remoulade, senape dolce.', 'Since 1937, Iceland’s most famous stand (Bill Clinton ate here too). Order “eina með öllu” — one with everything: crispy onions, remoulade, sweet mustard.'), lat: 64.1479, lng: -21.9393, price_usd: 8, must_see: true },
      { type: 'activity', time: '13:15', duration_min: 50, title: 'Hallgrímskirkja', notes: L(lang, 'Il campanile di 74 metri ispirato alle colonne di basalto (quelle vere le avete viste a Svartifoss, Reynisfjara e Stuðlagil). Salite in cima: tetti colorati a perdita d’occhio.', 'The 74-metre tower inspired by basalt columns (you saw the real ones at Svartifoss, Reynisfjara and Stuðlagil). Ride to the top: colourful rooftops as far as you can see.'), lat: 64.1417, lng: -21.9266, price_usd: 9, must_see: true, links: [{ label: L(lang, 'Sito ufficiale', 'Official site'), url: 'https://www.hallgrimskirkja.is' }] },
      { type: 'activity', time: '14:15', duration_min: 60, title: L(lang, 'Laugavegur, Harpa e Sun Voyager', 'Laugavegur, Harpa and the Sun Voyager'), notes: L(lang, 'Scendete per Skólavörðustígur (la via arcobaleno) e Laugavegur fino al lungomare: la sala concerti Harpa con la facciata a nido d’ape e la scultura Sun Voyager, un drakkar di acciaio puntato verso il sole.', 'Walk down Skólavörðustígur (the rainbow street) and Laugavegur to the waterfront: the honeycomb-façade Harpa concert hall and the Sun Voyager, a steel dream-ship aimed at the sun.'), lat: 64.1505, lng: -21.9324 },
      { type: 'activity', time: '15:30', duration_min: 150, title: 'Sky Lagoon', notes: L(lang, 'Infinity pool geotermica a filo d’oceano e il rituale in 7 passaggi (sauna con vetrata sul mare, scrub, bagno freddo…). Il modo perfetto di sciogliere 1.700 km di anello. Prenotate con largo anticipo!', 'A geothermal infinity pool flush with the ocean and the 7-step ritual (sea-view sauna, scrub, cold plunge…). The perfect way to melt away 1,700 km of ring road. Book well ahead!'), lat: 64.1091, lng: -21.9527, price_usd: 85, must_see: true, links: [{ label: L(lang, 'Prenotazioni', 'Bookings'), url: 'https://www.skylagoon.com' }] },
      { type: 'drive', time: '18:15', duration_min: 25, title: L(lang, 'Sky Lagoon → riconsegna auto', 'Sky Lagoon → car drop-off'), notes: '' },
      { type: 'activity', time: '18:45', duration_min: 30, title: L(lang, 'Riconsegna del 4x4', 'Drop off the 4x4'), notes: L(lang, 'Pieno di benzina prima della riconsegna (il rifornimento dell’autonoleggio costa il doppio). Takk fyrir, Islanda!', 'Fill the tank before dropping off (the rental company’s refuel costs double). Takk fyrir, Iceland!'), lat: 64.1466, lng: -21.9426 },
    ],
  },
]

export const checklist = (lang) =>
  [
    L(lang, 'Prenotare i voli', 'Book the flights'),
    L(lang, 'Noleggio 4x4 con assicurazione ghiaia e sabbia', '4x4 rental with gravel + sand/ash protection'),
    L(lang, 'Prenotare hotel di Vík, Höfn e Mývatn (finiscono per primi)', 'Book the Vík, Höfn and Mývatn hotels (they sell out first)'),
    L(lang, 'Prenotare Sky Lagoon e cena da Pakkhús', 'Book Sky Lagoon and dinner at Pakkhús'),
    L(lang, 'Carta di credito CON PIN (benzinai self-service)', 'Credit card WITH a PIN (self-service fuel pumps)'),
    L(lang, 'K-way, strati caldi e guanti (sì, ad agosto)', 'Rain jacket, warm layers and gloves (yes, in August)'),
    L(lang, 'Scarpe da trekking impermeabili', 'Waterproof hiking shoes'),
    L(lang, 'Costume, telo e ciabatte per le terme', 'Swimsuit, towel and flip-flops for the hot springs'),
    L(lang, 'Mappe offline + app 112 Iceland', 'Offline maps + the 112 Iceland app'),
  ]

export const suggestions = (lang) => [
  { type: 'activity', title: 'Blue Lagoon', duration_min: 150, recommended: true, lat: 63.8804, lng: -22.4495, notes: L(lang, 'La spa più famosa d’Islanda, tra i campi lavici vicino all’aeroporto: perfetta all’arrivo o prima del volo di ritorno. Prenotazione obbligatoria.', 'Iceland’s most famous spa, set in the lava fields near the airport: perfect on arrival or before the flight home. Booking required.') },
  { type: 'activity', title: L(lang, 'Fiume caldo di Reykjadalur', 'Reykjadalur hot river'), duration_min: 180, recommended: true, lat: 64.0225, lng: -21.2117, notes: L(lang, 'Un’ora di cammino tra fumarole da Hveragerði, poi ci si immerge in un fiume termale in mezzo alle colline. Gratis e magico.', 'An hour’s hike among fumaroles from Hveragerði, then a soak in a warm river between the hills. Free and magical.') },
  { type: 'activity', title: L(lang, 'Zodiac tra gli iceberg a Jökulsárlón', 'Jökulsárlón iceberg zodiac tour'), duration_min: 60, recommended: true, lat: 64.0784, lng: -16.2306, notes: L(lang, 'In gommone fino al fronte del ghiacciaio, tra iceberg alti come palazzi (~55 €). Si prenota in anticipo.', 'By rigid inflatable up to the glacier face, among building-sized icebergs (~€55). Book ahead.') },
  { type: 'activity', title: L(lang, 'Relitto del DC-3 a Sólheimasandur', 'Sólheimasandur DC-3 plane wreck'), duration_min: 130, lat: 63.4912, lng: -19.3632, notes: L(lang, 'La carcassa dell’aereo US Navy del 1973 abbandonata sulla sabbia nera: scenografia da fine del mondo. 8 km a/r a piedi in piano, o navetta.', 'The 1973 US Navy wreck abandoned on black sand: end-of-the-world scenery. An 8 km flat round-trip walk, or a shuttle.') },
  { type: 'food', title: L(lang, 'Friðheimar: pranzo nella serra di pomodori', 'Friðheimar: lunch in the tomato greenhouse'), duration_min: 75, lat: 64.1734, lng: -20.4113, notes: L(lang, 'Zuppa di pomodoro infinita e pane caldo tra le piante, api comprese — sul Golden Circle. Prenotare.', 'Bottomless tomato soup and warm bread among the vines, bees included — on the Golden Circle. Book ahead.') },
  { type: 'activity', title: L(lang, 'Grotta di ghiaccio nel Katla (da Vík)', 'Katla ice cave (from Vík)'), duration_min: 210, lat: 63.4187, lng: -19.006, notes: L(lang, 'L’unica grotta di ghiaccio accessibile anche d’estate: ghiaccio nero venato di cenere sotto il vulcano Katla, in super-jeep da Vík.', 'The only ice cave you can visit in summer too: ash-veined black ice under the Katla volcano, by super-jeep from Vík.') },
  { type: 'activity', title: L(lang, 'Balene da Húsavík', 'Whale watching from Húsavík'), duration_min: 180, recommended: true, lat: 65.2827, lng: -17.3927, notes: L(lang, 'La capitale europea delle balene, a un’ora da Goðafoss: megattere quasi garantite ad agosto, ci sono anche i velieri in quercia. Si incastra perfettamente nel giorno 6.', 'Europe’s whale capital, an hour from Goðafoss: humpbacks near-guaranteed in August, oak sailing ships available too. Slots perfectly into day 6.') },
  { type: 'activity', title: L(lang, 'Bagno a Seljavallalaug', 'Swim at Seljavallalaug'), duration_min: 80, lat: 63.5657, lng: -19.6081, notes: L(lang, 'La piscina geotermica più antica d’Islanda (1923), incastrata in una valle sotto l’Eyjafjallajökull: 15 minuti a piedi, gratis, spartana e indimenticabile. Sta bene nel giorno 2.', 'Iceland’s oldest geothermal pool (1923), wedged in a valley under Eyjafjallajökull: a 15-minute walk in, free, bare-bones and unforgettable. Fits day 2 nicely.') },
  { type: 'activity', title: L(lang, 'Secret Lagoon a Flúðir', 'Secret Lagoon in Flúðir'), duration_min: 90, lat: 64.1379, lng: -20.3095, notes: L(lang, 'La piscina pubblica più antica d’Islanda (1891), semplice e bollente, con un mini-geyser che erutta ogni 5 minuti sul bordo.', 'Iceland’s oldest public pool (1891), simple and hot, with a mini-geyser erupting every 5 minutes at its edge.') },
]

/* extra planner-mode content: a couple of checklist lines Ulisse adds live */
export const plannerChecklistExtras = (lang) => [
  L(lang, 'Scaricare le mappe offline (zone senza segnale)', 'Download offline maps (no-signal areas)'),
  L(lang, 'Controllare vedur.is e road.is ogni mattina', 'Check vedur.is and road.is every morning'),
]
