import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Main } from '../../components/shell/AppShell'
import { PageHeader } from '../../components/shell/PageHeader'
import { Menu } from '../../components/ui/overlays'
import { Badge, Button, cx, EmptyState, ErrorState, IconButton, LoadingRegion, SearchInput, Skeleton } from '../../components/ui/primitives'
import { formatDateTime, timeAgo } from '../../lib/format'
import { useDocumentTitle, useMediaQuery, useViewState } from '../../lib/hooks'
import { Link, navigate } from '../../lib/router'
import { useStore } from '../../lib/store'
import type { ID, Note } from '../../lib/types'
import { withUndo } from '../../lib/ui-store'
import { FilterMenu, ResultsStatus, type SortKey } from '../projects/shared'

export function NotesView({ noteId }: { noteId?: ID }) {
  const notes = useStore((s) => s.notes)
  const folders = useStore((s) => s.folders)
  const createNote = useStore((s) => s.createNote)
  const [query, setQuery] = useState('')
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('recent')
  const wide = useMediaQuery('(min-width: 48rem)')
  const [state, retry] = useViewState('notes', notes.length === 0)
  const active = notes.find((n) => n.id === noteId)
  useDocumentTitle(active ? active.title || 'Untitled note' : 'Notes')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = notes.filter(
      (n) =>
        (folderFilter === 'all' || (folderFilter === 'none' ? !n.folderId : n.folderId === folderFilter)) &&
        ((n.title || 'untitled').toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q))),
    )
    const by = sort === 'name' ? (a: Note, b: Note) => (a.title || '').localeCompare(b.title || '') : (a: Note, b: Note) => b.updatedAt.localeCompare(a.updatedAt)
    return [...filtered].sort((a, b) => Number(b.pinned) - Number(a.pinned) || by(a, b))
  }, [notes, query, folderFilter, sort])

  const newNote = () => navigate(`/notes/${createNote(folderFilter !== 'all' && folderFilter !== 'none' ? folderFilter : null).id}`)

  const showList = wide || !noteId
  const showEditor = wide || !!noteId

  return (
    <Main>
      <PageHeader
        crumbs={active ? [{ label: 'Notes', to: '/notes', icon: 'file-01' }, { label: active.title || 'Untitled note' }] : [{ label: 'Notes', icon: 'file-01' }]}
        backTo={noteId ? '/notes' : '/home'}
        title="Notes"
        titleAction={
          <Button variant="primary" icon="add" onClick={newNote}>
            New note
          </Button>
        }
      />

      {state === 'loading' && (
        <div className="px-4">
          <LoadingRegion label="Loading notes">
            <div className="flex gap-4">
              <div className="flex w-full flex-col gap-2 md:w-[320px]">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-[68px]" />
                ))}
              </div>
              <Skeleton className="hidden h-[420px] flex-1 md:block" />
            </div>
          </LoadingRegion>
        </div>
      )}
      {state === 'error' && <ErrorState onRetry={retry} what="your notes" />}
      {state === 'empty' && (
        <EmptyState
          icon="file-01"
          title="No notes yet"
          description="Write down ideas, meeting notes and research. Notes can live in a folder or on their own."
          action={
            <Button variant="primary" size="md" icon="add" onClick={newNote}>
              Write your first note
            </Button>
          }
        />
      )}

      {state === 'ready' && (
        <div className="flex min-h-0 flex-1 gap-4 px-4 pb-4">
          {showList && (
            <section aria-label="Note list" className="flex w-full min-w-0 flex-col gap-2 md:w-[320px] md:shrink-0">
              <div className="flex items-center gap-2">
                <SearchInput value={query} onChange={setQuery} label="Search notes" className="flex-1" />
                <FilterMenu
                  sort={sort}
                  onSort={setSort}
                  sortOptions={[
                    { value: 'recent', label: 'Last edited' },
                    { value: 'name', label: 'Title (A–Z)' },
                  ]}
                  filter={folderFilter}
                  onFilter={setFolderFilter}
                  filterLabel="Folder"
                  filterOptions={[{ value: 'all', label: 'All notes' }, { value: 'none', label: 'Not in a folder' }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
                />
              </div>
              <ResultsStatus count={list.length} noun="note" query={query} />
              {list.length === 0 ? (
                <EmptyState compact icon="search-02" title="No matching notes" description="Try a different search or folder." action={<Button onClick={() => (setQuery(''), setFolderFilter('all'))}>Clear filters</Button>} />
              ) : (
                <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto rounded-[12px] border border-line-card bg-surface p-1.5">
                  {list.map((n) => {
                    const current = n.id === noteId
                    return (
                      <li key={n.id}>
                        <Link
                          to={`/notes/${n.id}`}
                          aria-current={current ? 'true' : undefined}
                          className={cx('flex flex-col gap-1 rounded-[8px] px-3 py-2.5', current ? 'bg-active' : 'hover:bg-hover')}
                        >
                          <span className="flex items-center gap-1.5">
                            {n.pinned && (
                              <>
                                <Icon name="pin" size={14} className="text-fg-2" />
                                <span className="sr-only">Pinned: </span>
                              </>
                            )}
                            <span className="truncate text-[14px] font-medium">{n.title || 'Untitled note'}</span>
                          </span>
                          <span className="flex items-center justify-between gap-2 text-[12px] text-fg-2">
                            <span className="truncate">{folders.find((f) => f.id === n.folderId)?.name ?? 'No folder'}</span>
                            <span className="shrink-0">{timeAgo(n.updatedAt)}</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {showEditor && (
            <section aria-label="Editor" className="flex min-w-0 flex-1 flex-col rounded-[12px] border border-line-card bg-surface">
              {active ? (
                <NoteEditor key={active.id} note={active} />
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <EmptyState compact icon="pencil" title="Select a note" description="Pick a note from the list, or start a new one." action={<Button icon="add" onClick={newNote}>New note</Button>} />
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </Main>
  )
}

function NoteEditor({ note }: { note: Note }) {
  const folders = useStore((s) => s.folders)
  const updateNote = useStore((s) => s.updateNote)
  const deleteNote = useStore((s) => s.deleteNote)
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!note.title && !note.body) titleRef.current?.focus()
  }, [])

  // Debounced autosave.
  useEffect(() => {
    if (title === note.title && body === note.body) return
    setSaving('saving')
    const t = setTimeout(() => {
      updateNote(note.id, { title, body })
      setSaving('saved')
    }, 600)
    return () => clearTimeout(t)
  }, [title, body])

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !note.tags.includes(t)) updateNote(note.id, { tags: [...note.tags, t] })
    setTagInput('')
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
        <div className="flex items-center gap-2">
          <label htmlFor="note-folder" className="sr-only">
            Folder
          </label>
          <select
            id="note-folder"
            value={note.folderId ?? ''}
            onChange={(e) => updateNote(note.id, { folderId: e.target.value || null })}
            className="h-8 max-w-[200px] cursor-pointer rounded-[6px] border border-line-control bg-surface px-2 text-[12px] font-medium text-fg"
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-fg-2" role="status" aria-live="polite">
            {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : `Edited ${formatDateTime(note.updatedAt)}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon={note.pinned ? 'pin-off' : 'pin'}
            label={note.pinned ? 'Unpin note' : 'Pin note'}
            aria-pressed={note.pinned}
            onClick={() => updateNote(note.id, { pinned: !note.pinned })}
          />
          <Menu
            label="Note actions"
            trigger={<IconButton icon="more-horizontal" label="Note actions" tooltip={false} />}
            items={[
              {
                label: 'Copy text',
                icon: 'copy',
                onSelect: () => navigator.clipboard.writeText(`${title}\n\n${body}`).catch(() => {}),
              },
              { type: 'separator' },
              {
                label: 'Delete note',
                icon: 'delete',
                danger: true,
                onSelect: () => {
                  navigate('/notes', { replace: true })
                  withUndo('Note deleted', () => deleteNote(note.id))
                },
              },
            ]}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
        <label htmlFor="note-title" className="sr-only">
          Title
        </label>
        <input
          id="note-title"
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled note"
          className="w-full bg-transparent text-[24px] leading-[32px] font-semibold tracking-[-0.4px] text-fg rounded-[6px] outline-offset-4 placeholder:text-fg-3"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {note.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pr-1 pl-2 text-[12px] font-medium text-fg-2">
              {t}
              <button
                type="button"
                aria-label={`Remove tag ${t}`}
                onClick={() => updateNote(note.id, { tags: note.tags.filter((x) => x !== t) })}
                className="flex size-5 cursor-pointer items-center justify-center rounded-full hover:bg-hover hover:text-fg"
              >
                <Icon name="cancel-01" size={12} />
              </button>
            </span>
          ))}
          <label htmlFor="note-tag" className="sr-only">
            Add tag
          </label>
          <input
            id="note-tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag()
              }
            }}
            onBlur={addTag}
            placeholder="+ Add tag"
            className="h-7 w-24 rounded-full bg-transparent px-2 text-[12px] text-fg outline-none placeholder:text-fg-3 focus:bg-surface-2"
          />
        </div>
        <label htmlFor="note-body" className="sr-only">
          Note
        </label>
        <textarea
          id="note-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start writing…"
          className="min-h-[280px] w-full flex-1 resize-none bg-transparent text-[15px] leading-[1.7] text-fg rounded-[6px] outline-offset-4 placeholder:text-fg-3"
        />
      </div>
      <div className="flex items-center justify-between border-t border-line px-6 py-2 text-[12px] text-fg-2">
        <span>{words} words</span>
        {note.tags.length > 0 && (
          <span className="flex gap-1">
            {note.tags.slice(0, 3).map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
