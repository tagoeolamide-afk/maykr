import { useEffect, useRef, useState, type ReactNode } from 'react'
import avatar from '../../assets/avatar.png'
import logo from '../../assets/logo.svg'
import { Link, navigate, useRoute } from '../../lib/router'
import { useStore } from '../../lib/store'
import { useUI } from '../../lib/ui-store'
import { Icon, type IconName } from '../Icon'
import { Menu } from '../ui/overlays'
import { cx, IconButton, Kbd, Tooltip } from '../ui/primitives'

const primaryNav: { id: string; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home-05' },
  { id: 'projects', label: 'Projects', icon: 'folder-02' },
  { id: 'notes', label: 'Notes', icon: 'file-01' },
  { id: 'reports', label: 'Reports', icon: 'analytics-01' },
  { id: 'emails', label: 'Emails', icon: 'mails' },
  { id: 'automation', label: 'Automation', icon: 'workflow' },
]

const isMac = /Mac|iPhone|iPad/.test(navigator.platform)

/** Projects listed under "Projects" before a "Show all" link takes over. */
const MAX_PROJECTS = 5

/** First few projects, always including the one that's open. */
function visibleProjects<T extends { id: string }>(projects: T[], activeId?: string) {
  const first = projects.slice(0, MAX_PROJECTS)
  const active = projects.find((p) => p.id === activeId)
  if (!active || first.includes(active)) return first
  return [...first.slice(0, MAX_PROJECTS - 1), active]
}

/**
 * Scroll area for the main nav. Shows a soft fade at whichever edge has more
 * items hidden, so it's clear the list continues (short screens, touch rows).
 */
function ScrollFade({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ top: false, bottom: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setEdges({ top: el.scrollTop > 1, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="relative flex min-h-0 flex-col">
      <div ref={ref} className="min-h-0 overflow-y-auto overscroll-contain">
        {children}
      </div>
      <div
        aria-hidden
        className={cx(
          'pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-surface to-transparent transition-opacity',
          edges.top ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden
        className={cx(
          'pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent transition-opacity',
          edges.bottom ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}

/** Row style from the design: 16px medium label, 18px icon, inactive rows de-emphasised. */
function rowClass(active: boolean, collapsed: boolean) {
  return cx(
    'tap flex w-full cursor-pointer items-center gap-2 rounded-[8px] py-1 text-[16px] leading-[21px] font-medium transition-colors',
    collapsed ? 'justify-center px-0 py-2' : 'pl-[10px] pr-4',
    // Design: inactive rows at 30% opacity (fails contrast). We use the secondary text token instead.
    active ? 'text-fg' : 'text-fg-2 hover:bg-hover hover:text-fg',
  )
}

export function Sidebar({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { segments } = useRoute()
  const section = segments[0] ?? 'home'
  const projects = useStore((s) => s.projects)
  const user = useStore((s) => s.user)
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length)
  const unreadMail = useStore((s) => s.emails.filter((e) => e.box === 'inbox' && !e.read).length)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const setPaletteOpen = useUI((s) => s.setPaletteOpen)
  const setNotificationsOpen = useUI((s) => s.setNotificationsOpen)
  const activeProjectId = section === 'projects' ? segments[1] : undefined

  const go = () => onNavigate?.()

  const label = (text: string) => (collapsed ? <span className="sr-only">{text}</span> : text)
  const withTip = (text: string, node: React.ReactElement) =>
    collapsed ? (
      <Tooltip label={text} side="right">
        {node}
      </Tooltip>
    ) : (
      node
    )

  return (
    <div className={cx('flex h-full flex-col gap-4 bg-surface p-4', collapsed ? 'w-[76px]' : 'w-[251px]')}>
      <div className={cx('flex items-center', collapsed ? 'flex-col gap-3' : 'justify-between px-[10px]')}>
        <Link to="/home" onClick={go} className="flex items-center gap-[6px] rounded-[8px]" aria-label="Mayker home">
          <img src={logo} alt="" width={25.0006} height={26.6133} className="block shrink-0" />
          {!collapsed && <span className="text-[20px] leading-[26px] font-bold tracking-[-0.4px]">Mayker</span>}
        </Link>
        {!onNavigate && (
          <IconButton
            icon="panel-left-close"
            iconSize={24}
            label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleSidebar}
            className={collapsed ? '[&>span]:rotate-180' : ''}
          />
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4">
        <ScrollFade>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {withTip(
              'Search',
              <button
                type="button"
                onClick={() => {
                  go()
                  setPaletteOpen(true)
                }}
                className={cx(rowClass(false, collapsed), 'justify-between')}
              >
                <span className="flex items-center gap-2">
                  <Icon name="search-02" />
                  {label('Search')}
                </span>
                {!collapsed && <Kbd>{isMac ? '⌘K' : 'Ctrl K'}</Kbd>}
              </button>,
            )}
  
            <ul className="flex flex-col gap-1">
              {primaryNav.map((item) => {
                const active = section === item.id
                return (
                  <li key={item.id}>
                    {withTip(
                      item.label,
                      <Link
                        to={`/${item.id}`}
                        onClick={go}
                        aria-current={active ? 'page' : undefined}
                        className={cx(rowClass(active, collapsed), 'justify-between')}
                      >
                        <span className="flex items-center gap-2">
                          <Icon name={item.icon} />
                          {label(item.label)}
                        </span>
                        {item.id === 'emails' && unreadMail > 0 && !collapsed && (
                          <span className="text-[12px] font-semibold text-fg-2">
                            {unreadMail}
                            <span className="sr-only"> unread</span>
                          </span>
                        )}
                      </Link>,
                    )}
  
                    {item.id === 'projects' && active && !collapsed && projects.length > 0 && (
                      <ul className="mt-1 ml-[36px] flex flex-col gap-0.5" aria-label="Projects">
                        {visibleProjects(projects, activeProjectId).map((p) => {
                          const selected = p.id === activeProjectId
                          return (
                            <li key={p.id}>
                              <Link
                                to={`/projects/${p.id}`}
                                onClick={go}
                                aria-current={selected ? 'page' : undefined}
                                className={cx(
                                  'tap block truncate rounded-[8px] px-3 py-1 text-[16px] leading-[21px] font-medium',
                                  selected ? 'bg-active text-fg' : 'text-fg-2 hover:bg-hover hover:text-fg',
                                )}
                              >
                                {p.name}
                              </Link>
                            </li>
                          )
                        })}
                        {projects.length > MAX_PROJECTS && (
                          <li>
                            <Link
                              to="/projects"
                              onClick={go}
                              className="tap block rounded-[8px] px-3 py-1 text-[14px] leading-[21px] font-medium text-fg-2 hover:bg-hover hover:text-fg"
                            >
                              Show all ({projects.length})
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </ScrollFade>

        <div className="flex flex-col gap-4 border-t border-line pt-3">
          <div className="flex flex-col gap-1">
            {withTip(
              'Settings',
              <Link to="/settings" onClick={go} aria-current={section === 'settings' ? 'page' : undefined} className={rowClass(section === 'settings', collapsed)}>
                <Icon name="settings-01" />
                {label('Settings')}
              </Link>,
            )}
            {withTip(
              'Notifications',
              <button
                type="button"
                onClick={() => {
                  go()
                  setNotificationsOpen(true)
                }}
                aria-label={collapsed ? `Notifications, ${unread} unread` : undefined}
                className={cx(rowClass(true, collapsed), 'relative justify-between')}
              >
                <span className="flex items-center gap-2">
                  <Icon name="notification-01" />
                  {!collapsed && 'Notifications'}
                </span>
                {unread > 0 && (
                  <span
                    className={cx(
                      'flex min-w-5 items-center justify-center rounded-full bg-danger-solid px-1 text-[11px] leading-[16px] font-semibold text-white',
                      collapsed && 'absolute top-0 right-1',
                    )}
                    aria-hidden={collapsed || undefined}
                  >
                    {unread}
                    {!collapsed && <span className="sr-only"> unread</span>}
                  </span>
                )}
              </button>,
            )}
          </div>

          <div className={cx('flex items-center', collapsed ? 'flex-col gap-3' : 'justify-between pr-2 pl-[10px]')}>
            <Menu
              align="start"
              label="Account"
              trigger={
                <button
                  type="button"
                  className="tap flex min-w-0 cursor-pointer items-start gap-2 rounded-[8px] text-left hover:opacity-80"
                  aria-label={`Account menu for ${user?.name ?? 'you'}`}
                >
                  <img src={avatar} alt="" width={30} height={30} className="block size-[30px] shrink-0 rounded-full" />
                  {!collapsed && (
                    <span className="flex w-[123px] flex-col gap-2 font-medium">
                      <span className="truncate text-[16px] leading-[21px]">{user?.name}</span>
                      <span className="truncate text-[12px] leading-[16px] text-fg-2" title={user?.email}>
                        {user?.email}
                      </span>
                    </span>
                  )}
                </button>
              }
              items={[
                { label: 'Profile', icon: 'user', onSelect: () => (go(), navigate('/settings/profile')) },
                { label: 'Appearance', icon: 'palette', onSelect: () => (go(), navigate('/settings/appearance')) },
                { label: 'Settings', icon: 'settings-01', onSelect: () => (go(), navigate('/settings')) },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
