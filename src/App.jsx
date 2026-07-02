import { useEffect } from 'react'
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
  }, [activeId])

  /* agent bridge: keep the WebSocket to the local agent server alive */
  const chatOpen = useAgentChat((s) => s.open)
  const setChatOpen = useAgentChat((s) => s.setOpen)
  useEffect(() => { connectAgent() }, [])

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

      <main className="flex min-h-0 flex-1">
        {/* left column — itinerary / checklist */}
        <section
          className={`min-w-0 flex-1 lg:max-w-[620px] lg:border-r lg:border-ink-200 ${
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
        </section>

        {/* right column — map (desktop always, mobile when tab==='map') */}
        <section className={`relative min-w-0 flex-1 ${tab === 'map' ? 'block' : 'hidden lg:block'} ${tab === 'chat' ? '!hidden lg:!block' : ''}`}>
          <MapPanel />
        </section>

        {/* AI chat — desktop side column, mobile full tab */}
        <section
          className={`min-w-0 border-l border-ink-200 ${
            tab === 'chat' ? 'flex flex-1 lg:flex-none' : 'hidden'
          } ${chatOpen ? 'lg:flex' : 'lg:hidden'} lg:w-[400px] lg:shrink-0`}
        >
          <div className="h-full min-h-0 w-full pb-14 lg:pb-0">
            <ChatPanel onClose={() => setChatOpen(false)} />
          </div>
        </section>
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
