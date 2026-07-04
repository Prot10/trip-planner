/* Tiny bilingual dictionary for the promo site. The choice persists in
   localStorage (shared origin with the embedded demo, which reads ui.lang). */

import { createContext, useContext, useState } from 'react'

const STR = {
  nav: {
    how: { it: 'Come funziona', en: 'How it works' },
    demo: { it: 'Demo live', en: 'Live demo' },
    ulisse: { it: 'Ulisse', en: 'Ulisse' },
    features: { it: 'Funzioni', en: 'Features' },
    install: { it: 'Installa', en: 'Install' },
    github: { it: 'GitHub', en: 'GitHub' },
  },
  hero: {
    eyebrow: { it: 'Open source · Self-hosted · I dati restano tuoi', en: 'Open source · Self-hosted · Your data stays yours' },
    titleA: { it: 'Il tuo prossimo viaggio,', en: 'Your next road trip,' },
    titleB: { it: 'pianificato conversando.', en: 'planned by talking.' },
    sub: {
      it: 'Trip Planner è un pianificatore di viaggi on the road con Ulisse, un agente AI che ti intervista e costruisce l’itinerario davanti ai tuoi occhi: tappe, mappa, tempi e budget. Gira sul tuo computer, coi tuoi abbonamenti Claude o ChatGPT — niente API key, niente cloud.',
      en: 'Trip Planner is a road-trip planner with Ulisse, an AI agent that interviews you and builds the itinerary in front of your eyes: stops, map, timings and budget. It runs on your computer, on your Claude or ChatGPT subscription — no API keys, no cloud.',
    },
    ctaDemo: { it: 'Prova la demo live', en: 'Try the live demo' },
    ctaGit: { it: 'Scarica da GitHub', en: 'Get it on GitHub' },
    hint: { it: 'Gratis, licenza AGPL. Ti serve solo Node.js.', en: 'Free, AGPL licensed. All you need is Node.js.' },
  },
  marquee: {
    items: {
      it: ['Itinerario in tempo reale', 'Mappa con percorsi veri', 'Budget e carburante', 'Domande una alla volta', 'Ogni modifica annullabile', 'Foto automatiche', 'Checklist di viaggio', 'Export e import', 'Installabile come app', 'Italiano e inglese'],
      en: ['Itinerary built live', 'Real-route map', 'Budget and fuel', 'One question at a time', 'Every edit undoable', 'Automatic photos', 'Trip checklist', 'Export and import', 'Installable as an app', 'English and Italian'],
    },
  },
  steps: {
    kicker: { it: 'Come funziona', en: 'How it works' },
    title: { it: 'Da un’idea vaga a un itinerario vero.', en: 'From a vague idea to a real itinerary.' },
    sub: { it: 'Quattro momenti, nessun modulo da compilare.', en: 'Four moments, not a single form to fill.' },
    list: {
      it: [
        { n: '01', t: 'Racconta', d: 'Apri un nuovo viaggio e di’ a Ulisse cosa hai in mente. Anche solo «Islanda, cascate e ghiacciai».' },
        { n: '02', t: 'Rispondi', d: 'Poche domande mirate, con opzioni pronte. Il taccuino di Ulisse si compila da solo, risposta dopo risposta.' },
        { n: '03', t: 'Guarda', d: 'L’itinerario nasce dal vivo: giorni, tappe con orari e prezzi, pin sulla mappa, budget che si aggiorna.' },
        { n: '04', t: 'Rifinisci', d: 'Trascina le tappe, chiedi modifiche in chat, attiva i consigli. Ogni modifica si annulla con un click.' },
      ],
      en: [
        { n: '01', t: 'Tell it', d: 'Open a new trip and tell Ulisse what you have in mind. Even just “Iceland, waterfalls and glaciers”.' },
        { n: '02', t: 'Answer', d: 'A few sharp questions with ready-made options. Ulisse’s notebook fills itself in, answer after answer.' },
        { n: '03', t: 'Watch', d: 'The itinerary is born live: days, stops with timings and prices, pins on the map, a budget that keeps up.' },
        { n: '04', t: 'Refine', d: 'Drag stops around, ask for changes in chat, enable suggestions. Every edit undoes with one click.' },
      ],
    },
  },
  demo: {
    kicker: { it: 'Demo interattiva', en: 'Interactive demo' },
    title: { it: 'Provalo adesso. Niente da installare.', en: 'Try it right now. Nothing to install.' },
    sub: {
      it: 'Questa è l’app vera, con Ulisse in versione preregistrata: rispondi alle sue domande e guarda l’itinerario islandese costruirsi tappa per tappa — mappa, budget e checklist compresi.',
      en: 'This is the real app with a pre-recorded Ulisse: answer its questions and watch the Iceland itinerary build itself stop by stop — map, budget and checklist included.',
    },
    start: { it: 'Avvia la demo', en: 'Start the demo' },
    restart: { it: 'Riavvia', en: 'Restart' },
    fullscreen: { it: 'Apri a schermo intero', en: 'Open full screen' },
    tip: {
      it: 'Suggerimento: tocca «Nuovo viaggio» e premi invia — il messaggio per Ulisse è già scritto.',
      en: 'Tip: tap “New trip” and hit send — the message for Ulisse is already written.',
    },
  },
  ulisse: {
    kicker: { it: 'L’agente', en: 'The agent' },
    title: { it: 'Ulisse lavora, tu guardi.', en: 'Ulisse does the work, you watch.' },
    sub: {
      it: 'Non è un wrapper di chat: Ulisse usa strumenti veri dentro l’app — aggiunge tappe, sposta giorni, aggiorna budget e checklist — e ogni sua mossa compare evidenziata nell’itinerario.',
      en: 'It is not a chat wrapper: Ulisse uses real tools inside the app — adding stops, moving days, updating budget and checklist — and every move shows up highlighted in the itinerary.',
    },
    points: {
      it: [
        { t: 'I tuoi abbonamenti, zero API key', d: 'Funziona con Claude (Agent SDK) o Codex CLI usando gli account che già paghi. Login guidato dall’app.' },
        { t: 'Un taccuino trasparente', d: 'Mentre ti intervista, Ulisse prende appunti in un taccuino visibile: sai sempre cosa ha capito.' },
        { t: 'Ogni modifica è reversibile', d: 'Il registro del turno elenca ogni singola modifica: annulli quella sbagliata o l’intero turno.' },
        { t: 'Domande, non moduli', d: 'Card interattive con opzioni pronte: un tap per rispondere, testo libero quando vuoi.' },
      ],
      en: [
        { t: 'Your subscriptions, zero API keys', d: 'Works with Claude (Agent SDK) or Codex CLI using the accounts you already pay for. Guided sign-in from the app.' },
        { t: 'A transparent notebook', d: 'While interviewing you, Ulisse takes notes in a visible notebook: you always know what it understood.' },
        { t: 'Every edit is reversible', d: 'The turn log lists every single change: undo the wrong one, or the whole turn.' },
        { t: 'Questions, not forms', d: 'Interactive cards with ready-made options: one tap to answer, free text whenever you want.' },
      ],
    },
    chat: {
      it: [
        { role: 'user', text: 'Troppa guida il giovedì, alleggerisci' },
        { role: 'tool', text: 'Sposta: Fjaðrárgljúfur → venerdì' },
        { role: 'tool', text: 'Aggiorna: partenza 08:00 → 09:00' },
        { role: 'assistant', text: 'Fatto: giovedì scende a 2h40 di guida. Ho spostato il canyon a venerdì mattina, era di strada.' },
      ],
      en: [
        { role: 'user', text: 'Thursday has too much driving, lighten it' },
        { role: 'tool', text: 'Move: Fjaðrárgljúfur → Friday' },
        { role: 'tool', text: 'Update: departure 08:00 → 09:00' },
        { role: 'assistant', text: 'Done: Thursday drops to 2h40 of driving. I moved the canyon to Friday morning — it was on the way.' },
      ],
    },
    undo: { it: '2 modifiche in questo turno · Annulla', en: '2 edits this turn · Undo' },
  },
  features: {
    kicker: { it: 'Tutto il resto', en: 'Everything else' },
    title: { it: 'Piccole cose fatte bene.', en: 'Small things, done properly.' },
    list: {
      it: [
        { t: 'Mappa che respira', d: 'Pin colorati per giorno, percorsi stradali veri (OSRM), luoghi d’interesse e ricerca sulla mappa.' },
        { t: 'Budget onesto', d: 'Hotel, cibo, attività e carburante calcolato sui km reali del percorso e sui consumi della tua auto.' },
        { t: 'Timeline trascinabile', d: 'Riordina tappe e giorni col drag & drop; orari e distanze si ricalcolano.' },
        { t: 'Foto automatiche', d: 'Ogni tappa si veste da sola con foto da Wikimedia in base alle coordinate.' },
        { t: 'Consigli one-tap', d: 'Ulisse lascia una lista di extra: un tap e la tappa entra nel punto migliore del percorso.' },
        { t: 'File tuoi, per sempre', d: 'Viaggi in JSON leggibili nella tua cartella Documenti, con backup automatici. Zero cloud, zero account.' },
        { t: 'Export e condivisione', d: 'Esporta e importa viaggi interi come singolo file, foto comprese.' },
        { t: 'Come un’app', d: 'Doppio click per avviarlo, installabile dal browser come app da scrivania (PWA).' },
      ],
      en: [
        { t: 'A map that breathes', d: 'Day-colored pins, real road routes (OSRM), points of interest and on-map search.' },
        { t: 'An honest budget', d: 'Hotels, food, activities, plus fuel computed from the real route distance and your car’s consumption.' },
        { t: 'Draggable timeline', d: 'Reorder stops and days with drag & drop; timings and distances recompute.' },
        { t: 'Automatic photos', d: 'Every stop dresses itself with Wikimedia photos based on its coordinates.' },
        { t: 'One-tap suggestions', d: 'Ulisse leaves a list of extras: one tap and the stop lands at the best point of the route.' },
        { t: 'Your files, forever', d: 'Trips as readable JSON in your Documents folder, with automatic backups. Zero cloud, zero accounts.' },
        { t: 'Export and share', d: 'Export and import whole trips as a single file, photos included.' },
        { t: 'Like a native app', d: 'Double-click to launch, installable from the browser as a desktop app (PWA).' },
      ],
    },
  },
  install: {
    kicker: { it: 'Installazione', en: 'Install' },
    title: { it: 'Doppio click e sei in viaggio.', en: 'Double click and you are on the road.' },
    sub: {
      it: 'Scarica il progetto, fai doppio click sul launcher del tuo sistema e si apre nel browser. Serve solo Node.js 20.19+.',
      en: 'Download the project, double-click the launcher for your OS and it opens in the browser. All you need is Node.js 20.19+.',
    },
    stepGet: { it: 'Scarica', en: 'Download' },
    stepGetD: { it: 'Clona il repository o scarica lo ZIP da GitHub.', en: 'Clone the repository or download the ZIP from GitHub.' },
    stepLaunch: { it: 'Avvia', en: 'Launch' },
    stepLaunchD: {
      it: 'Doppio click sul launcher: installa le dipendenze al primo avvio, poi apre l’app.',
      en: 'Double-click the launcher: it installs dependencies on first run, then opens the app.',
    },
    stepUse: { it: 'Collega l’AI', en: 'Connect the AI' },
    stepUseD: {
      it: 'Al primo messaggio a Ulisse, l’app ti guida nel login con Claude o ChatGPT. Fine.',
      en: 'On your first message to Ulisse, the app walks you through signing in with Claude or ChatGPT. Done.',
    },
    or: { it: 'oppure, da terminale', en: 'or, from a terminal' },
    docker: { it: 'oppure con Docker', en: 'or with Docker' },
    copied: { it: 'Copiato', en: 'Copied' },
    launchers: {
      it: [['macOS', 'Start Trip Planner.command'], ['Windows', 'Start Trip Planner.bat'], ['Linux', 'start-trip-planner.sh']],
      en: [['macOS', 'Start Trip Planner.command'], ['Windows', 'Start Trip Planner.bat'], ['Linux', 'start-trip-planner.sh']],
    },
  },
  footer: {
    tag: { it: 'Pianifica viaggi conversando. Sul tuo computer.', en: 'Plan trips by talking. On your computer.' },
    license: { it: 'Open source, licenza AGPL-3.0', en: 'Open source, AGPL-3.0 licensed' },
    repo: { it: 'Repository', en: 'Repository' },
    issues: { it: 'Segnala un problema', en: 'Report an issue' },
    demoLink: { it: 'Demo a schermo intero', en: 'Full-screen demo' },
  },
}

const LangCtx = createContext({ lang: 'it', setLang: () => {} })

export const detectLang = () => {
  try {
    const saved = localStorage.getItem('site.lang')
    if (saved === 'it' || saved === 'en') return saved
  } catch { /* private mode */ }
  return (navigator.language || 'en').startsWith('it') ? 'it' : 'en'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)
  const setLang = (l) => {
    setLangState(l)
    try {
      localStorage.setItem('site.lang', l)
      localStorage.setItem('ui.lang', l) // the embedded demo shares the origin
    } catch { /* private mode */ }
    document.documentElement.lang = l
  }
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>
}

export function useLang() {
  const { lang, setLang } = useContext(LangCtx)
  /* t('hero.titleA') resolves the current language; arrays/objects pass through */
  const t = (path) => {
    let node = STR
    for (const k of path.split('.')) node = node?.[k]
    return node?.[lang]
  }
  return { lang, setLang, t }
}
