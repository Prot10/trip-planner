import { useUI } from '../store'

export default function Toast() {
  const toast = useUI((s) => s.toast)
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[999] flex justify-center px-4 lg:bottom-8">
      <div className="anim-fade-up rounded-2xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
        {toast}
      </div>
    </div>
  )
}
