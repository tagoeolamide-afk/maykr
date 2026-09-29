import { Fragment, type ReactNode } from 'react'
import divider from '../../assets/icons/divider.svg'
import { Link } from '../../lib/router'
import { useUI } from '../../lib/ui-store'
import { Icon, type IconName } from '../Icon'
import { cx, IconButton } from '../ui/primitives'

export type Crumb = { label: string; to?: string; icon?: IconName }

type PageHeaderProps = {
  crumbs: Crumb[]
  /** Where the back arrow goes. Falls back to history.back(). */
  backTo?: string
  actions?: ReactNode
  title: string
  titleAction?: ReactNode
  toolbar?: ReactNode
  /** Shows an Info button when the info panel is hidden (narrow screens or collapsed). */
  onShowInfo?: () => void
}

/** Top bar + title row + toolbar row from the Desktop - 3 design. */
export function PageHeader({ crumbs, backTo, actions, title, titleAction, toolbar, onShowInfo }: PageHeaderProps) {
  const setMobileNavOpen = useUI((s) => s.setMobileNavOpen)
  return (
    <>
      <header className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-center gap-[18px]">
          <IconButton icon="menu" label="Open navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)} />
          {backTo ? (
            <Link to={backTo} aria-label="Back" className="tap flex size-8 items-center justify-center rounded-[8px] hover:bg-hover">
              <Icon name="arrow-left-02" size={24} />
            </Link>
          ) : (
            <IconButton icon="arrow-left-02" iconSize={24} label="Back" onClick={() => window.history.back()} />
          )}
          <span className="hidden h-3 w-0 items-center justify-center sm:flex" aria-hidden>
            <img src={divider} alt="" width={12} height={1} className="block max-w-none rotate-90 dark:invert" />
          </span>
          <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
            <ol className="flex min-w-0 items-center gap-3">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1
                const content = (
                  <>
                    {c.icon && <Icon name={c.icon} />}
                    <span className="truncate">{c.label}</span>
                  </>
                )
                return (
                  <Fragment key={i}>
                    <li className="flex min-w-0 items-center">
                      {c.to && !last ? (
                        <Link
                          to={c.to}
                          className="flex min-w-0 items-center gap-2 rounded-[6px] text-[12px] leading-[16px] font-medium text-fg-2 hover:text-fg hover:underline"
                        >
                          {content}
                        </Link>
                      ) : (
                        <span
                          aria-current={last ? 'page' : undefined}
                          className={cx('flex min-w-0 items-center gap-2 text-[12px] leading-[16px] font-medium', last ? 'text-fg' : 'text-fg-2')}
                        >
                          {content}
                        </span>
                      )}
                    </li>
                    {!last && (
                      <li aria-hidden className="flex text-fg-2">
                        <Icon name="chevron-left" className="-scale-x-100" />
                      </li>
                    )}
                  </Fragment>
                )
              })}
            </ol>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {onShowInfo && <IconButton icon="info" label="Show details" onClick={onShowInfo} />}
        </div>
      </header>

      <div className="flex min-h-[46px] items-center justify-between gap-3 px-4 py-2">
        <h1 tabIndex={-1} className="truncate text-[20px] leading-[26px] font-medium tracking-[-0.4px] outline-none" data-page-title>
          {title}
        </h1>
        {titleAction}
      </div>

      {toolbar && <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">{toolbar}</div>}
    </>
  )
}

/** "Manage" / "Share" style header actions: icon + label, de-emphasised until hovered. */
export function HeaderAction({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap flex h-8 cursor-pointer items-center gap-2 rounded-[6px] px-2 text-[12px] font-medium text-fg-2 transition-colors hover:bg-hover hover:text-fg"
    >
      <Icon name={icon} />
      <span className="hidden md:inline">{label}</span>
      <span className="sr-only md:hidden">{label}</span>
    </button>
  )
}
