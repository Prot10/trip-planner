/* Demo-mode content: the scripted Ulisse conversation and the Iceland trip
   it builds live, in both languages. Pure data — the playback engine that
   turns this into streamed events lives in agent.js. */

const L = (lang, it, en) => (lang === 'it' ? it : en)

/* hero starter pills shown in the demo (override the stock ones) */
export const DEMO_STARTERS = {
  it: [
    'Un on the road in Islanda: cascate, ghiacciai e spiagge nere',
    '5 giorni sulla costa sud islandese, ad agosto',
    'Islanda con calma: terme, natura e cucina locale',
    'Golden Circle e laguna glaciale di Jökulsárlón',
  ],
  en: [
    'A road trip in Iceland: waterfalls, glaciers and black beaches',
    '5 days on the Icelandic south coast, in August',
    'Iceland at a relaxed pace: hot springs, nature and local food',
    'Golden Circle and the Jökulsárlón glacier lagoon',
  ],
}

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
      { label: L(lang, 'Cucina locale', 'Local food'), description: L(lang, 'Zuppa di aragosta, hot dog, skyr', 'Lobster soup, hot dogs, skyr') },
    ],
    allow_other: true,
  },
]

/* ---------- conversation texts ---------- */

export const texts = (lang) => ({
  greeting: L(
    lang,
    "Che meraviglia, l'**Islanda**! Prima di disegnare l'itinerario ho bisogno di tre risposte veloci — prendo appunti man mano sul mio taccuino, lo vedi accanto alla chat.\n\n*(Questa è una demo interattiva: la conversazione è preregistrata, ma tutto quello che vedi — tappe, mappa, budget — viene costruito dal vivo, esattamente come col vero Ulisse.)*",
    "Iceland — what a treat! Before I sketch the itinerary I need three quick answers. I take notes as we go in my notebook, right next to the chat.\n\n*(This is an interactive demo: the conversation is pre-recorded, but everything you see — stops, map, budget — is built live, exactly like with the real Ulisse.)*",
  ),
  afterQ1: L(lang, 'Segnato. Seconda domanda:', 'Noted. Second question:'),
  afterQ2: L(lang, "Perfetto, ultima domanda e poi si parte:", 'Great — one last question and we are off:'),
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
    `Ecco il vostro viaggio: **5 giorni lungo la costa sud**, da Reykjavík alla laguna glaciale di Jökulsárlón e ritorno.

Qualche dritta:
- **Reynisfjara**: mai dare le spalle all'oceano, le *sneaker waves* sono pericolose davvero.
- **Meteo**: controllate [vedur.is](https://en.vedur.is) ogni mattina — in Islanda cambia in un'ora.
- **Benzina**: fate il pieno quando capita, tra Vík e Höfn le stazioni sono rare.
- **Sky Lagoon**: prenotate il prima possibile, i biglietti finiscono.

Il budget stimato lo vedi in alto: include hotel, pasti, attività e una stima del carburante calcolata sui km reali del percorso. Nella tab **Consigli** ho lasciato qualche extra se avanza tempo. Buon viaggio!`,
    `Here is your trip: **5 days along the south coast**, from Reykjavík to the Jökulsárlón glacier lagoon and back.

A few tips:
- **Reynisfjara**: never turn your back on the ocean — *sneaker waves* are genuinely dangerous.
- **Weather**: check [vedur.is](https://en.vedur.is) every morning — Iceland changes in an hour.
- **Fuel**: top up whenever you can; stations are scarce between Vík and Höfn.
- **Sky Lagoon**: book as early as you can, slots sell out.

The estimated budget is in the header: hotels, meals, activities plus a fuel estimate computed on the real route distance. I also left a few extras in the **Suggestions** tab in case you have spare time. Enjoy!`,
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
  notes1: (a) =>
    L(
      lang,
      `# Islanda — costa sud\n\n## Richieste\n- **Durata**: ${a}\n- Ritmo: _da chiedere_\n- Interessi: _da chiedere_`,
      `# Iceland — south coast\n\n## Requirements\n- **Duration**: ${a}\n- Pace: _to ask_\n- Interests: _to ask_`,
    ),
  notes2: (a1, a2) =>
    L(
      lang,
      `# Islanda — costa sud\n\n## Richieste\n- **Durata**: ${a1}\n- **Ritmo**: ${a2}\n- Interessi: _da chiedere_`,
      `# Iceland — south coast\n\n## Requirements\n- **Duration**: ${a1}\n- **Pace**: ${a2}\n- Interests: _to ask_`,
    ),
  notes3: (a1, a2, a3) =>
    L(
      lang,
      `# Islanda — costa sud\n\n## Richieste\n- **Durata**: ${a1}\n- **Ritmo**: ${a2}\n- **Interessi**: ${a3}\n\n## Piano\n- Anello sud: Reykjavík → Golden Circle → cascate → Vík → Jökulsárlón → ritorno\n- Auto 4x4, agosto, prezzi in valuta scelta\n- Prenotare in anticipo: Sky Lagoon, hotel a Vík e Höfn`,
      `# Iceland — south coast\n\n## Requirements\n- **Duration**: ${a1}\n- **Pace**: ${a2}\n- **Interests**: ${a3}\n\n## Plan\n- Southern loop: Reykjavík → Golden Circle → waterfalls → Vík → Jökulsárlón → back\n- 4x4 car, August, prices in the chosen currency\n- Book ahead: Sky Lagoon, hotels in Vík and Höfn`,
    ),
})

/* ---------- the trip Ulisse builds, as tool-call arguments ---------- */

export const tripMeta = (lang) => ({
  title: L(lang, 'Islanda — Costa Sud', 'Iceland — South Coast'),
  subtitle: L(
    lang,
    'Reykjavík → Golden Circle → Vík → Jökulsárlón · 5 giorni / 4 notti',
    'Reykjavík → Golden Circle → Vík → Jökulsárlón · 5 days / 4 nights',
  ),
  transport: 'car',
  start_date: '2026-08-10',
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
      { type: 'activity', time: '08:00', duration_min: 30, title: L(lang, 'Ritiro auto a Reykjavík', 'Pick up the car in Reykjavík'), notes: L(lang, 'Controllate l’assicurazione ghiaia (gravel protection): sulle strade islandesi serve davvero.', 'Make sure gravel protection is included — you will want it on Icelandic roads.'), lat: 64.1466, lng: -21.9426 },
      { type: 'drive', time: '08:40', duration_min: 45, title: L(lang, 'Reykjavík → Þingvellir', 'Reykjavík → Þingvellir'), notes: L(lang, 'Strada 36, si sale sull’altopiano.', 'Road 36, up onto the plateau.') },
      { type: 'activity', time: '09:30', duration_min: 90, title: 'Þingvellir National Park', notes: L(lang, 'Cammini tra due placche continentali: faglia di Almannagjá e cascata Öxarárfoss. Parcheggio P1.', 'Walk between two continental plates: the Almannagjá rift and Öxarárfoss waterfall. Park at P1.'), lat: 64.2559, lng: -21.1295, price_usd: 8, must_see: true, links: [{ label: L(lang, 'Sito ufficiale', 'Official site'), url: 'https://www.thingvellir.is/en/' }] },
      { type: 'drive', time: '11:10', duration_min: 50, title: L(lang, 'Þingvellir → Geysir', 'Þingvellir → Geysir'), notes: L(lang, 'Strada 365/37 lungo il lago Laugarvatn.', 'Roads 365/37 along lake Laugarvatn.') },
      { type: 'activity', time: '12:00', duration_min: 50, title: L(lang, 'Geysir e Strokkur', 'Geysir and Strokkur'), notes: L(lang, 'Strokkur erutta ogni 5–10 minuti: tenete la fotocamera pronta e state sopravvento.', 'Strokkur erupts every 5–10 minutes: camera ready, stay upwind.'), lat: 64.3104, lng: -20.3024, must_see: true },
      { type: 'food', time: '12:55', duration_min: 45, title: L(lang, 'Pranzo al Geysir Center', 'Lunch at the Geysir Center'), notes: L(lang, 'Zuppa di agnello o skyr bar: veloce e onesto.', 'Lamb soup or the skyr bar: quick and decent.'), lat: 64.3097, lng: -20.2989, price_usd: 38 },
      { type: 'activity', time: '13:50', duration_min: 60, title: 'Gullfoss', notes: L(lang, 'La “cascata d’oro”, doppio salto nel canyon dell’Hvítá. Sentiero superiore + piattaforma bassa se aperta.', 'The “golden waterfall”, a double drop into the Hvítá canyon. Upper trail + lower platform if open.'), lat: 64.3271, lng: -20.1199, must_see: true, links: [{ label: 'Info', url: 'https://www.gullfoss.is' }] },
      { type: 'drive', time: '15:10', duration_min: 55, title: L(lang, 'Gullfoss → Kerið', 'Gullfoss → Kerið'), notes: L(lang, 'Ritorno verso sud sulla 35.', 'Back south on road 35.') },
      { type: 'activity', time: '16:10', duration_min: 40, title: L(lang, 'Cratere Kerið', 'Kerið crater'), notes: L(lang, 'Cratere vulcanico con lago turchese: giro completo sul bordo in 20 minuti.', 'Volcanic crater with a turquoise lake: the full rim loop takes 20 minutes.'), lat: 64.0413, lng: -20.885, price_usd: 4 },
      { type: 'drive', time: '17:00', duration_min: 25, title: L(lang, 'Kerið → Selfoss', 'Kerið → Selfoss'), notes: '' },
      { type: 'hotel', time: '17:30', title: L(lang, 'Notte a Selfoss', 'Night in Selfoss'), notes: L(lang, 'Cittadina comoda per ripartire verso la costa sud. Cena consigliata: Tryggvaskáli.', 'Handy base to head down the south coast. Dinner tip: Tryggvaskáli.'), lat: 63.9339, lng: -21.0011, price_usd: 145 },
    ],
  },
  {
    title: L(lang, 'Cascate e spiagge nere', 'Waterfalls and black beaches'),
    night: 'Vík í Mýrdal',
    items: [
      { type: 'drive', time: '08:00', duration_min: 65, title: L(lang, 'Selfoss → Seljalandsfoss', 'Selfoss → Seljalandsfoss'), notes: L(lang, 'Ring Road verso est, l’Eyjafjallajökull compare a sinistra.', 'Ring Road east — Eyjafjallajökull appears on your left.') },
      { type: 'activity', time: '09:10', duration_min: 75, title: 'Seljalandsfoss + Gljúfrabúi', notes: L(lang, 'Si cammina DIETRO la cascata: k-way obbligatorio. A 600 m c’è Gljúfrabúi, nascosta nella gola — non saltatela.', 'You walk BEHIND the waterfall: rain jacket required. 600 m away hides Gljúfrabúi, tucked in a gorge — do not skip it.'), lat: 63.6156, lng: -19.9886, price_usd: 7, must_see: true },
      { type: 'drive', time: '10:35', duration_min: 30, title: 'Seljalandsfoss → Skógafoss', notes: '' },
      { type: 'activity', time: '11:05', duration_min: 70, title: 'Skógafoss', notes: L(lang, '60 metri di salto e arcobaleni quasi garantiti. I 527 gradini portano alla vista dall’alto, da cui parte il sentiero Fimmvörðuháls.', 'A 60-metre drop with near-guaranteed rainbows. 527 steps lead to the top view, where the Fimmvörðuháls trail starts.'), lat: 63.5321, lng: -19.5114, must_see: true },
      { type: 'food', time: '12:20', duration_min: 45, title: L(lang, 'Pranzo a Skógar', 'Lunch in Skógar'), notes: L(lang, 'Mia’s Country Van o il bistro del museo.', "Mia's Country Van or the museum bistro."), lat: 63.5306, lng: -19.5083, price_usd: 32 },
      { type: 'drive', time: '13:10', duration_min: 25, title: L(lang, 'Skógar → Sólheimajökull', 'Skógar → Sólheimajökull'), notes: '' },
      { type: 'activity', time: '13:35', duration_min: 70, title: L(lang, 'Lingua glaciale Sólheimajökull', 'Sólheimajökull glacier tongue'), notes: L(lang, '20 minuti a piedi dal parcheggio e sei davanti al ghiacciaio, cenere nera e ghiaccio blu. Con guida si cammina sopra (extra).', 'A 20-minute walk from the car park puts you in front of the glacier — black ash on blue ice. Guided walks go on top (extra).'), lat: 63.5304, lng: -19.351, price_usd: 6 },
      { type: 'activity', time: '15:05', duration_min: 45, title: 'Dyrhólaey', notes: L(lang, 'L’arco di roccia nera e, a giugno–agosto, i puffin sulle scogliere. Strada ripida per il faro: ok col 4x4.', 'The black rock arch and, June–August, puffins on the cliffs. Steep track to the lighthouse: fine with a 4x4.'), lat: 63.4023, lng: -19.13 },
      { type: 'activity', time: '16:10', duration_min: 50, title: L(lang, 'Spiaggia nera di Reynisfjara', 'Reynisfjara black beach'), notes: L(lang, 'Colonne di basalto e i faraglioni Reynisdrangar. ATTENZIONE alle sneaker waves: mai dare le spalle al mare.', 'Basalt columns and the Reynisdrangar sea stacks. BEWARE of sneaker waves: never turn your back on the ocean.'), lat: 63.4043, lng: -19.074, must_see: true },
      { type: 'hotel', time: '17:30', title: L(lang, 'Notte a Vík', 'Night in Vík'), notes: L(lang, 'Il paese più a sud d’Islanda, sotto la chiesetta rossa. Cena: Sudur-Vík.', 'Iceland’s southernmost village, below the little red church. Dinner: Sudur-Vík.'), lat: 63.4187, lng: -19.006, price_usd: 165 },
    ],
  },
  {
    title: L(lang, 'Vík → laguna glaciale', 'Vík → glacier lagoon'),
    night: 'Höfn',
    items: [
      { type: 'drive', time: '08:00', duration_min: 60, title: 'Vík → Fjaðrárgljúfur', notes: L(lang, 'Si attraversa il campo lavico di Eldhraun, muschio a perdita d’occhio.', 'You cross the Eldhraun lava field — moss as far as the eye can see.') },
      { type: 'activity', time: '09:05', duration_min: 60, title: L(lang, 'Canyon Fjaðrárgljúfur', 'Fjaðrárgljúfur canyon'), notes: L(lang, 'Gola serpeggiante profonda 100 m, sentiero sul bordo con piattaforme panoramiche.', 'A winding 100-metre-deep gorge; rim trail with viewing platforms.'), lat: 63.7714, lng: -18.1716, must_see: true },
      { type: 'drive', time: '10:15', duration_min: 70, title: 'Fjaðrárgljúfur → Skaftafell', notes: L(lang, 'Le sandur: piane di sabbia nera coi ponti a corsia unica.', 'The sandur: black outwash plains and single-lane bridges.') },
      { type: 'activity', time: '11:30', duration_min: 110, title: L(lang, 'Skaftafell — sentiero per Svartifoss', 'Skaftafell — Svartifoss trail'), notes: L(lang, '5,5 km a/r fino alla cascata incorniciata da canne d’organo di basalto. Scarpe da trekking.', 'A 5.5 km round hike to the waterfall framed by basalt organ pipes. Hiking shoes.'), lat: 64.0163, lng: -16.9663, price_usd: 7, must_see: true, links: [{ label: 'Vatnajökull NP', url: 'https://www.vatnajokulsthjodgardur.is/en' }] },
      { type: 'food', time: '13:25', duration_min: 35, title: L(lang, 'Pranzo veloce al visitor center', 'Quick lunch at the visitor centre'), notes: '', lat: 64.0167, lng: -16.9705, price_usd: 26 },
      { type: 'drive', time: '14:05', duration_min: 55, title: 'Skaftafell → Jökulsárlón', notes: '' },
      { type: 'activity', time: '15:00', duration_min: 90, title: L(lang, 'Laguna glaciale di Jökulsárlón', 'Jökulsárlón glacier lagoon'), notes: L(lang, 'Iceberg che si staccano dal Breiðamerkurjökull e vanno al mare. Spesso si vedono foche. Zodiac tour opzionale.', 'Icebergs calving off Breiðamerkurjökull drift out to sea. Seals are a common sight. Optional zodiac tour.'), lat: 64.0784, lng: -16.2306, must_see: true },
      { type: 'activity', time: '16:35', duration_min: 40, title: 'Diamond Beach', notes: L(lang, 'Dall’altra parte della strada: blocchi di ghiaccio levigati sulla sabbia nera. Magia pura al tramonto.', 'Just across the road: polished ice chunks on black sand. Pure magic at sunset.'), lat: 64.0426, lng: -16.1774 },
      { type: 'drive', time: '17:20', duration_min: 60, title: 'Jökulsárlón → Höfn', notes: '' },
      { type: 'food', time: '19:00', duration_min: 75, title: L(lang, 'Cena: zuppa di aragosta a Höfn', 'Dinner: lobster soup in Höfn'), notes: L(lang, 'Höfn è la capitale islandese dell’astice. Pakkhús o Hafnarbúðin.', 'Höfn is Iceland’s langoustine capital. Pakkhús or Hafnarbúðin.'), lat: 64.2539, lng: -15.2082, price_usd: 55 },
      { type: 'hotel', time: '20:30', title: L(lang, 'Notte a Höfn', 'Night in Höfn'), notes: '', lat: 64.2547, lng: -15.2103, price_usd: 170 },
    ],
  },
  {
    title: L(lang, 'Vestrahorn e rientro', 'Vestrahorn and the way back'),
    night: 'Hveragerði',
    items: [
      { type: 'activity', time: '07:30', duration_min: 70, title: L(lang, 'Alba a Stokksnes / Vestrahorn', 'Sunrise at Stokksnes / Vestrahorn'), notes: L(lang, 'La montagna più fotogenica d’Islanda, dune nere e riflessi sulla spiaggia. Pedaggio privato al Viking Café.', 'Iceland’s most photogenic mountain: black dunes and mirror reflections. Small private toll at the Viking Café.'), lat: 64.2472, lng: -14.9797, price_usd: 7, must_see: true },
      { type: 'drive', time: '09:00', duration_min: 200, title: L(lang, 'Stokksnes → Seljavallalaug (soste libere)', 'Stokksnes → Seljavallalaug (free stops)'), notes: L(lang, 'Rientro lungo la Ring Road: fermatevi dove ieri correvate.', 'Back along the Ring Road: stop wherever you rushed past yesterday.') },
      { type: 'food', time: '12:30', duration_min: 40, title: L(lang, 'Pranzo on the road a Kirkjubæjarklaustur', 'Road lunch in Kirkjubæjarklaustur'), notes: '', lat: 63.7907, lng: -18.0507, price_usd: 28 },
      { type: 'activity', time: '14:20', duration_min: 75, title: L(lang, 'Bagno a Seljavallalaug', 'Swim at Seljavallalaug'), notes: L(lang, 'Piscina geotermica del 1923 incastrata in una valle: 15 minuti a piedi, gratis, spogliatoio spartano. Esperienza vera.', 'A 1923 geothermal pool wedged in a valley: 15-minute walk in, free, very basic changing room. The real thing.'), lat: 63.5657, lng: -19.6081 },
      { type: 'drive', time: '15:50', duration_min: 95, title: L(lang, 'Seljavallalaug → Hveragerði', 'Seljavallalaug → Hveragerði'), notes: '' },
      { type: 'activity', time: '17:40', duration_min: 45, title: L(lang, 'Hveragerði, il paese delle serre', 'Hveragerði, the greenhouse village'), notes: L(lang, 'Serre riscaldate dalla geotermia e vapori che escono dai giardini.', 'Greenhouses heated by geothermal steam rising from back gardens.'), lat: 64.0011, lng: -21.1863 },
      { type: 'hotel', time: '18:40', title: L(lang, 'Notte a Hveragerði', 'Night in Hveragerði'), notes: L(lang, 'Cena: Ölverk, pizza e birra geotermica.', 'Dinner: Ölverk — pizza and geothermally brewed beer.'), lat: 64.0025, lng: -21.1877, price_usd: 140 },
    ],
  },
  {
    title: L(lang, 'Reykjavík e partenza', 'Reykjavík and departure'),
    night: '',
    items: [
      { type: 'drive', time: '08:30', duration_min: 40, title: 'Hveragerði → Reykjavík', notes: '' },
      { type: 'activity', time: '09:20', duration_min: 50, title: 'Hallgrímskirkja', notes: L(lang, 'Salite in cima al campanile: vista sui tetti colorati della città.', 'Ride up the tower for the view over the city’s colourful rooftops.'), lat: 64.1417, lng: -21.9266, price_usd: 9, must_see: true },
      { type: 'activity', time: '10:20', duration_min: 60, title: L(lang, 'Harpa e Sun Voyager', 'Harpa and the Sun Voyager'), notes: L(lang, 'Passeggiata sul lungomare: la sala concerti di vetro e la scultura-drakkar.', 'Waterfront walk: the glass concert hall and the ship sculpture.'), lat: 64.1505, lng: -21.9324 },
      { type: 'food', time: '11:30', duration_min: 60, title: L(lang, 'Pranzo su Laugavegur', 'Lunch on Laugavegur'), notes: L(lang, 'L’hot dog di Bæjarins Beztu è d’obbligo (eina með öllu — uno con tutto).', 'The Bæjarins Beztu hot dog is mandatory (eina með öllu — one with everything).'), lat: 64.1475, lng: -21.9347, price_usd: 30 },
      { type: 'activity', time: '13:00', duration_min: 120, title: 'Sky Lagoon', notes: L(lang, 'Infinity pool geotermica sull’oceano e rituale in 7 passaggi. Il modo giusto di chiudere il viaggio. Prenotare!', 'A geothermal infinity pool on the ocean with a 7-step ritual. The right way to end the trip. Book ahead!'), lat: 64.1091, lng: -21.9527, price_usd: 78, must_see: true, links: [{ label: L(lang, 'Prenotazioni', 'Bookings'), url: 'https://www.skylagoon.com' }] },
      { type: 'activity', time: '15:40', duration_min: 45, title: L(lang, 'Riconsegna auto', 'Drop off the car'), notes: L(lang, 'Pieno di benzina prima della riconsegna.', 'Fill the tank before dropping off.'), lat: 64.1466, lng: -21.9426 },
    ],
  },
]

export const checklist = (lang) =>
  [
    L(lang, 'Prenotare i voli', 'Book the flights'),
    L(lang, 'Noleggio 4x4 con assicurazione ghiaia', '4x4 rental with gravel protection'),
    L(lang, 'Prenotare Sky Lagoon', 'Book Sky Lagoon'),
    L(lang, 'Prenotare gli hotel (Vík e Höfn per primi)', 'Book the hotels (Vík and Höfn first)'),
    L(lang, 'K-way e strati caldi', 'Rain jacket and warm layers'),
    L(lang, 'Costume e telo per le terme', 'Swimsuit and towel for the hot springs'),
    L(lang, 'Scarpe da trekking impermeabili', 'Waterproof hiking shoes'),
  ]

export const suggestions = (lang) => [
  { type: 'activity', title: 'Blue Lagoon', duration_min: 150, recommended: true, lat: 63.8804, lng: -22.4495, notes: L(lang, 'La spa più famosa d’Islanda, vicino all’aeroporto: perfetta all’arrivo o prima del volo di ritorno.', 'Iceland’s most famous spa, near the airport: perfect on arrival or before the flight home.') },
  { type: 'activity', title: L(lang, 'Fiume caldo di Reykjadalur', 'Reykjadalur hot river'), duration_min: 180, recommended: true, lat: 64.0225, lng: -21.2117, notes: L(lang, 'Ora di cammino da Hveragerði, poi ci si immerge in un fiume termale in mezzo alle colline.', 'An hour’s hike from Hveragerði, then a soak in a warm river between the hills.') },
  { type: 'activity', title: L(lang, 'Whale watching da Reykjavík', 'Whale watching from Reykjavík'), duration_min: 180, lat: 64.1508, lng: -21.94, notes: L(lang, 'Megattere e delfini dalla vecchia darsena, 3 ore in mare.', 'Humpbacks and dolphins from the old harbour, 3 hours at sea.') },
  { type: 'activity', title: L(lang, 'Zodiac tour a Jökulsárlón', 'Jökulsárlón zodiac tour'), duration_min: 60, lat: 64.0784, lng: -16.2306, notes: L(lang, 'Tra gli iceberg fino al fronte del ghiacciaio (~50 €).', 'Among the icebergs up to the glacier face (~€50).') },
  { type: 'food', title: L(lang, 'Friðheimar: pranzo nella serra di pomodori', 'Friðheimar: lunch in the tomato greenhouse'), duration_min: 75, lat: 64.1734, lng: -20.4113, notes: L(lang, 'Zuppa di pomodoro infinita tra le piante, sul Golden Circle. Prenotare.', 'Endless tomato soup among the vines, on the Golden Circle. Book ahead.') },
]

/* extra planner-mode content: a couple of checklist lines Ulisse adds live */
export const plannerChecklistExtras = (lang) => [
  L(lang, 'Scaricare le mappe offline (zone senza segnale)', 'Download offline maps (no-signal areas)'),
  L(lang, 'Controllare vedur.is e road.is ogni mattina', 'Check vedur.is and road.is every morning'),
]
