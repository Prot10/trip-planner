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
      { label: L(lang, '4 giorni', '4 days'), description: L(lang, 'Golden Circle e costa sud fino a Vík', 'Golden Circle and the south coast down to Vík') },
      { label: L(lang, '5 giorni', '5 days'), description: L(lang, 'Si arriva fino alla laguna glaciale di Jökulsárlón', 'All the way to the Jökulsárlón glacier lagoon') },
      { label: L(lang, 'Una settimana', 'A full week'), description: L(lang, 'Tutto il sud con più calma e qualche deviazione', 'The whole south at an easier pace, with detours') },
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
    "Cascate, ghiacciai, spiagge nere **e** bagni caldi: la costa sud dell'Islanda a inizio agosto è esattamente questo. Ottima scelta anche per la guida — strade asfaltate, zero fretta.\n\nPrima di disegnare l'itinerario mi servono tre risposte veloci: le trovi tutte qui sotto, scorrile e rispondi. Appena ho tutto prendo nota sul mio taccuino, lo vedi accanto alla chat.\n\n*(Questa è una demo interattiva: la conversazione è preregistrata, ma tutto quello che vedi — tappe, mappa, budget — viene costruito dal vivo, esattamente come col vero Ulisse.)*",
    "Waterfalls, glaciers, black beaches **and** hot soaks: Iceland's south coast in early August is exactly that. Great call on driving too — paved roads, no rush.\n\nBefore I sketch the itinerary I need three quick answers — you'll find them all right below, swipe through and answer. Once I have everything I jot it down in my notebook, right next to the chat.\n\n*(This is an interactive demo: the conversation is pre-recorded, but everything you see — stops, map, budget — is built live, exactly like with the real Ulisse.)*",
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
    `Ecco il vostro viaggio: **5 giorni di costa sud**, da Reykjavík alla laguna glaciale di Jökulsárlón e ritorno, con tre gemme fuori dai flussi turistici — **Brúarfoss**, **Kvernufoss** e **Fjallsárlón** — e due bagni caldi ben piazzati.

Come l'ho costruito:
- **Ritmo**: partenze tra le 7:30 e le 8:00, mai dopo — ad agosto la luce dura fino alle 22 ma i parcheggi delle cascate alle 10 sono pieni. L'unica vera alzataccia è l'alba a Stokksnes, e ne vale ogni minuto.
- **Notti** in avanzamento (Selfoss → Vík → Höfn → Hveragerði): non si rifà mai la stessa strada due volte, tranne il rientro del giorno 4 che ho riempito di soste "riparazione" per ciò che meritava più tempo.
- **Budget** in alto a destra: hotel, pasti, ingressi e carburante sui km veri del percorso. Le voci grosse sono gli hotel di Vík e Höfn — prenotateli per primi, ad agosto finiscono.
- Nella tab **Consigli** trovate gli extra pronti da attivare: Blue Lagoon, il fiume caldo di Reykjadalur, il relitto del DC-3, lo zodiac tra gli iceberg…

Tre cose da non dimenticare: a **Reynisfjara** mai dare le spalle all'oceano; controllate [vedur.is](https://en.vedur.is) e [road.is](https://www.road.is) ogni mattina; fate il pieno quando capita — tra Vík e Höfn le stazioni sono rare. Buon viaggio!`,
    `Here is your trip: **5 days of south coast**, from Reykjavík to the Jökulsárlón glacier lagoon and back, with three gems away from the crowds — **Brúarfoss**, **Kvernufoss** and **Fjallsárlón** — and two well-placed hot soaks.

How I built it:
- **Pace**: departures between 7:30 and 8:00, never later — in August the light lasts until 10pm but waterfall car parks fill up by 10am. The only real early alarm is sunrise at Stokksnes, and it is worth every minute.
- **Nights** always moving forward (Selfoss → Vík → Höfn → Hveragerði): you never drive the same road twice, except day 4's return leg, which I filled with "repair stops" for whatever deserved more time.
- **Budget** top right: hotels, meals, entry fees and fuel computed on the real route distance. The big items are the Vík and Höfn hotels — book those first, they sell out in August.
- The **Suggestions** tab holds ready-to-enable extras: Blue Lagoon, the Reykjadalur hot river, the DC-3 plane wreck, the iceberg zodiac tour…

Three things to remember: at **Reynisfjara** never turn your back on the ocean; check [vedur.is](https://en.vedur.is) and [road.is](https://www.road.is) every morning; top up fuel whenever you can — stations are scarce between Vík and Höfn. Enjoy!`,
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
      `# Islanda — costa sud · inizio agosto\n\n## Richieste\n- In **due**, auto a noleggio, guida ok\n- **Durata**: ${a1} · **Ritmo**: ${a2}\n- **Priorità**: ${a3}\n\n## Piano\n- Anello sud: Reykjavík → Golden Circle → cascate → Vík → Jökulsárlón → Stokksnes → ritorno\n- Notti in avanzamento: Selfoss → Vík → Höfn → Hveragerði (mai la stessa strada due volte)\n- Gemme fuori flusso: Brúarfoss, Kvernufoss, Fjallsárlón, Seljavallalaug\n- Prenotare SUBITO: hotel Vík e Höfn, Sky Lagoon\n- Alzataccia unica: alba a Stokksnes (giorno 4)`,
      `# Iceland — south coast · early August\n\n## Requirements\n- **Two** travellers, rental car, happy to drive\n- **Duration**: ${a1} · **Pace**: ${a2}\n- **Priorities**: ${a3}\n\n## Plan\n- Southern loop: Reykjavík → Golden Circle → waterfalls → Vík → Jökulsárlón → Stokksnes → back\n- Nights always moving forward: Selfoss → Vík → Höfn → Hveragerði (never the same road twice)\n- Off-the-flow gems: Brúarfoss, Kvernufoss, Fjallsárlón, Seljavallalaug\n- Book NOW: Vík & Höfn hotels, Sky Lagoon\n- One early alarm: Stokksnes sunrise (day 4)`,
    ),
})

/* ---------- the trip Ulisse builds, as tool-call arguments ---------- */

export const tripMeta = (lang) => ({
  title: L(lang, 'Islanda — Costa Sud', 'Iceland — South Coast'),
  subtitle: L(
    lang,
    'Reykjavík → Golden Circle → Vík → Jökulsárlón → Stokksnes · 5 giorni / 4 notti',
    'Reykjavík → Golden Circle → Vík → Jökulsárlón → Stokksnes · 5 days / 4 nights',
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
    title: L(lang, 'Alba a Stokksnes e rientro', 'Stokksnes sunrise and the way back'),
    night: 'Hveragerði',
    items: [
      { type: 'activity', time: '05:45', duration_min: 90, title: L(lang, 'Alba a Stokksnes / Vestrahorn', 'Sunrise at Stokksnes / Vestrahorn'), notes: L(lang, 'La montagna più fotogenica d’Islanda: 454 metri di picchi neri che si specchiano sulla sabbia bagnata, tra dune coperte d’erba. Pedaggio al Viking Café. L’unica alzataccia del viaggio — e la ricorderete per sempre.', 'Iceland’s most photogenic mountain: 454 metres of black spikes mirrored on wet sand, among grass-tufted dunes. Small toll at the Viking Café. The trip’s only early alarm — you will remember it forever.'), lat: 64.2472, lng: -14.9797, price_usd: 8, must_see: true },
      { type: 'food', time: '07:20', duration_min: 35, title: L(lang, 'Colazione al Viking Café', 'Breakfast at the Viking Café'), notes: L(lang, 'Caffè e waffle guardando il Vestrahorn. Meritatissimi.', 'Coffee and waffles with a view of Vestrahorn. Thoroughly earned.'), lat: 64.2497, lng: -15.029, price_usd: 14 },
      { type: 'drive', time: '08:00', duration_min: 170, title: L(lang, 'Höfn → Kirkjubæjarklaustur (soste libere)', 'Höfn → Kirkjubæjarklaustur (free stops)'), notes: L(lang, 'Il giorno delle riparazioni: rifate all’indietro la costa e fermatevi dove ieri correvate. La luce del mattino cambia tutto.', 'Repair day: run the coast backwards and stop wherever you rushed past yesterday. Morning light changes everything.') },
      { type: 'food', time: '11:00', duration_min: 45, title: L(lang, 'Pranzo da Systrakaffi', 'Lunch at Systrakaffi'), notes: L(lang, 'Il caffè del paese a Kirkjubæjarklaustur: zuppe, pizza e torte. Prima di ripartire, due passi a Systrafoss qui dietro.', 'The village café in Kirkjubæjarklaustur: soups, pizza and cakes. Before leaving, stroll to Systrafoss just behind.'), lat: 63.7907, lng: -18.0507, price_usd: 30 },
      { type: 'drive', time: '12:00', duration_min: 105, title: L(lang, 'Kirkjubæjarklaustur → Seljavellir', 'Kirkjubæjarklaustur → Seljavellir'), notes: '' },
      { type: 'activity', time: '13:50', duration_min: 80, title: L(lang, 'Bagno a Seljavallalaug', 'Swim at Seljavallalaug'), notes: L(lang, 'Piscina geotermica del 1923 — la più antica d’Islanda — incastrata in una valle sotto l’Eyjafjallajökull: 15 minuti a piedi dal parcheggio, gratis, spogliatoio spartano. L’acqua è tiepida, l’esperienza è indimenticabile.', 'A 1923 geothermal pool — Iceland’s oldest — wedged in a valley under Eyjafjallajökull: a 15-minute walk from the car park, free, very basic changing room. The water is lukewarm; the experience is unforgettable.'), lat: 63.5657, lng: -19.6081, must_see: true },
      { type: 'drive', time: '15:30', duration_min: 95, title: L(lang, 'Seljavellir → Hveragerði', 'Seljavellir → Hveragerði'), notes: '' },
      { type: 'activity', time: '17:10', duration_min: 45, title: L(lang, 'Hveragerði, il paese che bolle', 'Hveragerði, the town that boils'), notes: L(lang, 'Costruito sopra un campo geotermico attivo: vapore che esce dai giardini, serre riscaldate dalla terra e il parco Hverasvæðið dove l’acqua gorgoglia a 100 °C.', 'Built on an active geothermal field: steam rising from back gardens, earth-heated greenhouses and the Hverasvæðið park where water bubbles at 100 °C.'), lat: 64.014, lng: -21.1861, price_usd: 4 },
      { type: 'hotel', time: '18:15', title: L(lang, 'Notte a Hveragerði', 'Night in Hveragerði'), notes: L(lang, 'Cena da Ölverk: pizza cotta in forno alimentato a geotermia e birre prodotte in casa.', 'Dinner at Ölverk: pizza from a geothermally powered oven and beers brewed on site.'), lat: 64.0025, lng: -21.1877, price_usd: 175, links: [{ label: 'Ölverk', url: 'https://olverk.is' }] },
    ],
  },
  {
    title: L(lang, 'Reykjavík e Sky Lagoon', 'Reykjavík and Sky Lagoon'),
    night: '',
    items: [
      { type: 'drive', time: '08:15', duration_min: 40, title: 'Hveragerði → Reykjavík', notes: L(lang, 'Ultima salita sull’altopiano di Hellisheiði, poi la capitale.', 'One last climb over the Hellisheiði plateau, then the capital.') },
      { type: 'activity', time: '09:00', duration_min: 50, title: 'Hallgrímskirkja', notes: L(lang, 'Il campanile di 74 metri ispirato alle colonne di basalto (quelle vere le avete viste a Svartifoss e Reynisfjara). Salite in cima: tetti colorati a perdita d’occhio.', 'The 74-metre tower inspired by basalt columns (you saw the real ones at Svartifoss and Reynisfjara). Ride to the top: colourful rooftops as far as you can see.'), lat: 64.1417, lng: -21.9266, price_usd: 9, must_see: true, links: [{ label: L(lang, 'Sito ufficiale', 'Official site'), url: 'https://www.hallgrimskirkja.is' }] },
      { type: 'activity', time: '10:10', duration_min: 70, title: L(lang, 'Laugavegur, Harpa e Sun Voyager', 'Laugavegur, Harpa and the Sun Voyager'), notes: L(lang, 'Scendete per Skólavörðustígur (la via arcobaleno) e Laugavegur fino al lungomare: la sala concerti Harpa con la facciata a nido d’ape e la scultura Sun Voyager, un drakkar di acciaio puntato verso il sole.', 'Walk down Skólavörðustígur (the rainbow street) and Laugavegur to the waterfront: the honeycomb-façade Harpa concert hall and the Sun Voyager, a steel dream-ship aimed at the sun.'), lat: 64.1505, lng: -21.9324 },
      { type: 'food', time: '11:30', duration_min: 30, title: L(lang, 'L’hot dog di Bæjarins Beztu', 'The Bæjarins Beztu hot dog'), notes: L(lang, 'Dal 1937, il chiosco più famoso d’Islanda (ci ha mangiato pure Bill Clinton). Ordinate «eina með öllu» — una con tutto: cipolla croccante, remoulade, senape dolce.', 'Since 1937, Iceland’s most famous stand (Bill Clinton ate here too). Order “eina með öllu” — one with everything: crispy onions, remoulade, sweet mustard.'), lat: 64.1479, lng: -21.9393, price_usd: 8, must_see: true },
      { type: 'activity', time: '12:15', duration_min: 150, title: 'Sky Lagoon', notes: L(lang, 'Infinity pool geotermica a filo d’oceano e il rituale in 7 passaggi (sauna con vetrata sul mare, scrub, bagno freddo…). Il modo perfetto di sciogliere 1.300 km di viaggio. Prenotate con largo anticipo!', 'A geothermal infinity pool flush with the ocean and the 7-step ritual (sea-view sauna, scrub, cold plunge…). The perfect way to melt away 1,300 km of driving. Book well ahead!'), lat: 64.1091, lng: -21.9527, price_usd: 85, must_see: true, links: [{ label: L(lang, 'Prenotazioni', 'Bookings'), url: 'https://www.skylagoon.com' }] },
      { type: 'drive', time: '15:00', duration_min: 25, title: L(lang, 'Sky Lagoon → riconsegna auto', 'Sky Lagoon → car drop-off'), notes: '' },
      { type: 'activity', time: '15:30', duration_min: 30, title: L(lang, 'Riconsegna del 4x4', 'Drop off the 4x4'), notes: L(lang, 'Pieno di benzina prima della riconsegna (il rifornimento dell’autonoleggio costa il doppio). Takk fyrir, Islanda!', 'Fill the tank before dropping off (the rental company’s refuel costs double). Takk fyrir, Iceland!'), lat: 64.1466, lng: -21.9426 },
    ],
  },
]

export const checklist = (lang) =>
  [
    L(lang, 'Prenotare i voli', 'Book the flights'),
    L(lang, 'Noleggio 4x4 con assicurazione ghiaia e sabbia', '4x4 rental with gravel + sand/ash protection'),
    L(lang, 'Prenotare hotel di Vík e Höfn (finiscono per primi)', 'Book the Vík and Höfn hotels (they sell out first)'),
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
  { type: 'activity', title: L(lang, 'Whale watching da Reykjavík', 'Whale watching from Reykjavík'), duration_min: 180, lat: 64.1508, lng: -21.94, notes: L(lang, 'Megattere e delfini dalla vecchia darsena, 3 ore in mare. Ad agosto avvistamenti quasi garantiti.', 'Humpbacks and dolphins from the old harbour, 3 hours at sea. Sightings near-guaranteed in August.') },
  { type: 'activity', title: L(lang, 'Secret Lagoon a Flúðir', 'Secret Lagoon in Flúðir'), duration_min: 90, lat: 64.1379, lng: -20.3095, notes: L(lang, 'La piscina pubblica più antica d’Islanda (1891), semplice e bollente, con un mini-geyser che erutta ogni 5 minuti sul bordo.', 'Iceland’s oldest public pool (1891), simple and hot, with a mini-geyser erupting every 5 minutes at its edge.') },
]

/* extra planner-mode content: a couple of checklist lines Ulisse adds live */
export const plannerChecklistExtras = (lang) => [
  L(lang, 'Scaricare le mappe offline (zone senza segnale)', 'Download offline maps (no-signal areas)'),
  L(lang, 'Controllare vedur.is e road.is ogni mattina', 'Check vedur.is and road.is every morning'),
]
