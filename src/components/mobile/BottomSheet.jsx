/* Mobile bottom sheet over the map: three snap points (peek / half / full),
   dragged ONLY from its header so it never fights the content scroll, the
   dnd-kit item drag (which starts from card grips) or Leaflet behind it.
   Geometry is computed in JS from visualViewport so the soft keyboard can
   temporarily force the sheet fullscreen without losing the chosen snap. */

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useVisualViewport } from '../../lib/useViewport'

const EASE = 'transform 300ms cubic-bezier(.32,.72,0,1)'
const FLING = 0.5 // px/ms

export default function BottomSheet({ snap, onSnapChange, peekPx = 130, halfFrac = 0.52, fullFrac = 0.92, header, accessory, children }) {
  const sheetRef = useRef(null)
  const scrollRef = useRef(null)
  const offsetsRef = useRef({ peek: 0, half: 0, full: 0 })
  const dragRef = useRef(null) // { startY, startOff, samples: [{y,t}] }
  const { height: vvHeight, keyboardInset } = useVisualViewport()

  /* translateY offsets for each snap, from the live viewport height.
     full docks right below the app header (--hdr-b): the header owns the
     z-order above the sheet, so the grab handle must never slide under it */
  const computeOffsets = () => {
    const H = window.visualViewport?.height ?? window.innerHeight
    const safe = safeAreaBottom()
    const hdrB = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-b'))
    offsetsRef.current = {
      full: Number.isFinite(hdrB) ? Math.max(0, hdrB - 12) : Math.max(0, H - fullFrac * H),
      half: Math.max(0, H - halfFrac * H),
      peek: Math.max(0, H - peekPx - safe),
    }
  }

  const apply = (y, animate = true) => {
    const el = sheetRef.current
    if (!el) return
    el.style.transition = animate ? EASE : 'none'
    el.style.transform = `translateY(${y}px)`
  }

  /* position on mount + whenever snap/viewport/keyboard changes */
  useLayoutEffect(() => {
    computeOffsets()
    const kb = keyboardInset > 0
    apply(kb ? offsetsRef.current.full : offsetsRef.current[snap], true)
    if (scrollRef.current) scrollRef.current.style.paddingBottom = kb ? `${keyboardInset + 16}px` : ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, vvHeight, keyboardInset, peekPx, halfFrac, fullFrac])

  useEffect(() => {
    const on = () => {
      computeOffsets()
      if (!dragRef.current) apply(offsetsRef.current[snap], false)
    }
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap])

  /* ---------- header drag ---------- */
  const onPointerDown = (e) => {
    if (keyboardInset > 0) return // keyboard owns the layout: no drags
    const off = offsetsRef.current
    dragRef.current = { startY: e.clientY, startOff: off[snap], samples: [{ y: e.clientY, t: e.timeStamp }] }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const off = offsetsRef.current
    const y = Math.min(off.peek, Math.max(off.full, d.startOff + (e.clientY - d.startY)))
    apply(y, false)
    d.samples.push({ y: e.clientY, t: e.timeStamp })
    if (d.samples.length > 6) d.samples.shift()
    d.lastY = y
  }
  const endDrag = (e) => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    const off = offsetsRef.current
    const y = d.lastY ?? d.startOff
    /* velocity over the last ~80ms */
    const now = e.timeStamp
    const past = d.samples.find((s) => now - s.t <= 80) ?? d.samples[0]
    const dt = Math.max(1, now - past.t)
    const v = (e.clientY - past.y) / dt // + = downward
    const order = ['full', 'half', 'peek'] // top → bottom
    let next
    if (Math.abs(v) > FLING && d.lastY != null) {
      const cur = order.reduce((a, b) => (Math.abs(off[b] - d.startOff) < Math.abs(off[a] - d.startOff) ? b : a))
      const i = order.indexOf(cur)
      next = order[Math.min(order.length - 1, Math.max(0, i + (v > 0 ? 1 : -1)))]
    } else {
      next = order.reduce((a, b) => (Math.abs(off[b] - y) < Math.abs(off[a] - y) ? b : a))
    }
    apply(off[next], true)
    if (next !== snap) onSnapChange(next)
  }

  /* tap on the handle cycles peek → half → full → half… */
  const cycle = () => onSnapChange(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half')

  return (
    <div
      ref={sheetRef}
      className="fixed inset-x-0 top-0 z-[600] h-[100dvh] lg:hidden"
      style={{ transform: 'translateY(100vh)' }}
      role="dialog"
      aria-modal={snap === 'full'}
    >
      {/* rides the sheet's top edge (e.g. the Ulisse FAB) */}
      {accessory && <div className="absolute -top-[4.5rem] right-4">{accessory}</div>}
      <div className="flex h-full flex-col overflow-hidden rounded-t-3xl border-t border-ink-200 bg-ink-50 shadow-[0_-8px_30px_rgba(15,23,42,.18)]">
        <div
          className="touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <button
            onClick={cycle}
            aria-label="sheet"
            className="block w-full cursor-grab pt-2 active:cursor-grabbing"
          >
            <span className="mx-auto block h-1.5 w-10 rounded-full bg-ink-300" />
          </button>
          {header}
        </div>
        <div ref={scrollRef} className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-1">
          {children}
        </div>
      </div>
    </div>
  )
}

let safeCache = null
function safeAreaBottom() {
  if (safeCache != null) return safeCache
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;bottom:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden'
  document.body.appendChild(probe)
  safeCache = parseFloat(getComputedStyle(probe).paddingBottom) || 0
  probe.remove()
  return safeCache
}
