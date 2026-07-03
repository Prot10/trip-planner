import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, CarFront, UtensilsCrossed, BedDouble, Lightbulb } from 'lucide-react'
import { useTrip, activeTrip } from '../store'

const TYPE_ICON = { activity: MapPin, drive: CarFront, food: UtensilsCrossed, hotel: BedDouble, info: Lightbulb }

/* Chat composer with @-mentions: typing @ opens a live-filtered menu of the
   trip's activities; the pick becomes an inline chip (same size as the text)
   and the outgoing message carries the exact item ids for the agent. */
const MentionInput = forwardRef(function MentionInput({ disabled, placeholder, onSend, onEmptyChange }, ref) {
  const { t } = useTranslation()
  const days = useTrip((s) => activeTrip(s)?.days ?? [])
  const box = useRef(null)
  const [menu, setMenu] = useState(null) // { query, at: Range-anchor info }
  const [active, setActive] = useState(0)
  const [empty, setEmpty] = useState(true)

  const candidates = useMemo(
    () =>
      days.flatMap((d, i) =>
        d.items
          .filter((it) => it.title?.trim())
          .map((it) => ({ id: it.id, title: it.title, type: it.type, day: i + 1, time: it.time, color: d.color })),
      ),
    [days],
  )

  const matches = useMemo(() => {
    if (!menu) return []
    const q = menu.query.toLowerCase()
    return candidates.filter((c) => c.title.toLowerCase().includes(q)).slice(0, 6)
  }, [menu, candidates])

  useEffect(() => setActive(0), [menu?.query])

  const notifyEmpty = () => {
    const e = !box.current?.innerText.trim()
    setEmpty(e)
    onEmptyChange?.(e)
  }

  /* the '@query' being typed: from the last @ in the caret's text node */
  const findMention = () => {
    const sel = window.getSelection()
    if (!sel?.rangeCount || !box.current) return null
    const range = sel.getRangeAt(0)
    const node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE || !box.current.contains(node)) return null
    const upto = node.textContent.slice(0, range.startOffset)
    const at = upto.lastIndexOf('@')
    if (at < 0) return null
    const query = upto.slice(at + 1)
    if (query.length > 40 || query.includes('\n')) return null
    return { node, at, end: range.startOffset, query }
  }

  const refreshMenu = () => {
    const m = findMention()
    setMenu(m ? { query: m.query } : null)
  }

  const pick = (c) => {
    const m = findMention()
    if (!m) { setMenu(null); return }
    const chip = document.createElement('span')
    chip.contentEditable = 'false'
    chip.dataset.mention = c.id
    chip.dataset.title = c.title
    chip.dataset.day = c.day
    chip.className = 'mention-chip'
    chip.textContent = `@${c.title}`

    const after = m.node.splitText(m.at) // text node starting at '@'
    after.textContent = after.textContent.slice(m.end - m.at) // drop '@query'
    const space = document.createTextNode(' ')
    after.parentNode.insertBefore(chip, after)
    after.parentNode.insertBefore(space, after)

    const sel = window.getSelection()
    const range = document.createRange()
    range.setStartAfter(space)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)

    setMenu(null)
    notifyEmpty()
  }

  /* plain text + tagged item ids for the agent */
  const serialize = () => {
    const mentions = []
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent
      if (node.dataset?.mention) {
        mentions.push({ id: node.dataset.mention, title: node.dataset.title, day: node.dataset.day })
        return `@"${node.dataset.title}"`
      }
      if (node.tagName === 'BR') return '\n'
      const inner = [...node.childNodes].map(walk).join('')
      return node.tagName === 'DIV' ? `\n${inner}` : inner
    }
    let text = [...(box.current?.childNodes ?? [])].map(walk).join('').replace(/ /g, ' ').trim()
    if (mentions.length) {
      const refs = mentions.map((m) => t('mention.taggedRef', { title: m.title, id: m.id, day: m.day })).join(' · ')
      text += `\n\n${t('mention.taggedNote', { refs })}`
    }
    return text
  }

  const doSend = () => {
    const text = serialize()
    if (!text) return
    onSend(text)
    box.current.innerHTML = ''
    setMenu(null)
    notifyEmpty()
  }

  useImperativeHandle(ref, () => ({ send: doSend, focus: () => box.current?.focus(), empty }))

  const onKeyDown = (e) => {
    if (menu && matches.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % matches.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + matches.length) % matches.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(matches[active]); return }
      if (e.key === 'Escape') { e.preventDefault(); setMenu(null); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); return }
    if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); document.execCommand('insertLineBreak') }
  }

  return (
    <div className="relative min-w-0 flex-1">
      {/* suggestion menu, floating above the composer */}
      {menu && matches.length > 0 && (
        <div className="anim-fade-up absolute bottom-[calc(100%+6px)] left-0 right-0 z-30 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-xl">
          {matches.map((c, i) => {
            const Icon = TYPE_ICON[c.type] ?? MapPin
            return (
              <button
                key={c.id}
                onMouseDown={(e) => { e.preventDefault(); pick(c) }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition ${i === active ? 'bg-violet-50' : ''}`}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md text-white" style={{ background: c.color }}>
                  <Icon size={12} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink-800">{c.title}</span>
                <span className="shrink-0 text-[10.5px] font-medium text-ink-400">
                  {t('mention.dayShort', { n: c.day })}{c.time ? ` · ${c.time}` : ''}
                </span>
              </button>
            )
          })}
          <p className="border-t border-ink-100 px-3 pb-0.5 pt-1 text-[10px] text-ink-300">{t('mention.hint')}</p>
        </div>
      )}

      <div
        ref={box}
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        aria-label={t('mention.ariaLabel')}
        data-mention-input
        onInput={() => { refreshMenu(); notifyEmpty() }}
        onKeyUp={refreshMenu}
        onClick={refreshMenu}
        onBlur={() => setTimeout(() => setMenu(null), 150)}
        onKeyDown={onKeyDown}
        onPaste={(e) => {
          e.preventDefault()
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
        }}
        className={`nice-scroll max-h-32 min-h-10 w-full overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-400/20 ${
          disabled ? 'pointer-events-none opacity-50' : ''
        }`}
      />
      {empty && (
        <span className="pointer-events-none absolute left-3.5 top-2.5 text-sm text-ink-300">{placeholder}</span>
      )}
    </div>
  )
})

export default MentionInput
