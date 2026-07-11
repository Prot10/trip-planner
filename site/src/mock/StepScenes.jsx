import { Send, Globe, ChevronDown } from 'lucide-react'
import { useStageLoop, useTyped, useScaleToFit } from './anim'
import {
  AgentAvatar, MockDayCard, ChatFrame, PlanningCard, ToolChip, UserBubble, Md,
  MdImage, MapPin2, ThinkingDots, EditsBar, QCard,
} from './ui.jsx'
import {
  interview, questions, day1, day1Pins, itemStrings, chatStrings, buildStream,
  editTurn, editImage, DAY_COLORS,
} from './content'
import { shot } from '../components.jsx'

const INTERVIEW_BG = 'bg-gradient-to-b from-violet-50 via-ink-50 to-brand-50/40'

/* ---------- step 1: the interview's empty state, prompt typing itself ---------- */

export function SceneTell({ lang }) {
  const iv = interview(lang)
  const [ref, stage] = useStageLoop((at) => {
    at(1, 600) // start typing
    at(2, 600 + iv.prompt.length * 16 + 600) // send button pulses
    return 600 + iv.prompt.length * 16 + 4200
  }, [lang])
  const { typed, done } = useTyped(iv.prompt, stage >= 1, 14)
  const [pre, b1, mid, b2, post] = iv.intro

  return (
    <div ref={ref} className={`${INTERVIEW_BG} px-5 py-10 sm:px-10 sm:py-14`}>
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto w-fit"><AgentAvatar className="size-16" iconSize={30} /></div>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">{iv.title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
          {pre}<b>{b1}</b>{mid}<b>{b2}</b>{post}
        </p>

        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-2 text-left shadow-lg">
          <div className="flex items-end gap-2">
            <div className="min-h-10 w-full px-2 py-2 text-sm text-ink-800">
              {typed || <span className="text-ink-300">{iv.placeholder}</span>}
              {stage >= 1 && !done && <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse rounded bg-violet-500 align-middle" />}
            </div>
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30 transition ${
              stage >= 2 ? 'animate-pulse ring-4 ring-violet-300/60' : done ? '' : 'opacity-40 shadow-none'
            }`}>
              <Send size={15} />
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-ink-100 pt-1.5">
            <span className="shrink-0 rounded-lg bg-violet-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm">{iv.currency}</span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-500">
              <span className="size-1.5 rounded-full bg-brand-500" /> Claude · Sonnet <ChevronDown size={10} className="text-ink-400" />
            </span>
            <span className="grid size-8 place-items-center rounded-xl border border-ink-200 text-ink-500 shadow-sm"><Globe size={14} /></span>
          </div>
        </div>

        <p className="pt-3 text-center text-[11px] text-ink-400">{iv.footer}</p>
      </div>
    </div>
  )
}

/* ---------- step 2: the question carousel answering itself ---------- */

export function SceneAnswer({ lang }) {
  const qs = questions(lang)
  const [ref, stage] = useStageLoop((at) => {
    at(1, 1100)  // q1 picked
    at(2, 2100)  // q2 shown
    at(3, 3200)  // q2 picked
    at(4, 4200)  // q3 shown
    at(5, 5200)  // q3 first pick
    at(6, 6100)  // q3 second pick → all done
    return 9200
  }, [lang])

  /* which question is on screen, and what is selected on it */
  const qi = stage < 2 ? 0 : stage < 4 ? 1 : 2
  const q = qs.list[qi]
  const selected =
    qi === 0 ? (stage >= 1 ? [q.pick] : [])
    : qi === 1 ? (stage >= 3 ? [q.pick] : [])
    : stage >= 6 ? q.picks : stage >= 5 ? [q.picks[0]] : []
  const segments = [0, 1, 2].map((i) => (i === qi ? 'active' : i < qi ? 'done' : 'pending'))

  return (
    <div ref={ref} className={`${INTERVIEW_BG} px-5 py-10 sm:px-10 sm:py-14`}>
      <div className="mx-auto max-w-md">
        <QCard
          q={q}
          kicker={qs.kicker}
          counter={qs.counter(qi + 1, 3)}
          backLabel={qs.back}
          nextLabel={qs.next}
          sendLabel={qs.sendAll}
          selected={selected}
          allDone={stage >= 6}
          segments={segments}
        />
      </div>
    </div>
  )
}

/* ---------- step 3: the itinerary building live, stop by stop ---------- */

/* a mini planner view (map included: it updates in real time too), rendered
   at a fixed design size and scaled — the block never changes height while
   the stops stream in */
const W3 = 1000
const H3 = 600

export function SceneWatch({ lang }) {
  const chat = chatStrings(lang)
  const stream = buildStream(lang)
  const day = day1(lang)
  const [fitRef, scale] = useScaleToFit(W3)
  const [ref, stage] = useStageLoop((at) => {
    for (let i = 1; i <= 6; i++) at(i, 500 + i * 900)
    return 10400
  }, [lang])

  /* the chip stream and the itinerary grow together */
  const items = Math.min(stage, day.items.length)
  const chips = Math.min(stage, stream.length)

  return (
    <div ref={fitRef} className="relative w-full overflow-hidden" style={{ aspectRatio: `${W3}/${H3}` }}>
      <div ref={ref} className="absolute left-0 top-0" style={{ width: W3, height: H3, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div className="relative h-full w-full overflow-hidden bg-ink-100 text-left">
          {/* an empty basemap (the app's own tiles): pins and dashed pending
              legs land on it live, exactly as Ulisse adds the stops */}
          <img src={shot('map-sw.png')} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 h-full w-full">
            {day1Pins.slice(0, -1).map((p, i) => {
              const q = day1Pins[i + 1]
              return (
                <line
                  key={p.n}
                  x1={p.x} y1={p.y} x2={q.x} y2={q.y}
                  stroke={DAY_COLORS[0]} strokeWidth="3" strokeDasharray="7 7"
                  strokeLinecap="round" vectorEffect="non-scaling-stroke"
                  className={`transition-opacity duration-500 ${items >= q.atItem ? 'opacity-80' : 'opacity-0'}`}
                />
              )
            })}
          </svg>
          {day1Pins.map((p) => (
            items >= p.atItem && (
              <span key={p.n} className="bubble-in absolute" style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <MapPin2 n={p.n} color={DAY_COLORS[0]} x={p.x} y={p.y} />
              </span>
            )
          ))}

          {/* itinerary panel, building */}
          <section className="absolute bottom-3 left-3 top-3 z-10 w-[380px] overflow-hidden rounded-3xl border border-ink-200 bg-ink-50 shadow-2xl">
            <div className="h-full px-3 pt-3">
              <MockDayCard day={day} strings={itemStrings(lang)} visibleItems={Math.max(items, 1)} />
            </div>
          </section>

          {/* Ulisse panel with the live stepper + streamed tool chips */}
          <ChatFrame strings={chat} className="absolute bottom-3 right-3 top-3 z-10 w-[310px]">
            <PlanningCard
              title={chat.stepperBuilding}
              count="1/4"
              liveNote={chat.stepperLive}
              steps={chat.steps.map((label, i) => ({
                label,
                status: i === 0 ? 'done' : i === 1 ? 'running' : 'pending',
                detail: i === 1 ? day.title : null,
              }))}
            />
            {stream.slice(0, chips).map((label) => (
              <div key={label} className="bubble-in"><ToolChip label={label} /></div>
            ))}
          </ChatFrame>
        </div>
      </div>
    </div>
  )
}

/* ---------- step 4: an edit turn — chips, photo in the reply, undo bar ---------- */

export function SceneTune({ lang }) {
  const chat = chatStrings(lang)
  const turn = editTurn(lang)
  const image = editImage(lang)
  const [ref, stage] = useStageLoop((at) => {
    at(1, 500)   // user asks for a change
    at(2, 1300)  // thinking
    at(3, 2200)  // chip 1
    at(4, 3000)  // chip 2
    at(5, 3800)  // chip 3: suggestion enabled
    at(6, 4600)  // reply types
    at(7, 4600 + turn.reply.length * 14 + 300) // the photo renders in the reply
    at(8, 4600 + turn.reply.length * 14 + 1100) // edits bar
    return 4600 + turn.reply.length * 14 + 5600
  }, [lang])
  const { typed, done } = useTyped(turn.reply, stage >= 6, 12)

  return (
    <div ref={ref} className={`${INTERVIEW_BG} px-5 py-10 sm:px-10 sm:py-12`}>
      <ChatFrame
        strings={chat}
        className="mx-auto h-[38rem] max-w-md"
        footer={stage >= 8 ? (
          <div className="bubble-in">
            <EditsBar text={chat.edits(1)} show={chat.show} undoAll={chat.undoAll} />
          </div>
        ) : null}
      >
        {stage >= 1 && <div className="bubble-in"><UserBubble>{turn.user}</UserBubble></div>}
        {stage === 2 && <ThinkingDots label={chat.working} />}
        {stage >= 3 && <div className="bubble-in"><ToolChip label={turn.chips[0]} /></div>}
        {stage >= 4 && <div className="bubble-in"><ToolChip label={turn.chips[1]} /></div>}
        {stage >= 5 && <div className="bubble-in"><ToolChip label={turn.chips[2]} /></div>}
        {stage >= 6 && <div className="bubble-in"><Md text={typed} caret={!done} /></div>}
        {/* the reply embeds the place's photo, rendered by the chat markdown */}
        {stage >= 7 && <MdImage src={image.src} alt={image.alt} />}
      </ChatFrame>
    </div>
  )
}
