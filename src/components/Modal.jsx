/* Generic modal: centered dialog on desktop, bottom sheet on mobile */
export default function Modal({ onClose, children, wide = false }) {
  return (
    <div
      className="anim-fade-in fixed inset-0 z-[900] flex items-end justify-center bg-ink-900/45 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`anim-fade-up nice-scroll max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${
          wide ? 'sm:max-w-xl' : 'sm:max-w-md'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
