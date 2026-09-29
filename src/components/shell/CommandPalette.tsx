import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from 'radix-ui'
import { navigate } from '../../lib/router'
import { useStore } from '../../lib/store'
import { openModal, useUI } from '../../lib/ui-store'
import { Icon, type IconName } from '../Icon'
import { cx, Kbd } from '../ui/primitives'

type Command = { id: string; group: string; label: string; hint?: string; icon: IconName; run: () => void }

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen)
  const setOpen = useUI((s) => s.setPaletteOpen)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const projects = useStore((s) => s.projects)
  const folders = useStore((s) => s.folders)
  const notes = useStore((s) => s.notes)
  const emails = useStore((s) => s.emails)
  const automations = useStore((s) => s.automations)
  const setTheme = useStore((s) => s.setTheme)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useUI.getState().paletteOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => navigate(to)
    const base: Command[] = [
      { id: 'a-note', group: 'Actions', label: 'New note', icon: 'pencil', run: () => navigate(`/notes/${useStore.getState().createNote(null).id}`) },
      { id: 'a-folder', group: 'Actions', label: 'New folder', icon: 'folder-add', run: () => openModal({ type: 'newFolder' }) },
      { id: 'a-project', group: 'Actions', label: 'New project', icon: 'add', run: () => openModal({ type: 'newProject' }) },
      { id: 'a-upload', group: 'Actions', label: 'Upload files', icon: 'upload', run: () => openModal({ type: 'upload' }) },
      { id: 'a-email', group: 'Actions', label: 'Compose email', icon: 'mails', run: () => openModal({ type: 'compose' }) },
      { id: 'a-auto', group: 'Actions', label: 'New automation', icon: 'zap', run: () => openModal({ type: 'newAutomation' }) },
      { id: 'a-dark', group: 'Actions', label: 'Switch to dark theme', icon: 'moon', run: () => setTheme('dark') },
      { id: 'a-light', group: 'Actions', label: 'Switch to light theme', icon: 'sun', run: () => setTheme('light') },
      { id: 'g-home', group: 'Go to', label: 'Home', icon: 'home-05', run: go('/home') },
      { id: 'g-projects', group: 'Go to', label: 'Projects', icon: 'folder-02', run: go('/projects') },
      { id: 'g-notes', group: 'Go to', label: 'Notes', icon: 'file-01', run: go('/notes') },
      { id: 'g-reports', group: 'Go to', label: 'Reports', icon: 'analytics-01', run: go('/reports') },
      { id: 'g-emails', group: 'Go to', label: 'Emails', icon: 'mails', run: go('/emails') },
      { id: 'g-auto', group: 'Go to', label: 'Automation', icon: 'workflow', run: go('/automation') },
      { id: 'g-settings', group: 'Go to', label: 'Settings', icon: 'settings-01', run: go('/settings') },
    ]
    const q = query.trim().toLowerCase()
    if (!q) return base
    const match = (s: string) => s.toLowerCase().includes(q)
    const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? ''
    return [
      ...base.filter((c) => match(c.label)),
      ...projects.filter((p) => match(p.name)).map((p) => ({ id: p.id, group: 'Projects', label: p.name, icon: 'folder-02' as const, run: go(`/projects/${p.id}`) })),
      ...folders
        .filter((f) => match(f.name))
        .map((f) => ({ id: f.id, group: 'Folders', label: f.name, hint: projectName(f.projectId), icon: 'folder' as const, run: go(`/projects/${f.projectId}/folders/${f.id}`) })),
      ...notes
        .filter((n) => match(n.title || 'Untitled note'))
        .slice(0, 8)
        .map((n) => ({ id: n.id, group: 'Notes', label: n.title || 'Untitled note', icon: 'file-01' as const, run: go(`/notes/${n.id}`) })),
      ...emails
        .filter((e) => match(e.subject) || match(e.from.name))
        .slice(0, 5)
        .map((e) => ({ id: e.id, group: 'Emails', label: e.subject, hint: e.from.name, icon: 'mails' as const, run: go(`/emails/${e.box}/${e.id}`) })),
      ...automations.filter((a) => match(a.name)).map((a) => ({ id: a.id, group: 'Automations', label: a.name, icon: 'workflow' as const, run: go(`/automation/${a.id}`) })),
    ]
  }, [query, projects, folders, notes, emails, automations, setTheme])

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (c: Command) => {
    setOpen(false)
    setQuery('')
    c.run()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, commands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && commands[active]) {
      e.preventDefault()
      run(commands[active])
    }
  }

  let lastGroup = ''
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQuery('')
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="anim-fade fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content className="anim-fade fixed top-[12vh] left-1/2 z-50 flex max-h-[70vh] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-[12px] bg-surface shadow-pop focus:outline-none">
          <Dialog.Title className="sr-only">Search and commands</Dialog.Title>
          <Dialog.Description className="sr-only">Type to search projects, folders, notes, emails and actions. Use arrow keys to move and Enter to select.</Dialog.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Icon name="search-02" className="text-fg-2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search or jump to…"
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-list"
              aria-activedescendant={commands[active] ? `cmd-${commands[active].id}` : undefined}
              aria-label="Search"
              className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-3"
            />
            <Kbd>Esc</Kbd>
          </div>
          <ul id="palette-list" ref={listRef} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
            {commands.length === 0 && <li className="px-3 py-8 text-center text-[14px] text-fg-2">No results for “{query}”</li>}
            {commands.map((c, i) => {
              const header = c.group !== lastGroup ? c.group : null
              lastGroup = c.group
              return (
                <li key={`${c.group}-${c.id}`} role="presentation">
                  {header && <div className="px-3 pt-3 pb-1 text-[12px] font-semibold text-fg-2" role="presentation">{header}</div>}
                  <div
                    id={`cmd-${c.id}`}
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(c)}
                    className={cx('flex h-10 cursor-pointer items-center gap-3 rounded-[8px] px-3 text-[14px]', i === active && 'bg-hover')}
                  >
                    <Icon name={c.icon} size={16} className="text-fg-2" />
                    <span className="flex-1 truncate font-medium">{c.label}</span>
                    {c.hint && <span className="truncate text-[12px] text-fg-2">{c.hint}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
