import { useEffect, useState } from 'react'
import { Map as MapIcon, ListChecks, CalendarRange, Sparkles, Bot } from 'lucide-react'
import { useUI, useTrip, useRoutes } from './store'
import { connectAgent, useAgentChat } from './agent/socket'
import ChatPanel from './components/ChatPanel'
import Header from './components/Header'
import ItineraryPanel from './components/ItineraryPanel'
import MapPanel from './components/MapPanel'
import Checklist from './components/Checklist'
import Suggestions from './components/Suggestions'
import ItemEditor from './components/ItemEditor'
import ItemDetail from './components/ItemDetail'
import DayEditor from './components/DayEditor'
import Dashboard from './components/Dashboard'
import ConfirmDialog from './components/ConfirmDialog'
import Toast from './components/Toast'

export default function App() {
  const activeId = useTrip((s) => s.activeId)
  const tab = useUI((s) => s.tab)
  const setTab = useUI((s) => s.setTab)
  const editor = useUI((s) => s.editor)
  const detail = useUI((s) => s.detail)
  const dayEditor = useUI((s) => s.dayEditor)
  const picking = useUI((s) => s.picking)
  const setPicking = useUI((s) => s.setPicking)
  const closeEditor = useUI((s) => s.closeEditor)
  const closeDayEditor = useUI((s) => s.closeDayEditor)

  /* leaving/switching trip: reset per-trip UI + published road distances */
  useEffect(() => {
    useRoutes.setState({ byDay: {} })
    useUI.setState({ tab: 'itinerary', mapFilter: null, detail: null, editor: null, dayEditor: null, picking: false })
    useAgentChat.getState().newChat()
  }, [activeId])

  /* agent bridge: keep the WebSocket to the local agent server alive */
  const chatOpen = useAgentChat((s) => s.open)
  const setChatOpen = useAgentChat((s) => s.setOpen)
  useEffect(() => { connectAgent() }, [])

  /* resizable panels (desktop): itinerary column + floating chat */
  const [leftW, startLeftDrag] = useDragWidth('ui.leftW', 600, 440, 820, false)
  const [chatW, startChatDrag] = useDragWidth('ui.chatW', 420, 340, 640, true)
  useEffect(() => {
    useAgentChat.setState({ panelW: chatOpen ? chatW : 0 })
  }, [chatOpen, chatW])

  /* global Escape: cancel picking, then close modals */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (useUI.getState().picking) setPicking(false)
      else {
        closeEditor()
        closeDayEditor()
        useUI.getState().closeDetail()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPicking, closeEditor, closeDayEditor])

  const leftTab = ['checklist', 'suggestions'].includes(tab) ? tab : 'itinerary'

  if (!activeId) return <Dashboard />

  return (
    <div className="flex h-full flex-col">
      <Header />

      <main className="relative flex min-h-0 flex-1" style={{ '--left-w': `${leftW + 12}px` }}>
        {/* map — full-bleed background on desktop, its own tab on mobile */}
        <section className={`relative min-w-0 flex-1 ${tab === 'map' ? 'block' : 'hidden'} lg:block lg:absolute lg:inset-0 lg:flex-none`}>
          <MapPanel />
        </section>

        {/* left panel — floating card on desktop (resizable), in-flow on mobile */}
        <section
          className={`relative z-[540] min-w-0 flex-1 lg:absolute lg:bottom-3 lg:left-3 lg:top-3 lg:w-[calc(var(--left-w)-12px)] lg:flex-none lg:overflow-hidden lg:rounded-3xl lg:border lg:border-ink-200 lg:shadow-2xl ${
            tab === 'map' || tab === 'chat' ? 'hidden lg:flex' : 'flex'
          } flex-col bg-ink-50`}
        >
          {/* desktop tabs */}
          <nav className="hidden items-center gap-1 border-b border-ink-200 bg-white px-4 pt-2 lg:flex">
            <TabBtn active={leftTab === 'itinerary'} onClick={() => setTab('itinerary')} Icon={CalendarRange} label="Itinerario" />
            <TabBtn active={leftTab === 'suggestions'} onClick={() => setTab('suggestions')} Icon={Sparkles} label="Consigli" />
            <TabBtn active={leftTab === 'checklist'} onClick={() => setTab('checklist')} Icon={ListChecks} label="Checklist" />
          </nav>

          <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-24 pt-4 sm:px-4 lg:pb-8">
            {leftTab === 'itinerary' && <ItineraryPanel />}
            {leftTab === 'suggestions' && <Suggestions />}
            {leftTab === 'checklist' && <Checklist />}
          </div>

          {/* drag handle to resize the itinerary column */}
          <div
            onMouseDown={startLeftDrag}
            title="Trascina per ridimensionare"
            className="absolute right-0 top-0 z-10 hidden h-full w-1.5 cursor-col-resize transition-colors hover:bg-brand-400/60 active:bg-brand-500 lg:block"
          />
        </section>

        {/* AI chat — mobile full tab */}
        <section className={`min-w-0 lg:hidden ${tab === 'chat' ? 'flex flex-1' : 'hidden'}`}>
          <div className="h-full min-h-0 w-full pb-14">
            <ChatPanel />
          </div>
        </section>

        {/* AI chat — desktop floating panel over the map (resizable) */}
        {chatOpen && (
          <div
            style={{ width: chatW }}
            className="anim-fade-up absolute bottom-3 right-3 top-3 z-[560] hidden lg:block"
          >
            <div className="relative h-full overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-2xl">
              <div
                onMouseDown={startChatDrag}
                title="Trascina per ridimensionare"
                className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize transition-colors hover:bg-brand-400/60 active:bg-brand-500"
              />
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          </div>
        )}
      </main>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-[700] flex border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <MobileTab active={tab === 'itinerary'} onClick={() => setTab('itinerary')} Icon={CalendarRange} label="Itinerario" />
        <MobileTab active={tab === 'map'} onClick={() => setTab('map')} Icon={MapIcon} label="Mappa" />
        <MobileTab active={tab === 'chat'} onClick={() => setTab('chat')} Icon={Bot} label="AI" />
        <MobileTab active={tab === 'suggestions'} onClick={() => setTab('suggestions')} Icon={Sparkles} label="Consigli" />
        <MobileTab active={tab === 'checklist'} onClick={() => setTab('checklist')} Icon={ListChecks} label="Checklist" />
      </nav>

      {/* overlays */}
      {detail && <ItemDetail key={`${detail.dayId}:${detail.itemId}`} />}
      {editor && !picking && <ItemEditor key={`${editor.dayId}:${editor.itemId ?? 'new'}`} />}
      {dayEditor && <DayEditor key={dayEditor.dayId ?? 'new'} />}
      {picking && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[800] flex justify-center px-4">
          <div className="anim-fade-up pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
            Clicca sulla mappa per scegliere la posizione
            <button
              onClick={() => setPicking(false)}
              className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold hover:bg-white/25"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
      <ConfirmDialog />
      <Toast />
    </div>
  )
}

/* draggable-width hook for the resizable panels, persisted per key */
function useDragWidth(key, def, min, max, invert) {
  const [w, setW] = useState(() => {
    const v = Number(localStorage.getItem(key))
    return v >= min && v <= max ? v : def
  })
  const start = (e) => {
    e.preventDefault()
    const x0 = e.clientX
    const w0 = w
    let cur = w0
    const move = (ev) => {
      cur = Math.min(max, Math.max(min, w0 + (invert ? x0 - ev.clientX : ev.clientX - x0)))
      setW(cur)
    }
    const up = () => {
      localStorage.setItem(key, String(Math.round(cur)))
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }
  return [w, start]
}

function TabBtn({ active, onClick, Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
        active ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500 hover:text-ink-700'
      }`}
    >
      <Icon size={16} strokeWidth={2.4} />
      {label}
    </button>
  )
}

function MobileTab({ active, onClick, Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
        active ? 'text-brand-600' : 'text-ink-400'
      }`}
    >
      <Icon size={21} strokeWidth={active ? 2.5 : 2} />
      {label}
    </button>
  )
}
