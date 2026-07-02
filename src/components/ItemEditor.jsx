import { useEffect, useRef, useState } from 'react'
import {
  X, Search, Crosshair, Trash2, Plus, MapPin, Star, Check, Loader2, ImagePlus, ImageOff, Link2,
} from 'lucide-react'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { TYPE_META } from './typeMeta'
import { compressImageFile, putImg, resolveRef } from '../lib/imgdb'
import Modal from './Modal'

const EMPTY = {
  type: 'activity', title: '', time: '', dur: '', notes: '',
  links: [], must: false, done: false, lat: null, lng: null, imgs: [], noWiki: false, price: '',
}

const PRICE_LABELS = {
  hotel: 'Prezzo a notte ($)',
  food: 'Costo stimato ($)',
  drive: 'Costo ($) — pedaggi, benzina extra…',
  activity: 'Costo ($) — biglietti, parcheggio…',
  info: 'Costo ($) — ingressi, pass…',
}

export default function ItemEditor() {
  const editor = useUI((s) => s.editor)
  const closeEditor = useUI((s) => s.closeEditor)
  const openEditor = useUI((s) => s.openEditor)
  const setPicking = useUI((s) => s.setPicking)
  const setTab = useUI((s) => s.setTab)
  const ask = useUI((s) => s.ask)
  const addItem = useTrip((s) => s.addItem)
  const updateItem = useTrip((s) => s.updateItem)
  const removeItem = useTrip((s) => s.removeItem)
  const days = useTrip((s) => activeTrip(s).days)

  const { dayId, itemId, draft: savedDraft } = editor
  const existing = itemId ? days.find((d) => d.id === dayId)?.items.find((i) => i.id === itemId) : null

  const [draft, setDraft] = useState(() =>
    savedDraft ?? (existing
      ? { ...existing, dur: existing.dur || '', imgs: [...(existing.imgs ?? [])] }
      : { ...EMPTY }))
  const [searchQ, setSearchQ] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)

  /* accepts an object patch or a function of the latest draft (async-safe) */
  const set = (patch) => setDraft((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) }))

  const doSearch = async () => {
    const q = searchQ.trim()
    if (!q) return
    setSearching(true)
    setResults(null)
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=it&q=${encodeURIComponent(q)}`,
      )
      setResults(await r.json())
    } catch {
      setResults([])
      toast('Errore di rete nella ricerca')
    } finally {
      setSearching(false)
    }
  }

  const pickOnMap = () => {
    /* stash the draft so it survives while the editor hides for picking */
    openEditor(dayId, itemId, draft)
    setPicking(true)
    if (window.innerWidth < 1024) setTab('map')
  }

  const onSave = () => {
    if (!draft.title.trim()) { toast('Inserisci un titolo'); return }
    const data = {
      ...draft,
      title: draft.title.trim(),
      dur: parseInt(draft.dur, 10) || 0,
      price: parseFloat(draft.price) || 0,
      notes: draft.notes.trim(),
      links: draft.links.filter((l) => l.url.trim()).map((l) => ({
        label: l.label.trim() || 'link',
        url: /^https?:\/\//.test(l.url.trim()) ? l.url.trim() : `https://${l.url.trim()}`,
      })),
    }
    delete data.id
    if (itemId) updateItem(dayId, itemId, data)
    else addItem(dayId, data)
    closeEditor()
    toast('Attività salvata')
  }

  const onDelete = () =>
    ask(`Eliminare "${existing?.title}"?`, () => {
      removeItem(dayId, itemId)
      closeEditor()
      toast('Attività eliminata')
    })

  return (
    <Modal onClose={closeEditor} wide>
      <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
        <h3 className="font-display text-lg font-bold text-ink-900">
          {itemId ? 'Modifica attività' : 'Nuova attività'}
        </h3>
        <button onClick={closeEditor} aria-label="Chiudi" className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 sm:px-6">
        {/* type */}
        <Field label="Tipo">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(TYPE_META).map(([key, m]) => (
              <button
                key={key}
                onClick={() => set({ type: key })}
                className={`flex items-center gap-1.5 rounded-xl border-[1.5px] px-3 py-1.5 text-[13px] font-semibold transition ${
                  draft.type === key
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300 hover:text-ink-700'
                }`}
              >
                <m.Icon size={14} /> {m.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Titolo">
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="es. Tramonto a Bixby Bridge"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Orario">
            <input type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Durata (minuti)">
            <input
              type="number" min="0" step="5" placeholder="es. 90"
              value={draft.dur}
              onChange={(e) => set({ dur: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label={PRICE_LABELS[draft.type]}>
          <input
            type="number" min="0" step="1" placeholder="es. 25"
            value={draft.price || ''}
            onChange={(e) => set({ price: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field label="Note">
          <textarea
            rows={3}
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Consigli, parcheggio, cose da non perdere…"
            className={`${inputCls} resize-y`}
          />
        </Field>

        {/* links */}
        <Field label="Link">
          <div className="flex flex-col gap-2">
            {draft.links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={l.label}
                  onChange={(e) => set({ links: draft.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  placeholder="Etichetta"
                  className={`${inputCls} w-32 shrink-0 sm:w-40`}
                />
                <input
                  value={l.url}
                  onChange={(e) => set({ links: draft.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
                  placeholder="https://…"
                  className={inputCls}
                />
                <button
                  onClick={() => set({ links: draft.links.filter((_, j) => j !== i) })}
                  aria-label="Rimuovi link"
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              onClick={() => set({ links: [...draft.links, { label: '', url: '' }] })}
              className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              <Plus size={13} strokeWidth={2.6} /> Aggiungi link
            </button>
          </div>
        </Field>

        <Field label="Galleria immagini">
          <GalleryEditor draft={draft} set={set} />
        </Field>

        {/* location */}
        <Field label="Posizione sulla mappa">
          <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3">
            <div className="flex gap-2">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch() } }}
                placeholder="Cerca un luogo… (es. Bixby Bridge, California)"
                className={`${inputCls} bg-white`}
              />
              <button
                onClick={doSearch}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-600 shadow-sm transition hover:border-ink-300"
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Cerca
              </button>
            </div>

            {results && (
              <div className="mt-2 flex flex-col gap-1">
                {results.length === 0 && (
                  <p className="px-1 text-xs text-ink-400">Nessun risultato — prova ad aggiungere “, California”</p>
                )}
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { set({ lat: +(+r.lat).toFixed(5), lng: +(+r.lon).toFixed(5) }); setResults(null) }}
                    className="flex items-start gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-left text-xs text-ink-600 ring-1 ring-ink-200 transition hover:ring-brand-400"
                  >
                    <MapPin size={12} className="mt-0.5 shrink-0 text-brand-500" />
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                onClick={pickOnMap}
                className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 shadow-sm transition hover:border-brand-400 hover:text-brand-600"
              >
                <Crosshair size={13} /> Scegli sulla mappa
              </button>
              {draft.lat != null && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  <MapPin size={12} /> {draft.lat}, {draft.lng}
                  <button onClick={() => set({ lat: null, lng: null })} aria-label="Rimuovi posizione" className="ml-0.5 text-emerald-500 hover:text-rose-600">
                    <X size={12} strokeWidth={3} />
                  </button>
                </span>
              )}
            </div>
          </div>
        </Field>

        {/* toggles */}
        <div className="grid grid-cols-2 gap-3">
          <Toggle
            on={draft.must}
            onClick={() => set({ must: !draft.must })}
            Icon={Star}
            label="Imperdibile"
            onCls="border-amber-400 bg-amber-50 text-amber-700"
          />
          <Toggle
            on={draft.done}
            onClick={() => set({ done: !draft.done })}
            Icon={Check}
            label="Già fatto"
            onCls="border-emerald-400 bg-emerald-50 text-emerald-700"
          />
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center gap-2.5 border-t border-ink-100 px-5 py-4 sm:px-6">
        {itemId && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={15} /> Elimina
          </button>
        )}
        <div className="ml-auto flex gap-2.5">
          <button
            onClick={closeEditor}
            className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
          >
            Annulla
          </button>
          <button
            onClick={onSave}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[.97]"
          >
            Salva
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* the item's own photo gallery: drag & drop files, paste a URL, remove,
   click a thumb to make it the cover; optional opt-out from Wikipedia photos */
function GalleryEditor({ draft, set }) {
  const [resolved, setResolved] = useState([]) // aligned with draft.imgs
  const [urlInput, setUrlInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const fileRef = useRef(null)

  const refsKey = JSON.stringify(draft.imgs)
  useEffect(() => {
    let dead = false
    Promise.all(draft.imgs.map(resolveRef)).then((urls) => { if (!dead) setResolved(urls) })
    return () => { dead = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey])

  const addFiles = async (files) => {
    const imgs = [...files].filter((f) => f.type.startsWith('image/'))
    if (!imgs.length) return
    setBusy(true)
    const refs = []
    for (const f of imgs) {
      try { refs.push(await putImg(await compressImageFile(f))) }
      catch { toast(`"${f.name}" non è un'immagine valida`) }
    }
    setBusy(false)
    if (refs.length) {
      set((d) => ({ imgs: [...d.imgs, ...refs] }))
      toast(refs.length === 1 ? 'Foto aggiunta' : `${refs.length} foto aggiunte`)
    }
  }

  const addUrl = () => {
    const u = urlInput.trim()
    if (!u) return
    if (!/^https?:\/\//.test(u)) { toast('Inserisci un URL valido (https://…)') ; return }
    set((d) => ({ imgs: [...d.imgs, u] }))
    setUrlInput('')
  }

  const removeAt = (i) => set({ imgs: draft.imgs.filter((_, j) => j !== i) })
  const makeCover = (i) => {
    if (i === 0) return
    const imgs = [...draft.imgs]
    const [ref] = imgs.splice(i, 1)
    imgs.unshift(ref)
    set({ imgs })
    toast('Impostata come copertina')
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3">
      {/* current photos */}
      {draft.imgs.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {draft.imgs.map((ref, i) => (
            <div key={ref + i} className="group/th relative">
              <button
                type="button"
                onClick={() => makeCover(i)}
                title={i === 0 ? 'Copertina' : 'Clicca per renderla copertina'}
                className={`block size-16 overflow-hidden rounded-lg ring-2 transition ${
                  i === 0 ? 'ring-brand-500' : 'ring-transparent hover:ring-brand-300'
                }`}
              >
                {resolved[i]
                  ? <img src={resolved[i]} alt="" className="h-full w-full object-cover" />
                  : <span className="grid h-full w-full place-items-center bg-ink-200"><Loader2 size={14} className="animate-spin text-ink-400" /></span>}
              </button>
              {i === 0 && (
                <span className="absolute bottom-0.5 left-0.5 rounded bg-brand-500 px-1 py-px text-[8.5px] font-bold uppercase text-white">
                  cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Rimuovi foto"
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink-900 text-white opacity-100 shadow transition hover:bg-rose-600 lg:opacity-0 lg:group-hover/th:opacity-100"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* dropzone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files) }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed py-4 transition ${
          over ? 'border-brand-500 bg-brand-50' : 'border-ink-300 bg-white hover:border-brand-400 hover:bg-brand-50/40'
        }`}
      >
        {busy ? <Loader2 size={19} className="animate-spin text-brand-500" /> : <ImagePlus size={19} className="text-ink-400" />}
        <span className="text-xs font-semibold text-ink-500">
          Trascina qui le foto dal tuo PC <span className="text-ink-400">oppure clicca per sceglierle</span>
        </span>
      </div>
      <input
        ref={fileRef} type="file" accept="image/*" multiple hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
      />

      {/* add by URL */}
      <div className="mt-2.5 flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
          placeholder="…oppure incolla l'URL di una foto"
          className={`${inputCls} bg-white`}
        />
        <button
          type="button"
          onClick={addUrl}
          aria-label="Aggiungi foto da URL"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-600 shadow-sm transition hover:border-ink-300"
        >
          <Link2 size={14} /> Aggiungi
        </button>
      </div>

      {/* wikipedia opt-out */}
      {draft.lat != null && (
        <button
          type="button"
          onClick={() => set({ noWiki: !draft.noWiki })}
          className={`mt-2.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
            draft.noWiki ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-600'
          }`}
        >
          <ImageOff size={13} />
          {draft.noWiki ? 'Foto automatiche di Wikipedia nascoste' : 'Nascondi le foto automatiche di Wikipedia'}
        </button>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 shadow-sm outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ on, onClick, Icon, label, onCls }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border-[1.5px] py-2.5 text-sm font-semibold transition ${
        on ? onCls : 'border-ink-200 text-ink-400 hover:border-ink-300 hover:text-ink-600'
      }`}
    >
      <Icon size={15} {...(on && Icon === Star ? { fill: 'currentColor' } : {})} />
      {label}
    </button>
  )
}
