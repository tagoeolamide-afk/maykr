import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

/*
 * Minimal hash router. The whole dashboard is one page; the hash only records
 * which view is open so Back/Forward, refresh and deep links keep working.
 */

function read() {
  const raw = window.location.hash.replace(/^#/, '') || '/home'
  const [path, search = ''] = raw.split('?')
  return { path, search }
}

let current = read()
const listeners = new Set<() => void>()
window.addEventListener('hashchange', () => {
  current = read()
  listeners.forEach((l) => l())
})

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useRoute() {
  const snap = useSyncExternalStore(subscribe, () => current)
  const segments = snap.path.split('/').filter(Boolean)
  return { path: snap.path, segments, query: new URLSearchParams(snap.search) }
}

export function navigate(to: string, { replace = false } = {}) {
  const hash = `#${to}`
  if (replace) window.history.replaceState(null, '', hash)
  else window.history.pushState(null, '', hash)
  current = read()
  listeners.forEach((l) => l())
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={`#${to}`}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    />
  )
}
