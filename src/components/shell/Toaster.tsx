import { useEffect, useRef, useState } from 'react'
import { useToasts, type Toast } from '../../lib/ui-store'
import { Icon } from '../Icon'
import { cx } from '../ui/primitives'

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useToasts((s) => s.dismiss)
  const [paused, setPaused] = useState(false)
  const remaining = useRef(6000)
  const started = useRef(Date.now())

  useEffect(() => {
    if (paused) return
    started.current = Date.now()
    const timer = setTimeout(() => dismiss(t.id), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current -= Date.now() - started.current
    }
  }, [paused, dismiss, t.id])

  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="anim-toast pointer-events-auto flex min-h-12 w-[min(420px,calc(100vw-32px))] items-center gap-3 rounded-[10px] bg-primary py-2 pr-2 pl-4 text-[14px] text-on-primary shadow-pop"
    >
      {t.tone === 'success' && <Icon name="check-circle" size={18} />}
      {t.tone === 'error' && <Icon name="alert" size={18} />}
      <span className="flex-1">{t.message}</span>
      {t.action && (
        <button
          type="button"
          onClick={() => {
            t.action!.onClick()
            dismiss(t.id)
          }}
          className="tap cursor-pointer rounded-[6px] px-2 py-1 text-[14px] font-semibold underline underline-offset-2 hover:bg-white/10 dark:hover:bg-black/10"
        >
          {t.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(t.id)}
        className={cx('tap flex size-8 cursor-pointer items-center justify-center rounded-[6px] hover:bg-white/10 dark:hover:bg-black/10')}
      >
        <Icon name="cancel-01" size={16} />
      </button>
    </li>
  )
}

/** Toasts pause while hovered or focused (WCAG 2.2.1) and are announced politely. */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  return (
    <section aria-label="Status messages" className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2">
      <div role="status" aria-live="polite">
        <ol className="flex flex-col items-center gap-2">
          {toasts.map((t) => (
            <ToastItem key={t.id} t={t} />
          ))}
        </ol>
      </div>
    </section>
  )
}
