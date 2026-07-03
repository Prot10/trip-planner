import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/* Minimal, dependency-free markdown for chat messages: bold/italic/code,
   links, headings, lists — and images, with consecutive ones grouped into
   a carousel. Everything is rendered as React elements (no innerHTML). */

const IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g

export default function Markdown({ text }) {
  /* split into text segments and image groups */
  const parts = []
  let last = 0
  let pendingImgs = []
  const flushImgs = () => {
    if (pendingImgs.length) {
      parts.push({ type: 'images', images: pendingImgs })
      pendingImgs = []
    }
  }
  for (const m of text.matchAll(IMG_RE)) {
    const between = text.slice(last, m.index)
    if (between.trim()) { flushImgs(); parts.push({ type: 'text', text: between }) }
    pendingImgs.push({ alt: m[1], url: m[2] })
    last = m.index + m[0].length
  }
  const tail = text.slice(last)
  if (tail.trim()) { flushImgs(); parts.push({ type: 'text', text: tail }) }
  flushImgs()

  return (
    <div className="min-w-0">
      {parts.map((p, i) =>
        p.type === 'images'
          ? <ImageGroup key={i} images={p.images} />
          : <Blocks key={i} text={p.text} />,
      )}
    </div>
  )
}

/* ---------- text blocks ---------- */

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l)
const isTableSep = (l) => /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(l) && l.includes('-')
const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

function Blocks({ text }) {
  const lines = text.split('\n')
  const blocks = []
  let list = null // { ordered, items }

  const closeList = () => { if (list) { blocks.push(list); list = null } }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trimEnd()

    /* markdown table: header row + separator + body rows */
    if (isTableRow(line) && isTableSep(lines[i + 1] ?? '')) {
      closeList()
      const header = splitRow(line)
      const rows = []
      i += 2
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]))
        i++
      }
      i--
      blocks.push({ type: 'table', header, rows })
      continue
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)/)
    const number = line.match(/^\s*\d+[.)]\s+(.*)/)
    const heading = line.match(/^(#{1,3})\s+(.*)/)
    if (bullet || number) {
      const ordered = !!number
      if (!list || list.ordered !== ordered) { closeList(); list = { type: 'list', ordered, items: [] } }
      list.items.push((bullet ?? number)[1])
    } else if (heading) {
      closeList()
      blocks.push({ type: 'heading', text: heading[2] })
    } else if (!line.trim()) {
      closeList()
      blocks.push({ type: 'gap' })
    } else {
      closeList()
      const prev = blocks[blocks.length - 1]
      if (prev?.type === 'para') prev.lines.push(line)
      else blocks.push({ type: 'para', lines: [line] })
    }
  }
  closeList()

  return blocks.map((b, i) => {
    if (b.type === 'gap') return <div key={i} className="h-2" />
    if (b.type === 'table') {
      return (
        <div key={i} className="nice-scroll mb-2 mt-1 overflow-x-auto rounded-xl ring-1 ring-ink-200">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-ink-50">
                {b.header.map((h, j) => (
                  <th key={j} className="whitespace-nowrap px-3 py-2 text-left font-bold text-ink-700">{inline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {b.rows.map((r, j) => (
                <tr key={j} className="transition-colors hover:bg-brand-50/40">
                  {r.map((c, k) => (
                    <td key={k} className="px-3 py-1.5 align-top leading-snug text-ink-600">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    if (b.type === 'heading') {
      return <p key={i} className="mb-1 mt-2 text-[13px] font-bold text-ink-900">{inline(b.text)}</p>
    }
    if (b.type === 'list') {
      const Tag = b.ordered ? 'ol' : 'ul'
      return (
        <Tag key={i} className={`mb-1.5 flex flex-col gap-0.5 pl-4 ${b.ordered ? 'list-decimal' : 'list-disc'} marker:text-ink-300`}>
          {b.items.map((it, j) => <li key={j} className="pl-0.5">{inline(it)}</li>)}
        </Tag>
      )
    }
    return (
      <p key={i} className="mb-1.5">
        {b.lines.map((l, j) => (
          <span key={j}>{j > 0 && <br />}{inline(l)}</span>
        ))}
      </p>
    )
  })
}

/* inline: **bold**, *italic*, `code`, [label](url) */
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g

function inline(text) {
  const out = []
  let last = 0
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(<b key={m.index} className="font-bold text-ink-900">{tok.slice(2, -2)}</b>)
    else if (tok.startsWith('`')) out.push(<code key={m.index} className="rounded bg-ink-100 px-1 py-px font-mono text-[11.5px]">{tok.slice(1, -1)}</code>)
    else if (tok.startsWith('*')) out.push(<i key={m.index}>{tok.slice(1, -1)}</i>)
    else {
      const lm = tok.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
      out.push(
        <a key={m.index} href={lm[2]} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700">
          {lm[1]}
        </a>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/* ---------- images: single photo or carousel ---------- */

function ImageGroup({ images }) {
  const { t } = useTranslation()
  const [idx, setIdx] = useState(0)
  const [broken, setBroken] = useState(new Set())
  const good = images.filter((_, i) => !broken.has(i))
  if (!good.length) return null
  const img = good[Math.min(idx, good.length - 1)]

  return (
    <div className="relative mb-2 mt-1 overflow-hidden rounded-xl bg-ink-100 ring-1 ring-ink-900/10">
      <img
        key={img.url}
        src={img.url}
        alt={img.alt}
        loading="lazy"
        onError={() => setBroken((s) => new Set([...s, images.indexOf(img)]))}
        className="anim-fade-in h-44 w-full object-cover"
      />
      {img.alt && (
        <span className="absolute left-2 top-2 max-w-[80%] truncate rounded-md bg-ink-900/65 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
          {img.alt}
        </span>
      )}
      {good.length > 1 && (
        <>
          <CarouselBtn side="left" onClick={() => setIdx((i) => (i - 1 + good.length) % good.length)}>
            <ChevronLeft size={15} />
          </CarouselBtn>
          <CarouselBtn side="right" onClick={() => setIdx((i) => (i + 1) % good.length)}>
            <ChevronRight size={15} />
          </CarouselBtn>
          <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
            {good.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={t('item.photoN', { n: i + 1 })}
                className={`h-1 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CarouselBtn({ side, onClick, children }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? t('item.photoPrev') : t('item.photoNext')}
      className={`absolute top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-ink-900/55 text-white backdrop-blur transition hover:bg-ink-900/80 ${
        side === 'left' ? 'left-1.5' : 'right-1.5'
      }`}
    >
      {children}
    </button>
  )
}
