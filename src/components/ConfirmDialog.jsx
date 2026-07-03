import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'
import { useUI } from '../store'
import Modal from './Modal'

export default function ConfirmDialog() {
  const { t } = useTranslation()
  const confirm = useUI((s) => s.confirm)
  const closeConfirm = useUI((s) => s.closeConfirm)
  if (!confirm) return null

  return (
    <Modal onClose={closeConfirm}>
      <div className="p-6">
        <div className="flex items-start gap-3.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
            <TriangleAlert size={19} />
          </div>
          <p className="pt-1.5 text-sm leading-relaxed text-ink-700">{confirm.message}</p>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={closeConfirm}
            className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => { confirm.onYes(); closeConfirm() }}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-600/25 transition hover:bg-rose-700"
          >
            {t('confirm.confirm')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
