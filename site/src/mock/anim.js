import { useEffect, useRef, useState } from 'react'

/* Stage-driven looping animation for the UI mocks, paused while the block is
   off-screen (same pattern as the Ulisse section's ChatLoop). `script` gets a
   scheduler `at(stage, ms)` and must return the total cycle duration. */
export function useStageLoop(script, deps = []) {
  const [stage, setStage] = useState(0)
  const boxRef = useRef(null)

  useEffect(() => {
    let alive = true
    let timers = []
    const later = (fn, ms) => timers.push(setTimeout(() => alive && fn(), ms))

    const cycle = () => {
      setStage(0)
      const total = script((s, ms) => later(() => setStage(s), ms))
      later(cycle, total)
    }

    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { alive = true; cycle() }
        else { alive = false; timers.forEach(clearTimeout); timers = [] }
      },
      { threshold: 0.25 },
    )
    if (boxRef.current) ob.observe(boxRef.current)
    return () => { alive = false; timers.forEach(clearTimeout); ob.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return [boxRef, stage]
}

/* progressive typing: returns the visible slice of `text` while `active` */
export function useTyped(text, active, speed = 14) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) { setN(0); return }
    setN(0)
    const id = setInterval(() => {
      setN((x) => {
        if (x >= text.length) { clearInterval(id); return x }
        return x + 2
      })
    }, speed)
    return () => clearInterval(id)
  }, [active, text, speed])
  return { typed: text.slice(0, n), done: n >= text.length }
}

/* scale-to-fit: renders a fixed design-width layout and scales it to the
   container, so the mock keeps the app's exact desktop proportions at any
   viewport size (crisper than a screenshot: it scales as vectors) */
export function useScaleToFit(designW, designH, cover = false) {
  const ref = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setScale(cover
        ? Math.max(el.clientWidth / designW, el.clientHeight / designH)
        : el.clientWidth / designW)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [designW, designH, cover])
  return [ref, scale]
}
