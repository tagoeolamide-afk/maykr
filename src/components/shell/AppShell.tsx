import { useEffect, useRef, type ReactNode } from 'react'
import { useRoute } from '../../lib/router'
import { useStore } from '../../lib/store'
import { useUI } from '../../lib/ui-store'
import { Sheet } from '../ui/overlays'
import { CommandPalette } from './CommandPalette'
import { ModalRoot } from './ModalRoot'
import { NotificationsPanel } from './NotificationsPanel'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const mobileNavOpen = useUI((s) => s.mobileNavOpen)
  const setMobileNavOpen = useUI((s) => s.setMobileNavOpen)
  const { path } = useRoute()
  const prevPath = useRef(path)

  // SPA focus management: after navigating, move focus to the new page's heading
  // so screen-reader and keyboard users land at the top of the new content.
  useEffect(() => {
    if (prevPath.current === path) return
    prevPath.current = path
    const t = setTimeout(() => {
      const h1 = document.querySelector<HTMLElement>('main [data-page-title]')
      h1?.focus({ preventScroll: false })
    }, 50)
    return () => clearTimeout(t)
  }, [path])

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="sr-only z-50 rounded-[8px] bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>

      <aside aria-label="Sidebar" className="hidden h-full shrink-0 lg:block">
        <Sidebar collapsed={collapsed} />
      </aside>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen} side="left" title="Navigation" width={251}>
        <Sidebar onNavigate={() => setMobileNavOpen(false)} />
      </Sheet>

      <div id="main" tabIndex={-1} className="flex min-w-0 flex-1 outline-none">
        {children}
      </div>

      <CommandPalette />
      <NotificationsPanel />
      <ModalRoot />
    </div>
  )
}

/** Scrollable main column used by every view. */
export function Main({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <main aria-label={label} className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      {children}
    </main>
  )
}
