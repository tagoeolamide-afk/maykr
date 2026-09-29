import { useEffect, useState, useSyncExternalStore } from 'react'
import { navigate, useRoute } from './router'
import { useStore } from './store'

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function useSystemDark() {
  return useSyncExternalStore(
    (cb) => {
      darkQuery.addEventListener('change', cb)
      return () => darkQuery.removeEventListener('change', cb)
    },
    () => darkQuery.matches,
  )
}

/** Resolves the theme preference and applies it to <html data-theme>. */
export function useApplyTheme() {
  const pref = useStore((s) => s.theme)
  const systemDark = useSystemDark()
  const resolved = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref
  useEffect(() => {
    document.documentElement.dataset.theme = resolved
  }, [resolved])
  return resolved
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Mayker` : 'Mayker'
  }, [title])
}

export type ViewState = 'loading' | 'error' | 'empty' | 'ready'

const visited = new Set<string>()

/**
 * Simulates fetching a view's data: a short skeleton on the first visit per
 * session, then empty/ready depending on the data. `?state=loading|error|empty`
 * in the URL forces a state so every screen can be reviewed without editing data.
 */
export function useViewState(key: string, isEmpty: boolean): [ViewState, () => void] {
  const { path, query } = useRoute()
  const forced = query.get('state') as ViewState | null
  const [loading, setLoading] = useState(!visited.has(key))
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    if (visited.has(key)) return
    const t = setTimeout(() => {
      visited.add(key)
      setLoading(false)
    }, 450)
    return () => clearTimeout(t)
  }, [key, retries])

  const retry = () => {
    if (forced) navigate(path, { replace: true })
    visited.delete(key)
    setLoading(true)
    setRetries((r) => r + 1)
  }

  if (forced && ['loading', 'error', 'empty', 'ready'].includes(forced)) return [forced, retry]
  if (loading) return ['loading', retry]
  return [isEmpty ? 'empty' : 'ready', retry]
}

const mqlCache = new Map<string, { mql: MediaQueryList; subscribe: (cb: () => void) => () => void }>()

export function useMediaQuery(q: string) {
  let entry = mqlCache.get(q)
  if (!entry) {
    const mql = window.matchMedia(q)
    entry = {
      mql,
      subscribe: (cb) => {
        mql.addEventListener('change', cb)
        return () => mql.removeEventListener('change', cb)
      },
    }
    mqlCache.set(q, entry)
  }
  const { mql, subscribe } = entry
  return useSyncExternalStore(subscribe, () => mql.matches)
}
