import { useStageLoop, useTyped, useScaleToFit } from './anim'
import {
  MockAppHeader, MockTabs, MockDayCard, ChatFrame, PlanningCard, ToolChip, Md,
  MapControls, SearchPill,
} from './ui.jsx'
import {
  tripHeader, panelTabs, mapUi, day1, itemStrings, chatStrings, buildChips,
  buildSummary, DAY_COLORS,
} from './content'
import { shot } from '../components.jsx'

/* The hero visual: a live replica of the whole planner — header, itinerary,
   map and the Ulisse panel replaying the end of the demo build. Rendered at a
   fixed desktop width and scaled to fit, so it keeps the app's exact
   proportions everywhere (and stays sharp: it scales as vectors). */
const W = 1280
const H = 780

export default function HeroApp({ lang, cover = false }) {
  const [fitRef, scale] = useScaleToFit(W, H, cover)
  const [loopRef, stage] = useStageLoop((at) => {
    /* 1..5: grouped tool chips pop in; 6: summary types; 7: done */
    for (let i = 1; i <= 5; i++) at(i, 400 + i * 420)
    at(6, 3100)
    at(7, 8200)
    return 14000
  }, [lang])

  const header = tripHeader(lang)
  const chat = chatStrings(lang)
  const chips = buildChips(lang)
  const summary = buildSummary(lang)
  const { typed, done } = useTyped(summary, stage >= 6, 12)

  const shown = Math.min(stage, 5)

  return (
    <div
      ref={fitRef}
      className={`relative overflow-hidden ${cover ? 'h-full w-full' : 'w-full'}`}
      style={cover ? undefined : { aspectRatio: `${W}/${H}` }}
    >
      {/* absolutely positioned: the unscaled 1280×780 layout must not grow
          the aspect box (transform scales pixels, not layout). In cover mode
          the overflow crops symmetrically, like object-cover would. */}
      <div
        ref={loopRef}
        className="absolute"
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          left: cover ? `calc(50% - ${(W * scale) / 2}px)` : 0,
          top: cover ? `calc(50% - ${(H * scale) / 2}px)` : 0,
        }}
      >
        <div className="relative h-full w-full overflow-hidden bg-ink-100 text-left">
          {/* the real app map render (routes + pins) fills the viewport,
              exactly like the app's fixed fullscreen map */}
          <img src={shot('map-bg.png')} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />

          <div className="relative flex h-full flex-col">
          <MockAppHeader header={header} />

          <main className="relative z-0 m-3 min-h-0 flex-1">

            {/* itinerary panel */}
            <section className="absolute bottom-0 left-0 top-0 z-10 flex w-[340px] flex-col overflow-hidden rounded-3xl border border-ink-200 bg-ink-50 shadow-2xl">
              <MockTabs tabs={panelTabs(lang)} />
              <div className="min-h-0 flex-1 overflow-hidden px-3 pt-4">
                <MockDayCard day={day1(lang)} strings={itemStrings(lang)} />
              </div>
            </section>

            {/* map chrome */}
            <div className="absolute bottom-0 left-[364px] right-[344px] top-0">
              <div className="relative h-full">
                <MapControls ui={mapUi(lang)} colors={DAY_COLORS} />
                <div className="absolute right-0 top-3 z-10"><SearchPill placeholder={mapUi(lang).search} /></div>
              </div>
            </div>

            {/* Ulisse panel, replaying the end of the demo build */}
            <ChatFrame strings={chat} className="absolute bottom-0 right-0 top-0 z-10 w-[320px]">
              <PlanningCard
                title={chat.stepperDone}
                count="4/4"
                done
                steps={chat.steps.map((label) => ({ label, status: 'done' }))}
              />
              {chips.slice(0, shown).map((label, i) => (
                <div key={label} className="bubble-in"><ToolChip label={label} grouped={i > 0} /></div>
              ))}
              {stage >= 6 && (
                <div className="bubble-in">
                  <Md text={typed} caret={!done} />
                </div>
              )}
            </ChatFrame>
          </main>
          </div>
        </div>
      </div>
    </div>
  )
}
