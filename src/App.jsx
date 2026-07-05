import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListChecks, CalendarRange, Sparkles, Bot } from 'lucide-react'
import { useUI, useTrip, useRoutes, activeTrip } from './store'
import { connectAgent, useAgentChat } from './agent/socket'
import { startStorageSync } from './lib/storageSync'
import { useIsDesktop, useVisualViewport } from './lib/useViewport'
import BottomSheet from './components/mobile/BottomSheet'
import SheetHeader from './components/mobile/SheetHeader'
import ChatPanel from './components/ChatPanel'
import InterviewView from './components/InterviewView'
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

const isMobileNow = () => window.innerWidth < 1024

export default function App() {
  const { t } = useTranslation()
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
    useUI.setState({ tab: 'itinerary', mapFilter: null, detail: null, editor: null, dayEditor: null, picking: false, sheet: 'half', sheetBeforePick: null })
    useAgentChat.getState().newChat()
  }, [activeId])

  /* agent bridge: keep the WebSocket to the local agent server alive */
  const chatOpen = useAgentChat((s) => s.open)
  const setChatOpen = useAgentChat((s) => s.setOpen)
  const thinking = useAgentChat((s) => s.thinking)
  const pendingQuestion = useAgentChat((s) => s.pendingQuestion)
  /* demo builds have no local server: no storage sync, scripted agent */
  useEffect(() => { connectAgent(); if (import.meta.env.VITE_DEMO !== '1') startStorageSync() }, [])

  /* mobile shell: bottom sheet over an always-visible map */
  const isDesktop = useIsDesktop()
  const vv = useVisualViewport()
  const sheet = useUI((s) => s.sheet)
  const setSheet = useUI((s) => s.setSheet)
  const phase = useTrip((s) => activeTrip(s)?.phase)
  const plannerShown = !!activeId && phase !== 'interview'
  /* static offset every floating element uses to clear the sheet's peek */
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--sheet-peek', plannerShown && !isDesktop ? 'calc(130px + env(safe-area-inset-bottom))' : '0px')
    return () => root.style.setProperty('--sheet-peek', '0px')
  }, [plannerShown, isDesktop])
  /* the chat defaults open for the desktop side panel; on a phone it is a
     fullscreen overlay and must never open by itself */
  useEffect(() => {
    if (plannerShown && !isDesktop) setChatOpen(false)
  }, [plannerShown, isDesktop, setChatOpen])

  /* the floating header's real bottom edge drives map-overlay offsets */
  const hdrRef = useRef(null)
  useEffect(() => {
    const el = hdrRef.current
    if (!el) return
    const apply = () => document.documentElement.style.setProperty('--hdr-b', `${Math.round(el.getBoundingClientRect().bottom) + 12}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    window.addEventListener('resize', apply)
    return () => { ro.disconnect(); window.removeEventListener('resize', apply) }
  })

  /* resizable panels (desktop): itinerary column + floating chat */
  const [leftW, startLeftDrag] = useDragWidth('ui.leftW', 600, 440, 820, false)
  const [chatW, startChatDrag] = useDragWidth('ui.chatW', 420, 340, 640, true)
  useEffect(() => {
    /* the mobile chat is a fullscreen overlay: it must not shift map overlays */
    useAgentChat.setState({ panelW: isDesktop && chatOpen ? chatW : 0 })
  }, [chatOpen, chatW, isDesktop])

  /* global Escape: picking, then mobile chat, then modals, then the sheet */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const ui = useUI.getState()
      if (ui.picking) setPicking(false)
      else if (isMobileNow() && useAgentChat.getState().open) setChatOpen(false)
      else if (ui.editor || ui.dayEditor || ui.detail) {
        closeEditor()
        closeDayEditor()
        ui.closeDetail()
      } else if (isMobileNow() && ui.sheet === 'full') ui.setSheet('half')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPicking, closeEditor, closeDayEditor, setChatOpen])

  const leftTab = ['checklist', 'suggestions'].includes(tab) ? tab : 'itinerary'

  if (!activeId) return <Dashboard />

  /* a newborn trip exists only as a conversation until the agent opens the planner */
  if (phase === 'interview') return <InterviewView />

  return (
    <div className="flex h-full flex-col">
      <div ref={hdrRef}><Header /></div>

      <main className="relative z-10 flex min-h-0 flex-1 lg:pointer-events-none" style={{ '--left-w': `${leftW + 12}px` }}>
        {/* map — always mounted, full-viewport background on every size */}
        <section className="pointer-events-auto fixed inset-0 z-0">
          <MapPanel />
        </section>

        {/* left panel — floating resizable card (desktop only) */}
        {isDesktop && (
          <section className="relative z-[540] hidden min-w-0 flex-1 lg:pointer-events-auto lg:absolute lg:bottom-3 lg:left-3 lg:top-3 lg:flex lg:w-[calc(var(--left-w)-12px)] lg:flex-none lg:overflow-hidden lg:rounded-3xl lg:border lg:border-ink-200 lg:shadow-2xl flex-col bg-ink-50">
            {/* desktop tabs */}
            <nav className="hidden items-center gap-1 border-b border-ink-200 bg-white px-4 pt-2 lg:flex">
              <TabBtn active={leftTab === 'itinerary'} onClick={() => setTab('itinerary')} Icon={CalendarRange} label={t('app.tabItinerary')} />
              <TabBtn active={leftTab === 'suggestions'} onClick={() => setTab('suggestions')} Icon={Sparkles} label={t('app.tabSuggestions')} />
              <TabBtn active={leftTab === 'checklist'} onClick={() => setTab('checklist')} Icon={ListChecks} label={t('app.tabChecklist')} />
            </nav>

            <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-8 pt-4 sm:px-4">
              {leftTab === 'itinerary' && <ItineraryPanel />}
              {leftTab === 'suggestions' && <Suggestions />}
              {leftTab === 'checklist' && <Checklist />}
            </div>

            {/* drag handle to resize the itinerary column */}
            <div
              onMouseDown={startLeftDrag}
              title={t('app.dragResize')}
              className="absolute right-0 top-0 z-10 hidden h-full w-1.5 cursor-col-resize transition-colors hover:bg-brand-400/60 active:bg-brand-500 lg:block"
            />
          </section>
        )}

        {/* mobile: the same panes live in a draggable bottom sheet; the
            Ulisse button rides its top edge */}
        {!isDesktop && (
          <BottomSheet
            snap={sheet}
            onSnapChange={setSheet}
            header={<SheetHeader />}
            accessory={
              !chatOpen && (
                <button
                  onClick={() => setChatOpen(true)}
                  aria-label={t('header.aiAssistant')}
                  className={`grid size-14 place-items-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-600/40 transition-all duration-300 active:scale-95 ${
                    sheet === 'full' ? 'pointer-events-none scale-50 opacity-0' : ''
                  }`}
                >
                  <Bot size={24} />
                  {(thinking || pendingQuestion) && (
                    <span className="absolute right-1 top-1 flex size-3.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-amber-400" />
                    </span>
                  )}
                </button>
              )
            }
          >
            {leftTab === 'itinerary' && <ItineraryPanel />}
            {leftTab === 'suggestions' && <Suggestions />}
            {leftTab === 'checklist' && <Checklist />}
          </BottomSheet>
        )}
        {/* AI chat — desktop floating panel over the map (resizable) */}
        {isDesktop && chatOpen && (
          <div
            style={{ width: chatW }}
            className="anim-fade-up absolute bottom-3 right-3 top-3 z-[560] hidden lg:pointer-events-auto lg:block"
          >
            <div className="relative h-full overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-2xl">
              <div
                onMouseDown={startChatDrag}
                title={t('app.dragResize')}
                className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize transition-colors hover:bg-brand-400/60 active:bg-brand-500"
              />
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          </div>
        )}
      </main>

      {/* overlays */}
      {/* mobile chat: fullscreen, above the header (outside main's stacking context) */}
      {!isDesktop && chatOpen && (
        <div className="anim-fade-up fixed inset-x-0 top-0 z-[850] bg-white" style={{ height: vv.height }}>
          <ChatPanel onClose={() => setChatOpen(false)} />
        </div>
      )}
      {detail && <ItemDetail key={`${detail.dayId}:${detail.itemId}`} />}
      {editor && !picking && <ItemEditor key={`${editor.dayId}:${editor.itemId ?? 'new'}`} />}
      {dayEditor && <DayEditor key={dayEditor.dayId ?? 'new'} />}
      {picking && (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--hdr-b,96px)+8px)] z-[800] flex justify-center px-4">
          <div className="anim-fade-up pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
            {t('app.pickOnMap')}
            <button
              onClick={() => setPicking(false)}
              className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold hover:bg-white/25"
            >
              {t('common.cancel')}
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

