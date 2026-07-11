import { useStageLoop, useTyped } from './anim'
import { PickerCard, PickRecord, ToolChip, UserBubble, Md, ThinkingDots } from './ui.jsx'
import { hotelsPick, restaurantsPick, chatStrings } from './content'

/* One full proposal turn, replayed as it happens in the chat: the user asks,
   Ulisse reads the trip and searches, introduces what it found, the shortlist
   appears, the top pick gets chosen and the transcript collapses into the
   pick record + the resulting itinerary edit.

   Every element is pre-rendered invisible, so the block keeps its final
   height from the first frame instead of growing at each step. */
export default function PickScene({ kind, lang, active: isActive = true }) {
  const data = kind === 'hotel' ? hotelsPick(lang) : restaurantsPick(lang)
  const chat = chatStrings(lang)

  const [ref, stage] = useStageLoop((at) => {
    at(1, 400)    // user asks
    at(2, 1200)   // thinking
    at(3, 1900)   // chip: reading the trip
    at(4, 2700)   // chip: the live search
    at(5, 3600)   // "found —" line types
    at(6, 4900)   // the widget appears
    at(7, 6000)   // hover the second option
    at(8, 6800)   // hover the third
    at(9, 7600)   // hover back on the top pick
    at(10, 8400)  // picked
    at(11, 9300)  // record + resulting itinerary edit
    at(12, 10100) // the closing feedback types
    return 15500
  }, [lang, isActive])
  const { typed, done } = useTyped(data.found, stage >= 5, 10)
  const { typed: doneTyped, done: doneDone } = useTyped(data.done, stage >= 12, 10)

  const hovered = stage === 7 ? 1 : stage === 8 ? 2 : stage === 9 ? 0 : -1
  const chosen = stage === 10 ? 0 : -1

  const vis = (k) => (stage >= k ? 'bubble-in' : 'invisible')

  return (
    <div ref={ref} className="bg-gradient-to-b from-violet-50 via-ink-50 to-brand-50/40 p-4 sm:p-5">
      <div className={vis(1)}><UserBubble>{data.user}</UserBubble></div>

      {/* the thinking dots overlay the first chip's reserved slot */}
      <div className="relative">
        <div className={vis(3)}><ToolChip label={data.chips[0]} /></div>
        {stage === 2 && (
          <div className="absolute inset-0"><ThinkingDots label={chat.working} /></div>
        )}
      </div>
      <div className={vis(4)}><ToolChip label={data.chips[1]} /></div>

      {/* typed intro over an invisible copy: the space is reserved upfront */}
      <div className={`relative ${stage >= 5 ? '' : 'invisible'}`}>
        <div className="invisible" aria-hidden><Md text={data.found} /></div>
        <div className="absolute inset-0"><Md text={typed} caret={stage >= 5 && !done} /></div>
      </div>

      {/* grid-stacked so the block keeps the shortlist's height when the
          transcript collapses into the pick record */}
      <div className={`grid ${vis(6)}`}>
        <div className={`col-start-1 row-start-1 ${stage >= 11 ? 'invisible' : ''}`}>
          <PickerCard data={data} kind={kind} active={hovered} chosen={chosen} />
        </div>
        {stage >= 11 && (
          <div className="col-start-1 row-start-1">
            <div className="bubble-in flex flex-col gap-2.5">
              <PickRecord data={data} kind={kind} choice={data.options[0]} />
              <ToolChip label={data.editChip} className="mb-0" />
              {/* the closing feedback Ulisse writes once the choice is applied */}
              {stage >= 12 && (
                <div className="bubble-in">
                  <Md text={doneTyped} caret={!doneDone} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
