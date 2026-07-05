import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X, Search, Crosshair, Trash2, Plus, MapPin, Star, Check, Loader2, ImagePlus, ImageOff, Link2,
} from 'lucide-react'
import { useTrip, useUI, toast, activeTrip } from '../store'
import { TYPE_META, MODE_META } from './typeMeta'
import { compressImageFile, putImg, resolveRef } from '../lib/imgdb'
import Modal from './Modal'

const EMPTY = {
  type: 'activity', title: '', time: '', dur: '', notes: '',
  links: [], must: false, done: false, lat: null, lng: null, imgs: [], noWiki: false, price: '', mode: 'car',
}

const PRICE_LABEL_KEYS = {
  hotel: 'editor.fields.priceHotel',
  food: 'editor.fields.priceFood',
  drive: 'editor.fields.priceDrive',
  activity: 'editor.fields.priceActivity',
  info: 'editor.fields.priceInfo',
}

export default function ItemEditor() {
  const { t, i18n } = useTranslation()
  const editor = useUI((s) => s.editor)
  const closeEditor = useUI((s) => s.closeEditor)
  const openEditor = useUI((s) => s.openEditor)
  const setPicking = useUI((s) => s.setPicking)
  const ask = useUI((s) => s.ask)
  const addItem = useTrip((s) => s.addItem)
  const updateItem = useTrip((s) => s.updateItem)
  const removeItem = useTrip((s) => s.removeItem)
  const days = useTrip((s) => activeTrip(s).days)
  const currency = useTrip((s) => activeTrip(s).currency ?? 'USD')
  const cur = currency === 'EUR' ? '€' : '$'

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
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=${i18n.language}&q=${encodeURIComponent(q)}`,
      )
      setResults(await r.json())
    } catch {
      setResults([])
      toast(t('editor.toasts.searchNetworkError'))
    } finally {
      setSearching(false)
    }
  }

  const pickOnMap = () => {
    /* stash the draft so it survives while the editor hides for picking */
    openEditor(dayId, itemId, draft)
    setPicking(true) /* parks the mobile sheet at peek by itself */
  }

  const onSave = () => {
    if (!draft.title.trim()) { toast(t('editor.toasts.titleRequired')); return }
    const data = {
      ...draft,
      title: draft.title.trim(),
      dur: parseInt(draft.dur, 10) || 0,
      price: parseFloat(draft.price) || 0,
      mode: draft.type === 'drive' ? (draft.mode ?? 'car') : null,
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
    toast(t('editor.toasts.saved'))
  }

  const onDelete = () =>
    ask(t('editor.confirmDelete', { title: existing?.title }), () => {
      removeItem(dayId, itemId)
      closeEditor()
      toast(t('editor.toasts.deleted'))
    })

  return (
    <Modal onClose={closeEditor} wide>
      <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
        <h3 className="font-display text-lg font-bold text-ink-900">
          {itemId ? t('editor.titleEdit') : t('editor.titleNew')}
        </h3>
        <button onClick={closeEditor} aria-label={t('common.close')} className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4 sm:px-6">
        {/* type */}
        <Field label={t('editor.fields.type')}>
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
                <m.Icon size={14} /> {t(m.labelKey)}
              </button>
            ))}
          </div>
        </Field>

        {draft.type === 'drive' && (
          <Field label={t('editor.fields.transportMode')}>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MODE_META).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => set({ mode: key })}
                  className={`flex items-center gap-1.5 rounded-xl border-[1.5px] px-2.5 py-1.5 text-[12.5px] font-semibold transition ${
                    (draft.mode ?? 'car') === key
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-ink-200 text-ink-500 hover:border-ink-300 hover:text-ink-700'
                  }`}
                >
                  <m.Icon size={14} /> {t(m.labelKey)}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label={t('editor.fields.title')}>
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder={t('editor.fields.titlePlaceholder')}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('editor.fields.time')}>
            <input type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className={inputCls} />
          </Field>
          <Field label={t('editor.fields.duration')}>
            <input
              type="number" min="0" step="5" placeholder={t('editor.fields.durationPlaceholder')}
              value={draft.dur}
              onChange={(e) => set({ dur: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label={t(PRICE_LABEL_KEYS[draft.type], { cur })}>
          <input
            type="number" min="0" step="1" placeholder={t('editor.fields.pricePlaceholder')}
            value={draft.price || ''}
            onChange={(e) => set({ price: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field label={t('editor.fields.notes')}>
          <textarea
            rows={3}
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder={t('editor.fields.notesPlaceholder')}
            className={`${inputCls} resize-y`}
          />
        </Field>

        {/* links */}
        <Field label={t('editor.links.label')}>
          <div className="flex flex-col gap-2">
            {draft.links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={l.label}
                  onChange={(e) => set({ links: draft.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  placeholder={t('editor.links.labelPlaceholder')}
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
                  aria-label={t('editor.links.remove')}
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
              <Plus size={13} strokeWidth={2.6} /> {t('editor.links.add')}
            </button>
          </div>
        </Field>

        <Field label={t('editor.photos.gallery')}>
          <GalleryEditor draft={draft} set={set} />
        </Field>

        {/* location */}
        <Field label={t('editor.location.label')}>
          <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3">
            <div className="flex gap-2">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch() } }}
                placeholder={t('editor.location.searchPlaceholder')}
                className={`${inputCls} bg-white`}
              />
              <button
                onClick={doSearch}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-600 shadow-sm transition hover:border-ink-300"
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                {t('editor.location.search')}
              </button>
            </div>

            {results && (
              <div className="mt-2 flex flex-col gap-1">
                {results.length === 0 && (
                  <p className="px-1 text-xs text-ink-400">{t('editor.location.noResults')}</p>
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
                <Crosshair size={13} /> {t('editor.location.pickOnMap')}
              </button>
              {draft.lat != null && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  <MapPin size={12} /> {draft.lat}, {draft.lng}
                  <button onClick={() => set({ lat: null, lng: null })} aria-label={t('editor.location.remove')} className="ml-0.5 text-emerald-500 hover:text-rose-600">
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
            label={t('editor.toggles.must')}
            onCls="border-amber-400 bg-amber-50 text-amber-700"
          />
          <Toggle
            on={draft.done}
            onClick={() => set({ done: !draft.done })}
            Icon={Check}
            label={t('editor.toggles.done')}
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
            <Trash2 size={15} /> {t('common.delete')}
          </button>
        )}
        <div className="ml-auto flex gap-2.5">
          <button
            onClick={closeEditor}
            className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onSave}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 active:scale-[.97]"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* the item's own photo gallery: drag & drop files, paste a URL, remove,
   click a thumb to make it the cover; optional opt-out from Wikipedia photos */
function GalleryEditor({ draft, set }) {
  const { t } = useTranslation()
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
      catch { toast(t('editor.toasts.invalidImage', { name: f.name })) }
    }
    setBusy(false)
    if (refs.length) {
      set((d) => ({ imgs: [...d.imgs, ...refs] }))
      toast(t('editor.toasts.photosAdded', { count: refs.length }))
    }
  }

  const addUrl = () => {
    const u = urlInput.trim()
    if (!u) return
    if (!/^https?:\/\//.test(u)) { toast(t('editor.toasts.invalidUrl')) ; return }
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
    toast(t('editor.toasts.coverSet'))
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
                title={i === 0 ? t('editor.photos.cover') : t('editor.photos.makeCover')}
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
                aria-label={t('editor.photos.remove')}
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
          {t('editor.photos.dropHere')} <span className="text-ink-400">{t('editor.photos.orClick')}</span>
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
          placeholder={t('editor.photos.urlPlaceholder')}
          className={`${inputCls} bg-white`}
        />
        <button
          type="button"
          onClick={addUrl}
          aria-label={t('editor.photos.addFromUrl')}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-600 shadow-sm transition hover:border-ink-300"
        >
          <Link2 size={14} /> {t('common.add')}
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
          {draft.noWiki ? t('editor.photos.wikiHidden') : t('editor.photos.hideWiki')}
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
