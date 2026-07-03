import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HardDrive, FolderOpen, Loader2, TriangleAlert, Sparkles, Trash2 } from 'lucide-react'
import { toast } from '../store'
import { useStorage, configureDataDir, migrateToDisk } from '../lib/storageSync'
import { storageApi } from '../lib/storageClient'

/* Everything about the on-disk data folder, shown in the Dashboard:
   - first boot: enable card with the default path pre-filled
   - real browser data found while the disk is empty: migration confirm
   - configured: a quiet settings row (path, change folder, clean images) */

export function StorageSetupCard() {
  const { t } = useTranslation()
  const { status, defaultDir, migrationOffer } = useStorage()
  const [path, setPath] = useState('')
  const [busy, setBusy] = useState(false)

  if (status === 'unconfigured') {
    const value = path || defaultDir || ''
    const enable = async () => {
      setBusy(true)
      try {
        await configureDataDir(value)
        toast(t('storage.enabledToast'))
      } catch (e) {
        toast(t('storage.errorToast', { error: e.message }))
      } finally {
        setBusy(false)
      }
    }
    return (
      <div className="anim-fade-up mb-5 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
            <HardDrive size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[14px] font-bold text-ink-900">{t('storage.setupTitle')}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{t('storage.setupBody')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-ink-50 px-2.5 ring-1 ring-ink-200 focus-within:ring-brand-400">
                <FolderOpen size={13} className="shrink-0 text-ink-400" />
                <input
                  value={value}
                  onChange={(e) => setPath(e.target.value)}
                  spellCheck={false}
                  aria-label={t('storage.pathAria')}
                  className="min-w-0 flex-1 bg-transparent py-2 font-mono text-xs text-ink-800 outline-none"
                />
              </div>
              <button
                onClick={enable}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600 disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <HardDrive size={14} />}
                {t('storage.enable')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (migrationOffer) {
    const move = async () => {
      setBusy(true)
      try {
        await migrateToDisk()
        toast(t('storage.migratedToast', { count: migrationOffer.tripCount }))
      } catch (e) {
        toast(t('storage.errorToast', { error: e.message }))
      } finally {
        setBusy(false)
      }
    }
    return (
      <div className="anim-fade-up mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
        <Sparkles size={18} className="shrink-0 text-violet-500" />
        <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-700">
          {t('storage.migrateBody', { count: migrationOffer.tripCount, path: useStorage.getState().dataDir })}
        </p>
        <button
          onClick={move}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <HardDrive size={14} />}
          {t('storage.migrateGo')}
        </button>
      </div>
    )
  }

  if (status === 'off') {
    return (
      <div className="anim-fade-up mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
        <TriangleAlert size={15} className="shrink-0" />
        {t('storage.offlineBanner')}
      </div>
    )
  }

  return null
}

/* quiet footer row when everything is configured */
export function StorageSettingsRow() {
  const { t } = useTranslation()
  const { status, dataDir, syncError } = useStorage()
  const [changing, setChanging] = useState(false)
  const [path, setPath] = useState('')
  const [busy, setBusy] = useState(false)

  if (status !== 'ready' || !dataDir) return null

  const change = async () => {
    setBusy(true)
    try {
      await configureDataDir(path.trim())
      toast(t('storage.changedToast'))
      setChanging(false)
    } catch (e) {
      toast(t('storage.errorToast', { error: e.message }))
    } finally {
      setBusy(false)
    }
  }

  const clean = async () => {
    try {
      const r = await storageApi.gc()
      toast(t('storage.gcToast', { count: r.removedImages }))
    } catch (e) {
      toast(t('storage.errorToast', { error: e.message }))
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-2 text-xs text-ink-400">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <HardDrive size={12} className={syncError ? 'text-amber-500' : 'text-emerald-500'} />
          {t('storage.dataAt')} <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-600">{dataDir}</code>
        </span>
        {syncError && <span className="font-semibold text-amber-600">{t('storage.syncPending')}</span>}
        <button
          onClick={() => { setChanging((v) => !v); setPath(dataDir) }}
          className="font-semibold text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-700"
        >
          {t('storage.changeFolder')}
        </button>
        <button
          onClick={clean}
          className="inline-flex items-center gap-1 font-semibold text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-700"
        >
          <Trash2 size={11} /> {t('storage.gcButton')}
        </button>
      </div>
      {changing && (
        <div className="anim-fade-up flex w-full max-w-xl items-center gap-2">
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            spellCheck={false}
            aria-label={t('storage.pathAria')}
            className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 font-mono text-[11px] text-ink-800 outline-none focus:border-brand-400"
          />
          <button
            onClick={change}
            disabled={busy || !path.trim()}
            className="rounded-xl bg-ink-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-ink-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : t('storage.apply')}
          </button>
        </div>
      )}
      {changing && <p className="max-w-xl text-center text-[10.5px] leading-relaxed text-ink-400">{t('storage.changeHint')}</p>}
    </div>
  )
}
