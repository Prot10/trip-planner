/* Viewport hooks for the mobile shell.

   useIsDesktop decides WHICH container mounts (desktop floating panels vs
   the mobile bottom sheet) so the desktop DOM stays byte-identical.
   useVisualViewport tracks the on-screen keyboard (visualViewport). */

import { useEffect, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 64rem)' // Tailwind lg

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => matchMedia(DESKTOP_QUERY).matches)
  useEffect(() => {
    const mq = matchMedia(DESKTOP_QUERY)
    const on = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return isDesktop
}

/* height of the visible viewport and how much the soft keyboard eats */
export function useVisualViewport() {
  const [state, setState] = useState(() => read())
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const on = () => setState(read())
    vv.addEventListener('resize', on)
    vv.addEventListener('scroll', on)
    return () => {
      vv.removeEventListener('resize', on)
      vv.removeEventListener('scroll', on)
    }
  }, [])
  return state
}

function read() {
  const vv = window.visualViewport
  if (!vv) return { height: window.innerHeight, keyboardInset: 0 }
  return {
    height: vv.height,
    keyboardInset: Math.max(0, window.innerHeight - vv.height - vv.offsetTop),
  }
}
