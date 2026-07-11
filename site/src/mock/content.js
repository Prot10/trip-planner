/* Bilingual content for the UI mocks. Everything here is REAL app content:
   copied verbatim from the demo trip (src/demo/content.js), the app's locale
   files (src/locales) and live Booking/Google Maps search results — never
   invented, so the mocks read exactly like the product. */

const L = (lang, it, en) => (lang === 'it' ? it : en)

/* ---------- planner header (trip stats) ---------- */

export const tripHeader = (lang) => ({
  title: L(lang, 'Islanda — il Grande Anello', 'Iceland — The Ring Road'),
  subtitle: L(
    lang,
    'Reykjavík → Vík → Jökulsárlón → fiordi orientali → Mývatn → Akureyri → Reykjavík · 7 giorni / 6 notti',
    'Reykjavík → Vík → Jökulsárlón → East Fjords → Mývatn → Akureyri → Reykjavík · 7 days / 6 nights',
  ),
  stats: [
    { value: '7', label: L(lang, 'giorni', 'days') },
    { value: '52', label: L(lang, 'tappe', 'stops') },
    { value: '27h 45', label: L(lang, 'di guida', 'driving') },
    { value: L(lang, '1946 km', '1,946 km'), label: L(lang, 'totali', 'total') },
  ],
  budget: L(lang, '2020 €', '€2,020'),
  addDay: L(lang, 'Giorno', 'Day'),
})

export const panelTabs = (lang) => [
  L(lang, 'Itinerario', 'Itinerary'),
  L(lang, 'Consigli', 'Suggestions'),
  L(lang, 'Checklist', 'Checklist'),
]

export const mapUi = (lang) => ({
  wholeTrip: L(lang, 'Tutto il viaggio', 'Whole trip'),
  dayShort: (n) => L(lang, `G${n}`, `D${n}`),
  fit: L(lang, 'Inquadra viaggio', 'Fit trip'),
  search: L(lang, 'Cerca un luogo sulla mappa…', 'Search a place on the map…'),
})

/* day colors as assigned by the app's store to the demo trip */
export const DAY_COLORS = ['#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f97316', '#d946ef']

/* ---------- day 1 of the real demo trip ---------- */

export const day1 = (lang) => ({
  n: 1,
  color: DAY_COLORS[0],
  title: L(lang, 'Reykjavík → Golden Circle', 'Reykjavík → Golden Circle'),
  date: L(lang, 'LUN 3 AGO', 'MON, AUG 3'),
  night: 'Selfoss',
  drive: '3h 10',
  stops: L(lang, '8 tappe', '8 stops'),
  items: [
    {
      type: 'activity', stop: 1, time: '07:30', dur: '30 min',
      title: L(lang, 'Ritiro del 4×4 a Reykjavík', 'Pick up the 4×4 in Reykjavík'),
      notes: L(
        lang,
        'Fotografate ogni graffio prima di firmare. Assicurazione ghiaia (gravel) inclusa: sulle strade islandesi serve davvero.',
        'Photograph every scratch before signing. Gravel protection included — you will want it on Icelandic roads.',
      ),
      links: ['map', 'gmaps'],
    },
    {
      type: 'info',
      title: L(lang, 'Vento e portiere: la regola n. 1', 'Wind and car doors: rule no. 1'),
      notes: L(
        lang,
        'Il vento islandese strappa le portiere dalle mani (ed è il danno più comune, NON coperto da tutte le assicurazioni). Aprite sempre tenendole con due mani.',
        'Icelandic wind rips car doors out of your hands (the most common damage, NOT covered by every policy). Always open them with two hands.',
      ),
    },
    {
      type: 'drive', time: '08:10', dur: '45 min',
      title: L(lang, 'Reykjavík → Þingvellir', 'Reykjavík → Þingvellir'),
      notes: L(lang, 'Strada 36 lungo il lago Þingvallavatn, si sale sull’altopiano.', 'Road 36 along lake Þingvallavatn, up onto the plateau.'),
    },
    {
      type: 'activity', stop: 2, time: '09:00', dur: '1h 40', price: L(lang, '9 €', '€9'), must: true,
      title: 'Þingvellir National Park',
      notes: L(
        lang,
        'Si cammina nella faglia di Almannagjá, TRA la placca americana e quella europea, fino alla cascata Öxarárfoss. Qui nacque il primo parlamento al mondo (930 d.C.).',
        'Walk inside the Almannagjá rift, BETWEEN the American and European plates, to the Öxarárfoss waterfall. The world’s first parliament was founded here (930 AD).',
      ),
      links: ['map', 'gmaps', 'site'],
    },
    {
      type: 'drive', time: '10:50', dur: '40 min',
      title: L(lang, 'Þingvellir → Brúarfoss', 'Þingvellir → Brúarfoss'),
    },
    {
      type: 'activity', stop: 3, time: '11:30', dur: '1h 15', price: L(lang, '8 €', '€8'), must: true,
      title: L(lang, 'Brúarfoss, la cascata blu', 'Brúarfoss, the blue waterfall'),
      notes: L(
        lang,
        'La cascata più blu d’Islanda, un turchese irreale — e quasi nessuno ci va. 3,5 km a/r a piedi, sentiero facile lungo il fiume Brúará.',
        'Iceland’s bluest waterfall, an unreal turquoise — and almost nobody goes. 3.5 km round trip on an easy trail along the Brúará river.',
      ),
      links: ['map', 'gmaps'],
    },
  ],
})

/* per-language labels used by the item cards / chips */
export const itemStrings = (lang) => ({
  types: {
    activity: L(lang, 'Tappa', 'Stop'),
    drive: L(lang, 'Auto', 'Car'),
    food: L(lang, 'Cibo', 'Food'),
    hotel: 'Hotel',
    info: 'Info',
  },
  mustSee: L(lang, 'imperdibile', 'must-see'),
  map: L(lang, 'mappa', 'map'),
  gmaps: 'Google Maps',
  site: L(lang, 'Sito ufficiale', 'Official site'),
  perNight: L(lang, '/notte', '/night'),
})

/* ---------- chat panel ---------- */

export const chatStrings = (lang) => ({
  role: L(lang, 'Agente di viaggio', 'AI travel agent'),
  model: 'Claude · Sonnet',
  placeholder: L(lang, 'Scrivi a Ulisse… (@ per taggare un’attività)', 'Write to Ulisse… (@ to tag an activity)'),
  working: L(lang, 'sto lavorando…', 'working on it…'),
  show: L(lang, 'Mostra', 'Show'),
  undoAll: L(lang, 'Annulla tutto', 'Undo all'),
  edits: (n) => L(lang, `${n} modific${n === 1 ? 'a' : 'he'} in questo turno`, `${n} edit${n === 1 ? '' : 's'} this turn`),
  stepperDone: L(lang, 'Pianificazione completata', 'Planning complete'),
  stepperBuilding: L(lang, 'Sto costruendo il viaggio…', 'Building your trip…'),
  stepperLive: L(lang, 'il piano si aggiorna in tempo reale nell’itinerario', 'the plan updates in real time in the itinerary'),
  steps: [
    L(lang, 'Struttura del viaggio', 'Trip structure'),
    L(lang, 'Tappe giorno per giorno', 'Stops, day by day'),
    L(lang, 'Checklist e consigli', 'Checklist and suggestions'),
    L(lang, 'Rifiniture e budget', 'Final touches and budget'),
  ],
})

/* the grouped tool chips shown after the demo build, with real counts */
export const buildChips = (lang) => [
  L(lang, 'Impostazioni viaggio', 'Trip settings'),
  L(lang, 'Creati 7 giorni', 'Created 7 days'),
  L(lang, 'Aggiunte 89 attività', 'Added 89 activities'),
  L(lang, '9 voci in checklist', '9 checklist items'),
  L(lang, '9 nuovi consigli', '9 new suggestions'),
]

/* opening of the real end-of-build summary Ulisse writes in the demo */
export const buildSummary = (lang) =>
  L(
    lang,
    'Ecco il vostro viaggio: **il Grande Anello in 7 giorni** — tutta l’Islanda in senso orario, da Reykjavík alla laguna di Jökulsárlón, su per i fiordi orientali, Mývatn e la costa nord, e ritorno dalla porta ovest. Con quattro gemme fuori dai flussi: **Brúarfoss**, **Kvernufoss**, **Stuðlagil** e **Fjallsárlón**.',
    'Here is your trip: **the full Ring Road in 7 days** — all of Iceland clockwise, from Reykjavík to the Jökulsárlón lagoon, up the East Fjords, Mývatn and the north coast, and back in through the west door. With four gems away from the crowds: **Brúarfoss**, **Kvernufoss**, **Stuðlagil** and **Fjallsárlón**.',
  )

/* ---------- step 1: the interview's empty state ---------- */

export const interview = (lang) => ({
  title: L(lang, 'Dove andiamo?', 'Where are we going?'),
  intro: L(
    lang,
    ['Sono ', 'Ulisse', ', il tuo agente di viaggio. Raccontami cosa hai in mente: ti farò una domanda alla volta prendendo appunti, poi ', 'costruirò l’itinerario completo per te', ' — lo vedrai nascere in tempo reale.'],
    ['I’m ', 'Ulisse', ', your travel agent. Tell me what you have in mind: I’ll ask you one question at a time while taking notes, then ', 'I’ll build the full itinerary for you', ' — you’ll watch it come to life in real time.'],
  ),
  prompt: L(
    lang,
    'Un on the road in Islanda a inizio agosto: cascate, ghiacciai, spiagge nere e qualche bagno caldo. Siamo in due e guidiamo volentieri.',
    'A road trip in Iceland in early August: waterfalls, glaciers, black beaches and a hot soak or two. Two of us, happy to drive.',
  ),
  placeholder: L(lang, 'Descrivi il viaggio che sogni…', 'Describe the trip of your dreams…'),
  currency: L(lang, '€ Euro', '€ Euro'),
  footer: L(lang, 'L’itinerario si crea solo conversando con Ulisse', 'The itinerary is created only by chatting with Ulisse'),
})

/* ---------- step 2: the real demo question carousel ---------- */

export const questions = (lang) => ({
  kicker: L(lang, 'Qualche domanda veloce', 'A few quick questions'),
  counter: (i, n) => L(lang, `${i} di ${n}`, `${i} of ${n}`),
  back: L(lang, 'Indietro', 'Back'),
  next: L(lang, 'Avanti', 'Next'),
  sendAll: L(lang, 'Invia le risposte', 'Send answers'),
  list: [
    {
      question: L(lang, 'Quante giornate piene avete a disposizione?', 'How many full days do you have?'),
      kind: 'single',
      options: [
        { label: L(lang, '5 giorni', '5 days'), description: L(lang, 'Golden Circle e costa sud fino alla laguna di Jökulsárlón', 'Golden Circle and the south coast to the Jökulsárlón lagoon') },
        { label: L(lang, 'Una settimana', 'A full week'), description: L(lang, 'TUTTO l’anello: l’isola intera, Ring Road completa', 'The FULL ring: the whole island, complete Ring Road') },
        { label: L(lang, '10 giorni', '10 days'), description: L(lang, 'Anello con calma + penisola di Snæfellsnes', 'The ring at an easier pace + the Snæfellsnes peninsula') },
      ],
      pick: 1,
    },
    {
      question: L(lang, 'Che ritmo preferite?', 'What pace do you prefer?'),
      kind: 'single',
      options: [
        { label: L(lang, 'Giornate piene', 'Full-on days'), description: L(lang, 'Sveglie presto, si vede tutto il possibile', 'Early starts, see as much as possible') },
        { label: L(lang, 'Un buon mix', 'A good mix'), description: L(lang, 'Un paio di alzatacce solo per i posti top', 'A couple of early alarms, only for the highlights') },
        { label: L(lang, 'Con calma', 'Take it easy'), description: L(lang, 'Meno tappe, più tempo in ognuna', 'Fewer stops, more time at each one') },
      ],
      pick: 1,
    },
    {
      question: L(lang, 'Cosa non può assolutamente mancare?', 'What absolutely cannot be missed?'),
      kind: 'multi',
      options: [
        { label: L(lang, 'Cascate', 'Waterfalls'), description: L(lang, 'Gullfoss, Seljalandsfoss, Skógafoss…', 'Gullfoss, Seljalandsfoss, Skógafoss…') },
        { label: L(lang, 'Ghiacciai e lagune', 'Glaciers and lagoons'), description: L(lang, 'Sólheimajökull, Jökulsárlón, Diamond Beach', 'Sólheimajökull, Jökulsárlón, Diamond Beach') },
        { label: L(lang, 'Spiagge nere', 'Black sand beaches'), description: L(lang, 'Reynisfjara e Dyrhólaey', 'Reynisfjara and Dyrhólaey') },
        { label: L(lang, 'Posti segreti', 'Hidden gems'), description: L(lang, 'Brúarfoss, Kvernufoss, Fjallsárlón…', 'Brúarfoss, Kvernufoss, Fjallsárlón…') },
      ],
      picks: [0, 3],
    },
  ],
})

/* ---------- step 3: chips streamed while the itinerary builds ---------- */

export const buildStream = (lang) => [
  L(lang, 'Nuovo giorno: Reykjavík → Golden Circle', 'New day: Reykjavík → Golden Circle'),
  L(lang, 'Aggiunta: Ritiro del 4×4 a Reykjavík', 'Added: Pick up the 4×4 in Reykjavík'),
  L(lang, 'Aggiunta: Þingvellir National Park', 'Added: Þingvellir National Park'),
  L(lang, 'Aggiunta: Brúarfoss, la cascata blu', 'Added: Brúarfoss, the blue waterfall'),
]

/* ---------- step 4: an edit turn (real starter prompt + real strings) ---------- */

export const editTurn = (lang) => ({
  user: L(
    lang,
    'Trova un posto poco conosciuto ma che vale davvero la pena vicino al percorso e aggiungilo.',
    'Find a lesser-known place that’s truly worth it near the route and add it.',
  ),
  chips: [
    L(lang, 'Lettura del viaggio', 'Reading the trip'),
    L(lang, 'Lettura tappe consigliate', 'Reading suggested stops'),
    L(lang, 'Consiglio attivato: Relitto del DC-3 a Sólheimasandur', 'Suggestion enabled: Sólheimasandur DC-3 plane wreck'),
  ],
  reply: L(
    lang,
    'Fatto: il **relitto del DC-3** è nel giorno 2, tra Sólheimajökull e Dyrhólaey.',
    'Done: the **DC-3 wreck** is on day 2, between Sólheimajökull and Dyrhólaey.',
  ),
})

/* the photo the reply embeds (rendered by the chat's markdown, exactly like
   the app's get_place_images flow) */
export const editImage = (lang) => ({
  src: 'dc3.jpg',
  alt: L(lang, 'Relitto del DC-3 a Sólheimasandur', 'Sólheimasandur DC-3 plane wreck'),
})

/* day-1 stop pins for the building scene, as percentages of map-sw.png
   (computed from the stops' real coordinates with the map's own mercator
   math — they land exactly where the app would drop them) */
export const day1Pins = [
  { n: 1, x: 42.0, y: 50.5, atItem: 1 },
  { n: 2, x: 54.54, y: 44.03, atItem: 4 },
  { n: 3, x: 64.0, y: 43.51, atItem: 6 },
]

/* ---------- picks: real Booking / Google Maps results from the demo ---------- */

export const hotelsPick = (lang) => ({
  /* the conversation around the widget: the app's real hotel starter prompt,
     the tool chips it actually runs, and the shortlist intro */
  user: L(
    lang,
    'Cerca alternative per l’alloggio di Reykjavík e proponimele con prezzi reali.',
    'Search for alternatives to the stay in Reykjavík and propose them with real prices.',
  ),
  chips: [
    L(lang, 'Lettura del viaggio', 'Reading the trip'),
    L(lang, 'Hotel su Booking: Reykjavík', 'Booking hotels: Reykjavík'),
  ],
  found: L(
    lang,
    'Trovato — tre opzioni solide in pieno centro, tutte con punteggi ottimi. Prima la più affidabile:',
    'Found — three solid options right in the centre, all with excellent scores. The most trusted first:',
  ),
  kicker: L(lang, 'Proposte di alloggio', 'Accommodation picks'),
  location: 'Reykjavík',
  range: L(lang, '4 ago – 5 ago', 'Aug 4 – Aug 5'),
  none: L(lang, 'Nessuna di queste — cerchiamo altro', 'None of these — keep looking'),
  topPick: L(lang, 'Consigliato', 'Top pick'),
  pickCta: L(lang, 'Scegli', 'Pick'),
  perNight: L(lang, '/notte', '/night'),
  total: (p) => L(lang, `${p} totali`, `${p} total`),
  recordTitle: L(lang, 'Alloggio per Reykjavík', 'Stay in Reykjavík'),
  editChip: L(lang, 'Modifica: Notte a Reykjavík', 'Edited: Night in Reykjavík'),
  done: L(
    lang,
    'Fatto — **Tower Apartments** è la tua notte a Reykjavík: prezzo reale e link Booking sono sulla scheda hotel, budget aggiornato.',
    'Done — **Tower Apartments** is now your night in Reykjavík: real price and Booking link are on the hotel card, budget updated.',
  ),
  options: [
    {
      name: 'Tower Apartments', recommended: true, score: L(lang, '9,5', '9.5'),
      reviews: L(lang, '380 recensioni', '380 reviews'), detour: L(lang, 'sul percorso', 'on your route'),
      price: L(lang, '231 €', '€231'),
      note: L(lang, '380 recensioni, l’opzione più affidabile in centro.', '380 reviews, the most trusted option right in the centre.'),
    },
    {
      name: 'Premium Ice Apartments Atlantic Ocean Magic View', score: L(lang, '9,6', '9.6'),
      reviews: L(lang, '47 recensioni', '47 reviews'), detour: L(lang, '+1 km dal percorso', '+1 km off route'),
      price: L(lang, '189 €', '€189'),
      note: L(lang, 'Vista sull’Atlantico, a due passi dal centro.', 'Atlantic Ocean views, a short walk from the centre.'),
    },
    {
      name: 'Your Perfect Oasis with Large Porch & Scenic Views', score: L(lang, '9,7', '9.7'),
      reviews: L(lang, '16 recensioni', '16 reviews'), detour: L(lang, '+1 km dal percorso', '+1 km off route'),
      price: L(lang, '214 €', '€214'),
      note: L(lang, 'Ampio porticato privato con vista, zona più tranquilla.', 'A large private porch with scenic views, a quieter area.'),
    },
  ],
  mapLabel: L(lang, 'Mappa', 'Map'),
  source: 'Booking.com',
})

export const restaurantsPick = (lang) => ({
  user: L(
    lang,
    'Dove possiamo mangiare bene a Vík? Proponimi un paio di alternative valide.',
    'Where can we eat well in Vík? Propose a couple of solid alternatives.',
  ),
  chips: [
    L(lang, 'Lettura del viaggio', 'Reading the trip'),
    L(lang, 'Ristoranti su Google Maps: Vík', 'Google Maps restaurants: Vík'),
  ],
  found: L(
    lang,
    'A Vík c’è un preferito indiscusso — ecco i tre posti più recensiti per cena:',
    'Vík has a clear favourite — here are the three best-reviewed spots for dinner:',
  ),
  editChip: L(lang, 'Aggiunta: Black Crust Pizzeria', 'Added: Black Crust Pizzeria'),
  done: L(
    lang,
    'Fatto — **Black Crust Pizzeria** è la cena del giorno 2 a Vík, con il link Google Maps sulla scheda.',
    'Done — **Black Crust Pizzeria** is booked in for dinner on day 2 in Vík, with the Google Maps link on the card.',
  ),
  kicker: L(lang, 'Proposte da Google Maps', 'Google Maps picks'),
  location: 'Vík',
  range: L(lang, 'cena · Giorno 2', 'dinner · Day 2'),
  none: L(lang, 'Nessuno di questi — cerchiamo altro', 'None of these — keep looking'),
  topPick: L(lang, 'Consigliato', 'Top pick'),
  pickCta: L(lang, 'Scegli', 'Pick'),
  recordTitle: L(lang, 'Dove mangiare a Vík', 'Where to eat in Vík'),
  options: [
    {
      name: 'Black Crust Pizzeria', recommended: true, category: 'Pizza restaurant',
      rating: L(lang, '4,7', '4.7'), reviews: L(lang, '3790 recensioni', '3,790 reviews'),
      detour: L(lang, 'sul percorso', 'on your route'),
      note: L(lang, 'Pizza con impasto al carbone: l’istituzione di Vík, di gran lunga la più recensita.', 'Charcoal-crust pizza: the Vík institution, by far the most reviewed.'),
    },
    {
      name: 'The Soup Company', category: 'Soup restaurant',
      rating: L(lang, '4,7', '4.7'), reviews: L(lang, '3215 recensioni', '3,215 reviews'),
      detour: L(lang, 'sul percorso', 'on your route'),
      note: L(lang, 'Zuppa d’agnello islandese nel pane: perfetta dopo una giornata di vento.', 'Icelandic lamb soup in a bread bowl: perfect after a windy day.'),
    },
    {
      name: 'Smiðjan Brugghús', category: 'Restaurant',
      rating: L(lang, '4,7', '4.7'), reviews: L(lang, '2151 recensioni', '2,151 reviews'),
      detour: L(lang, 'sul percorso', 'on your route'),
      note: L(lang, 'Burger e birre prodotte in casa, atmosfera da birrificio.', 'House-brewed beers and burgers, a lively brewpub atmosphere.'),
    },
  ],
  mapLabel: L(lang, 'Mappa', 'Map'),
  source: 'Google Maps',
})
