/* Demo-mode agent: replays a scripted Ulisse conversation through the exact
   event protocol the real server speaks (turn_start, assistant_delta,
   tool_call, turn_end...). Tool calls execute against the live store via the
   normal bridge in socket.js, so the itinerary, map, budget, edit log and
   undo all behave exactly like with the real agent.

   Loaded only in demo builds (dynamic import behind VITE_DEMO). */

import i18n from '../i18n'
import { useTrip, activeTrip } from '../store'
import {
  questions, texts, tripMeta, carMeta, days, checklist,
  suggestions, plannerChecklistExtras,
} from './content'

const ABORTED = Symbol('demo-aborted')

export function createDemoAgent(emit) {
  let seq = 0
  const pending = new Map() // tool_call id -> resolve(tool_result msg)
  let playing = null // { aborted } of the turn in flight
  /* per-trip conversation memory: how far each scripted flow has gone */
  const plannerTurns = new Map() // tripId -> count

  const api = {
    send(msg) {
      switch (msg.type) {
        case 'models_get':
          emit({ type: 'model', model: 'claude-sonnet-5' })
          emit({
            type: 'codex_models',
            models: [
              { id: 'gpt-5.5', label: 'GPT-5.5', note: '' },
              { id: 'gpt-5.4', label: 'GPT-5.4', note: '' },
              { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', note: '' },
            ],
          })
          break
        case 'chat':
          play(msg)
          break
        case 'tool_result': {
          const resolve = pending.get(msg.id)
          pending.delete(msg.id)
          resolve?.(msg)
          break
        }
        case 'stop':
          if (playing) playing.aborted = true
          /* unblock any tool wait (e.g. an open ask_user card) right away:
             the script must unwind and emit turn_end, not wait forever */
          for (const [id, resolve] of [...pending]) {
            pending.delete(id)
            resolve({ error: 'aborted' })
          }
          break
        default:
          break
      }
    },
  }

  async function play(msg) {
    if (playing) playing.aborted = true
    const turn = { aborted: false }
    playing = turn

    const lang = String(i18n.language || 'en').startsWith('it') ? 'it' : 'en'
    const h = helpers(turn, lang)

    emit({ type: 'turn_start' })
    emit({ type: 'session', sessionId: 'demo-session' })
    try {
      if (msg.mode === 'interview') await interviewFlow(h)
      else await plannerFlow(h)
    } catch (e) {
      if (e !== ABORTED) {
        console.error('[demo] script error', e)
        emit({ type: 'agent_error', error: String(e?.message ?? e) })
      }
    } finally {
      if (playing === turn) playing = null
      emit({ type: 'turn_end' })
    }
  }

  /* ---------- playback primitives ---------- */

  function helpers(turn, lang) {
    const guard = () => { if (turn.aborted) throw ABORTED }

    const sleep = (ms) =>
      new Promise((resolve, reject) => {
        const t0 = setInterval(() => {
          if (turn.aborted) { clearInterval(t0); reject(ABORTED) }
        }, 60)
        setTimeout(() => { clearInterval(t0); turn.aborted ? undefined : resolve() }, ms)
      })

    /* stream a markdown message word by word, then commit it as a bubble */
    async function say(text, { cps = 220 } = {}) {
      guard()
      const words = text.split(/(?<=\s)/)
      let buf = ''
      for (const w of words) {
        guard()
        buf += w
        emit({ type: 'assistant_delta', text: w })
        await sleep(Math.max(14, Math.round((w.length / cps) * 1000)))
      }
      emit({ type: 'assistant_text', text: buf })
    }

    /* run a tool through the normal execution bridge and await its result.
       ask_user resolves only when the visitor answers the card — that is
       what makes the demo genuinely interactive. */
    function tool(name, args, { chip = true } = {}) {
      guard()
      if (chip && name !== 'ask_user' && name !== 'report_progress') {
        emit({ type: 'agent_tool', name, args })
      }
      const id = `demo-${++seq}`
      return new Promise((resolve, reject) => {
        pending.set(id, (res) => {
          if (turn.aborted) reject(ABORTED)
          else if (res.error) resolve({ error: res.error })
          else resolve(res.result ?? {})
        })
        emit({ type: 'tool_call', id, name, args })
      })
    }

    /* one ask_user call = the whole question carousel; resolves with the
       answers in order once the visitor has answered all of them */
    const askAll = async (qs) => {
      const r = await tool('ask_user', { questions: qs }, { chip: false })
      guard()
      if (r?.error || r?.ok === false) throw ABORTED // carousel dismissed: end the turn quietly
      return (r.answers ?? []).map((x) => (Array.isArray(x.answer) ? x.answer.join(' · ') : String(x.answer ?? '')))
    }

    const progress = (step, status, detail) =>
      tool('report_progress', { step, status, detail }, { chip: false })

    return { lang, sleep, say, tool, askAll, progress, guard }
  }

  /* ---------- the interview: from a blank chat to a full trip ---------- */

  async function interviewFlow(h) {
    const { lang } = h
    const T = texts(lang)

    await h.sleep(500)
    await h.say(T.greeting)
    await h.sleep(350)

    /* all three questions in one carousel; the notebook is written once,
       with everything, right after the batch */
    const [a1, a2, a3] = await h.askAll(questions(lang))
    await h.sleep(250)
    await h.tool('update_notes', { notes: T.notesAll(a1, a2, a3) }, { chip: false })
    await h.sleep(400)

    await h.say(T.ready)
    await h.sleep(500)

    /* the planner opens FIRST, always: build tools are locked until then */
    await h.tool('start_planning', tripMeta(lang), { chip: false })
    await h.sleep(700)

    /* a previous aborted run may have left days behind: rebuild cleanly */
    const leftovers = activeTrip(useTrip.getState())?.days?.length ?? 0
    if (leftovers > 0) {
      await h.say(T.rebuilding)
      for (let i = leftovers; i > 0; i--) await h.tool('remove_day', { day_number: i })
    }

    const steps = T.progressSteps
    await h.tool('report_progress', { steps }, { chip: false })

    /* 1 — structure */
    await h.progress(steps[0], 'running')
    await h.tool('set_trip_meta', carMeta())
    const plan = days(lang)
    for (const d of plan) {
      await h.tool('add_day', { title: d.title, night: d.night })
      await h.sleep(90)
    }
    await h.progress(steps[0], 'done')

    /* 2 — stops, day by day */
    await h.progress(steps[1], 'running', plan[0].title)
    for (const [di, d] of plan.entries()) {
      await h.progress(steps[1], 'running', d.title)
      for (const [ii, item] of d.items.entries()) {
        await h.tool('add_activity', { ...item, day_number: di + 1, index: ii, optimal_placement: false })
        await h.sleep(di === 0 ? 140 : 70)
      }
    }
    await h.progress(steps[1], 'done')

    /* 3 — checklist + suggestions */
    await h.progress(steps[2], 'running')
    for (const text of checklist(lang)) {
      await h.tool('checklist_add', { text })
      await h.sleep(70)
    }
    for (const sug of suggestions(lang)) {
      await h.tool('add_suggestion', sug)
      await h.sleep(70)
    }
    await h.progress(steps[2], 'done')

    /* 4 — wrap up */
    await h.progress(steps[3], 'running')
    await h.sleep(600)
    await h.progress(steps[3], 'done')
    await h.sleep(400)
    await h.say(T.summary)
  }

  /* ---------- planner mode: scripted "editing" turns ---------- */

  async function plannerFlow(h) {
    const { lang } = h
    const T = texts(lang)
    const tripId = useTrip.getState().activeId
    const n = plannerTurns.get(tripId) ?? 0
    plannerTurns.set(tripId, n + 1)

    await h.sleep(500)

    if (n === 0) {
      await h.say(`${T.plannerIntro}\n\n${T.plannerSuggest}`)
      await h.sleep(300)
      const list = await h.tool('list_suggestions', {})
      const todo = (list?.suggestions ?? []).filter((s) => !s.active && s.recommended).slice(0, 2)
      const fallback = (list?.suggestions ?? []).filter((s) => !s.active).slice(0, 2)
      for (const s of (todo.length ? todo : fallback)) {
        await h.tool('toggle_suggestion', { suggestion_id: s.suggestion_id })
        await h.sleep(500)
      }
      await h.sleep(300)
      await h.say(T.plannerDone)
      return
    }

    if (n === 1) {
      await h.say(T.plannerChecklist)
      await h.sleep(300)
      for (const text of plannerChecklistExtras(lang)) {
        await h.tool('checklist_add', { text })
        await h.sleep(350)
      }
      await h.sleep(200)
      await h.say(T.plannerDone)
      return
    }

    await h.say(T.plannerEnd)
  }

  return api
}
