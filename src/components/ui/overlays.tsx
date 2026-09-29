import { useState, type ReactNode } from 'react'
import { ContextMenu, Dialog, DropdownMenu } from 'radix-ui'
import { Icon, type IconName } from '../Icon'
import { Button, cx } from './primitives'

/* ---------- Modal ---------- */

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  /** Left side of the footer (e.g. Help center link from the upload design). */
  footerStart?: ReactNode
  width?: number
}

/** Dialog shell following the Upload files design: 22px title, close icon, tinted footer. */
export function Modal({ open, onOpenChange, title, description, children, footer, footerStart, width = 455 }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="anim-fade fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content
          className="anim-pop fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[12px] bg-surface shadow-pop focus:outline-none"
          style={{ maxWidth: width }}
        >
          <div className={cx('flex items-start justify-between gap-4 px-8 pt-8', !children && 'pb-8')}>
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-[22px] leading-[30px] font-medium tracking-[-0.66px] text-fg">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-[14px] text-fg-2">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="tap -mr-1.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-fg hover:bg-hover"
            >
              <Icon name="cancel-01" size={22} />
            </Dialog.Close>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-7 pb-8">{children}</div>}
          {(footer || footerStart) && (
            <div className="flex items-center justify-between gap-3 rounded-b-[12px] bg-surface-3 px-8 py-4">
              <div>{footerStart}</div>
              <div className="flex items-center gap-2">{footer}</div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------- Confirm dialog ---------- */

type ConfirmProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  /** When set, the user must type this text to enable the confirm button. */
  requireText?: string
  tone?: 'danger' | 'primary'
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, requireText, tone = 'danger' }: ConfirmProps) {
  const [typed, setTyped] = useState('')
  const ok = !requireText || typed.trim() === requireText
  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) setTyped('')
        onOpenChange(o)
      }}
      title={title}
      description={description}
      width={440}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            disabled={!ok}
            onClick={() => {
              onConfirm()
              setTyped('')
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {requireText && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-text" className="text-[13px] font-medium text-fg">
            Type <strong className="font-semibold">{requireText}</strong> to confirm
          </label>
          <input
            id="confirm-text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-[8px] border border-line-control bg-surface px-3 text-[14px] text-fg focus:border-accent"
          />
        </div>
      )}
    </Modal>
  )
}

/* ---------- Menus ---------- */

export type MenuItem =
  | { type?: 'item'; label: string; icon?: IconName; onSelect: () => void; danger?: boolean; disabled?: boolean; shortcut?: string }
  | { type: 'separator' }

const itemClass =
  'flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] font-medium text-fg outline-none data-[highlighted]:bg-hover data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
const contentClass = 'anim-fade z-50 min-w-48 rounded-[10px] border border-line bg-surface p-1 shadow-pop'

function renderItems(items: MenuItem[], Parts: typeof DropdownMenu | typeof ContextMenu) {
  return items.map((item, i) =>
    item.type === 'separator' ? (
      <Parts.Separator key={i} className="my-1 h-px bg-line" />
    ) : (
      <Parts.Item
        key={item.label}
        disabled={item.disabled}
        // Defer so the menu finishes closing (and returns focus) before a dialog opens;
        // otherwise the dialog sees that focus move as "outside" and closes immediately.
        onSelect={() => setTimeout(item.onSelect, 0)}
        className={cx(itemClass, item.danger && 'text-danger')}
      >
        {item.icon && <Icon name={item.icon} size={16} />}
        <span className="flex-1">{item.label}</span>
        {item.shortcut && <span className="text-[11px] text-fg-3">{item.shortcut}</span>}
      </Parts.Item>
    ),
  )
}

export function Menu({ trigger, items, align = 'end', label }: { trigger: ReactNode; items: MenuItem[]; align?: 'start' | 'end'; label?: string }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={align} sideOffset={6} className={contentClass} aria-label={label}>
          {renderItems(items, DropdownMenu)}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export function RightClickMenu({ items, children }: { items: MenuItem[]; children: ReactNode }) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={contentClass}>{renderItems(items, ContextMenu)}</ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

/* ---------- Side sheet (drawer) ---------- */

export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  title,
  children,
  width = 400,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  side?: 'left' | 'right'
  title: string
  children: ReactNode
  width?: number
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="anim-fade fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content
          className={cx(
            'fixed top-0 bottom-0 z-50 flex w-[calc(100vw-48px)] flex-col bg-surface shadow-pop focus:outline-none',
            side === 'right' ? 'anim-right right-0' : 'anim-left left-0',
          )}
          style={{ maxWidth: width }}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
