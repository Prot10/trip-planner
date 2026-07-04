/* Microinteraction hooks: scroll reveal, 3D tilt, magnetic buttons,
   scroll progress. All prefers-reduced-motion friendly (CSS side). */

import { useEffect, useRef } from 'react'

/* one shared observer: elements with .rv/.rv-scale get .rv-in when visible */
let observer = null
const io = () => {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('rv-in')
          observer.unobserve(e.target)
        }
      }
    },
    { threshold: 0.18, rootMargin: '0px 0px -40px 0px' },
  )
  return observer
}

/* observe every .rv/.rv-scale inside the returned ref */
export function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.rv, .rv-scale') ?? []
    els.forEach((el) => io().observe(el))
    return () => els.forEach((el) => observer?.unobserve(el))
  }, [])
  return ref
}

/* pointer-follow 3D tilt + glare position (CSS vars consumed by .tilt/.tilt-glare) */
export function useTilt(max = 7) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(pointer: coarse)').matches) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      el.style.setProperty('--ry', `${(px - 0.5) * 2 * max}deg`)
      el.style.setProperty('--rx', `${(0.5 - py) * 2 * max}deg`)
      el.style.setProperty('--gx', `${px * 100}%`)
      el.style.setProperty('--gy', `${py * 100}%`)
      el.style.setProperty('--go', '1')
    }
    const leave = () => {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
      el.style.setProperty('--go', '0')
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [max])
  return ref
}

/* buttons that lean toward the cursor */
export function useMagnet(strength = 0.25) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(pointer: coarse)').matches) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`
    }
    const leave = () => {
      el.style.transition = 'transform .45s cubic-bezier(.2,.8,.3,1.4)'
      el.style.transform = ''
      setTimeout(() => { el.style.transition = '' }, 450)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [strength])
  return ref
}

/* glow position for feature cards (no tilt, just the halo) */
export function useGlow() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`)
      el.style.setProperty('--go', '1')
    }
    const leave = () => el.style.setProperty('--go', '0')
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [])
  return ref
}

/* top progress bar: sets --sp (0..1) on the target */
export function useScrollProgress() {
  const ref = useRef(null)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)
      ref.current?.style.setProperty('--sp', String(p))
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])
  return ref
}
