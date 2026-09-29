import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { InfoEmptyHint, InfoPanel, Properties, StorageCards, useInfoPanel } from '../../components/shell/InfoPanel'
import { Main } from '../../components/shell/AppShell'
import { HeaderAction, PageHeader } from '../../components/shell/PageHeader'
import { Menu } from '../../components/ui/overlays'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingRegion,
  SearchInput,
  Skeleton,
  TabPanel,
  Tabs,
} from '../../components/ui/primitives'
import { formatDate, formatShortDate, formatSize, plural, timeAgo } from '../../lib/format'
import { useDocumentTitle, useViewState } from '../../lib/hooks'
import { Link, navigate, useRoute } from '../../lib/router'
import { useStore } from '../../lib/store'
import type { Folder, FolderColor, ID } from '../../lib/types'
import { openModal, withUndo } from '../../lib/ui-store'
import { CARD_H, CARD_W, FolderCard, FolderCardHelp, folderMenu, gridKeyNav } from './FolderCard'
import { FileDropArea, FilterMenu, ResultsStatus, type SortKey } from './shared'
import { FileKindIcon } from './UploadModal'
import { NotFound } from '../NotFound'

function FolderGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <LoadingRegion label="Loading folders">
      <div className="grid grid-cols-[repeat(auto-fill,230.94px)] gap-5">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="rounded-[22px]" style={{ width: CARD_W, height: CARD_H }} />
        ))}
      </div>
    </LoadingRegion>
  )
}

/* ============ All projects ============ */

export function ProjectsIndex() {
  useDocumentTitle('Projects')
  const projects = useStore((s) => s.projects)
  const folders = useStore((s) => s.folders)
  const notes = useStore((s) => s.notes)
  const [query, setQuery] = useState('')
  const [state, retry] = useViewState('projects', projects.length === 0)

  const list = projects.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Main>
      <PageHeader
        crumbs={[{ label: 'Projects', icon: 'folder-02' }]}
        backTo="/home"
        title="Projects"
        titleAction={
          <Button variant="primary" icon="add" onClick={() => openModal({ type: 'newProject' })}>
            New project
          </Button>
        }
        toolbar={state === 'ready' && <SearchInput value={query} onChange={setQuery} label="Search projects" className="w-full sm:w-[220px]" />}
      />
      <section className="px-4 pt-4 pb-10">
        {state === 'loading' && (
          <LoadingRegion label="Loading projects">
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-[20px]" />
              ))}
            </div>
          </LoadingRegion>
        )}
        {state === 'error' && <ErrorState onRetry={retry} what="your projects" />}
        {state === 'empty' && (
          <EmptyState
            icon="folder-02"
            title="Start your first project"
            description="Projects hold folders of notes and files. Create one for each client, team or big idea."
            action={
              <Button variant="primary" size="md" icon="add" onClick={() => openModal({ type: 'newProject' })}>
                New project
              </Button>
            }
          />
        )}
        {state === 'ready' && (
          <>
            <ResultsStatus count={list.length} noun="project" query={query} />
            {list.length === 0 ? (
              <EmptyState compact icon="search-02" title="No matching projects" description={`Nothing matches “${query}”.`} action={<Button onClick={() => setQuery('')}>Clear search</Button>} />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {list.map((p) => {
                  const pf = folders.filter((f) => f.projectId === p.id)
                  const ids = new Set(pf.map((f) => f.id))
                  const noteCount = notes.filter((n) => n.folderId && ids.has(n.folderId)).length
                  const size = pf.reduce((s, f) => s + f.sizeMb, 0)
                  return (
                    <li key={p.id} className="group relative flex flex-col gap-4 rounded-[20px] border border-line-card bg-surface p-5 transition-shadow hover:shadow-card">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-10 items-center justify-center rounded-[10px] bg-surface-2">
                          <Icon name="folder-02" size={20} />
                        </span>
                        <div className="relative z-10">
                          <Menu
                            label={`${p.name} options`}
                            trigger={<IconButton icon="more-horizontal" label={`${p.name} options`} tooltip={false} />}
                            items={[
                              { label: 'Open', icon: 'folder', onSelect: () => navigate(`/projects/${p.id}`) },
                              { label: 'New folder', icon: 'folder-add', onSelect: () => openModal({ type: 'newFolder', projectId: p.id }) },
                              { label: 'Manage project', icon: 'settings-01', onSelect: () => openModal({ type: 'manageProject', projectId: p.id }) },
                              { type: 'separator' },
                              { label: 'Delete project', icon: 'delete', danger: true, onSelect: () => openModal({ type: 'deleteProject', projectId: p.id }) },
                            ]}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h2 className="text-[16px] font-semibold">
                          <Link to={`/projects/${p.id}`} className="rounded after:absolute after:inset-0 after:rounded-[20px] hover:underline">
                            {p.name}
                          </Link>
                        </h2>
                        <p className="line-clamp-2 text-[13px] text-fg-2">{p.description || 'No description'}</p>
                      </div>
                      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-fg-2">
                        <span>{plural(pf.length, 'folder')}</span>
                        <span>{plural(noteCount, 'note')}</span>
                        <span>{formatSize(size)}</span>
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </Main>
  )
}

/* ============ Project (Desktop - 3) ============ */

export function ProjectView({ projectId }: { projectId: ID }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const allFolders = useStore((s) => s.folders)
  const notes = useStore((s) => s.notes)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('default')
  const [color, setColor] = useState<'all' | FolderColor>('all')
  const [selectedId, setSelectedId] = useState<ID | null>(null)
  const info = useInfoPanel()
  useDocumentTitle(project?.name ?? 'Project')

  const folders = useMemo(() => allFolders.filter((f) => f.projectId === projectId), [allFolders, projectId])
  const noteCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of notes) if (n.folderId) m.set(n.folderId, (m.get(n.folderId) ?? 0) + 1)
    return m
  }, [notes])
  const [state, retry] = useViewState(`project-${projectId}`, folders.length === 0)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = folders.filter((f) => f.name.toLowerCase().includes(q) && (color === 'all' || f.color === color))
    const sorters: Partial<Record<SortKey, (a: Folder, b: Folder) => number>> = {
      name: (a, b) => a.name.localeCompare(b.name),
      size: (a, b) => b.sizeMb - a.sizeMb,
      notes: (a, b) => (noteCount.get(b.id) ?? 0) - (noteCount.get(a.id) ?? 0),
      recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
    }
    return sorters[sort] ? [...list].sort(sorters[sort]) : list
  }, [folders, query, sort, color, noteCount])

  if (!project) return <NotFound what="project" />

  const selected = folders.find((f) => f.id === selectedId)
  const totalSize = folders.reduce((s, f) => s + f.sizeMb, 0)

  return (
    <>
      <Main>
        <PageHeader
          crumbs={[
            { label: 'Projects', to: '/projects', icon: 'folder-02' },
            { label: project.name, icon: 'folder-add' },
          ]}
          backTo="/projects"
          onShowInfo={info.canShow ? info.show : undefined}
          actions={
            <>
              <HeaderAction icon="settings-01" label="Manage" onClick={() => openModal({ type: 'manageProject', projectId })} />
              <HeaderAction
                icon="share-08"
                label="Share"
                onClick={() => (selected ? openModal({ type: 'share', folderId: selected.id }) : folders[0] && openModal({ type: 'share', folderId: folders[0].id }))}
              />
              <Menu
                label="More project actions"
                trigger={<IconButton icon="ellipsis" label="More actions" tooltip={false} />}
                items={[
                  { label: 'Upload files', icon: 'upload', onSelect: () => openModal({ type: 'upload', folderId: selected?.id }) },
                  { label: 'New folder', icon: 'folder-add', onSelect: () => openModal({ type: 'newFolder', projectId }) },
                  { type: 'separator' },
                  { label: 'Delete project', icon: 'delete', danger: true, onSelect: () => openModal({ type: 'deleteProject', projectId }) },
                ]}
              />
            </>
          }
          title={project.name}
          titleAction={
            <Button variant="primary" onClick={() => openModal({ type: 'newFolder', projectId })}>
              New Draft
            </Button>
          }
          toolbar={
            state === 'ready' && (
              <>
                <SearchInput value={query} onChange={setQuery} label="Search folders" className="w-full sm:w-[180px]" />
                <FilterMenu
                  sort={sort}
                  onSort={setSort}
                  sortOptions={[
                    { value: 'default', label: 'Default' },
                    { value: 'name', label: 'Name (A–Z)' },
                    { value: 'recent', label: 'Newest first' },
                    { value: 'size', label: 'Largest first' },
                    { value: 'notes', label: 'Most notes' },
                  ]}
                  filter={color}
                  onFilter={setColor}
                  filterLabel="Colour"
                  filterOptions={[
                    { value: 'all', label: 'All folders' },
                    { value: 'blue', label: 'Blue' },
                    { value: 'grey', label: 'Grey' },
                  ]}
                />
              </>
            )
          }
        />

        <FileDropArea folderId={selected?.id} className="flex-1">
          <section aria-label="Folders" className="px-4 pt-[23px] pb-10">
            {state === 'loading' && <FolderGridSkeleton />}
            {state === 'error' && <ErrorState onRetry={retry} what="these folders" />}
            {state === 'empty' && (
              <EmptyState
                icon="folder-add"
                title="No folders yet"
                description="Folders keep related notes and files together. Create one, or drop files here to upload them."
                action={
                  <Button variant="primary" size="md" icon="add" onClick={() => openModal({ type: 'newFolder', projectId })}>
                    New folder
                  </Button>
                }
                secondary={
                  <Button size="md" icon="upload" onClick={() => openModal({ type: 'upload' })}>
                    Upload files
                  </Button>
                }
              />
            )}
            {state === 'ready' && (
              <>
                <ResultsStatus count={visible.length} noun="folder" query={query} />
                <FolderCardHelp />
                {visible.length === 0 ? (
                  <EmptyState
                    compact
                    icon="search-02"
                    title="No matching folders"
                    description={query ? `Nothing matches “${query}”.` : 'No folders match this filter.'}
                    action={<Button onClick={() => (setQuery(''), setColor('all'))}>Clear filters</Button>}
                  />
                ) : (
                  <div role="group" aria-label="Folder grid" onKeyDown={gridKeyNav} className="grid grid-cols-[repeat(auto-fill,230.94px)] justify-center gap-5 sm:justify-start">
                    {visible.map((f) => (
                      <FolderCard
                        key={f.id}
                        folder={f}
                        notes={noteCount.get(f.id) ?? 0}
                        selected={f.id === selectedId}
                        onSelect={() => setSelectedId((cur) => (cur === f.id ? null : f.id))}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </FileDropArea>
      </Main>

      <InfoPanel info={info}>
        <StorageCards />
        {selected ? (
          <>
            <Properties
              title={selected.name}
              rows={[
                { label: 'Size', value: formatSize(selected.sizeMb) },
                { label: 'Notes', value: noteCount.get(selected.id) ?? 0 },
                { label: 'Created', value: formatShortDate(selected.createdAt) },
                { label: 'Shared with', value: plural(selected.members.length, 'person', 'people') },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button icon="folder" onClick={() => navigate(`/projects/${projectId}/folders/${selected.id}`)}>
                Open
              </Button>
              <Button icon="share-08" onClick={() => openModal({ type: 'share', folderId: selected.id })}>
                Share
              </Button>
            </div>
          </>
        ) : (
          <>
            <Properties
              rows={[
                { label: 'Size', value: formatSize(totalSize) },
                { label: 'Folders', value: folders.length },
                { label: 'Created', value: formatShortDate(project.createdAt) },
              ]}
            />
            {folders.length > 0 && <InfoEmptyHint text="Select a folder to see its details." />}
          </>
        )}
      </InfoPanel>
    </>
  )
}

/* ============ Folder ============ */

export function FolderView({ projectId, folderId }: { projectId: ID; folderId: ID }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const folder = useStore((s) => s.folders.find((f) => f.id === folderId))
  const allNotes = useStore((s) => s.notes)
  const allFiles = useStore((s) => s.files)
  const createNote = useStore((s) => s.createNote)
  const deleteFile = useStore((s) => s.deleteFile)
  const { query: params } = useRoute()
  const [tab, setTab] = useState(params.get('tab') === 'files' ? 'files' : 'notes')
  const [query, setQuery] = useState('')
  const info = useInfoPanel()
  useDocumentTitle(folder?.name ?? 'Folder')

  const notes = useMemo(
    () =>
      allNotes
        .filter((n) => n.folderId === folderId)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)),
    [allNotes, folderId],
  )
  const files = useMemo(() => allFiles.filter((f) => f.folderId === folderId), [allFiles, folderId])
  const [state, retry] = useViewState(`folder-${folderId}`, false)

  if (!folder || !project) return <NotFound what="folder" />

  const q = query.trim().toLowerCase()
  const shownNotes = notes.filter((n) => (n.title || 'Untitled').toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
  const shownFiles = files.filter((f) => f.name.toLowerCase().includes(q))

  const newNote = () => {
    const n = createNote(folderId)
    navigate(`/notes/${n.id}`)
  }

  return (
    <>
      <Main>
        <PageHeader
          crumbs={[
            { label: 'Projects', to: '/projects', icon: 'folder-02' },
            { label: project.name, to: `/projects/${projectId}` },
            { label: folder.name, icon: 'folder' },
          ]}
          backTo={`/projects/${projectId}`}
          onShowInfo={info.canShow ? info.show : undefined}
          actions={
            <>
              <HeaderAction icon="upload" label="Upload" onClick={() => openModal({ type: 'upload', folderId })} />
              <HeaderAction icon="share-08" label="Share" onClick={() => openModal({ type: 'share', folderId })} />
              <Menu label="Folder actions" trigger={<IconButton icon="ellipsis" label="More actions" tooltip={false} />} items={folderMenu(folder).slice(1)} />
            </>
          }
          title={folder.name}
          titleAction={
            <Button variant="primary" icon="add" onClick={newNote}>
              New note
            </Button>
          }
        />

        <FileDropArea folderId={folderId} className="flex-1">
          <div className="px-4 pt-2 pb-10">
            {state === 'loading' && (
              <LoadingRegion label="Loading folder">
                <div className="flex flex-col gap-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              </LoadingRegion>
            )}
            {state === 'error' && <ErrorState onRetry={retry} what="this folder" />}
            {(state === 'ready' || state === 'empty') && (
              <Tabs
                value={tab}
                onValueChange={(v) => (setTab(v), setQuery(''))}
                label="Folder contents"
                tabs={[
                  { value: 'notes', label: 'Notes', count: notes.length },
                  { value: 'files', label: 'Files', count: files.length },
                ]}
              >
                {(tab === 'notes' ? notes.length : files.length) > 0 && state !== 'empty' && (
                  <div className="flex items-center justify-between gap-2 py-3">
                    <SearchInput value={query} onChange={setQuery} label={`Search ${tab}`} className="w-full sm:w-[220px]" />
                    {tab === 'files' && (
                      <Button icon="upload" onClick={() => openModal({ type: 'upload', folderId })}>
                        Upload
                      </Button>
                    )}
                  </div>
                )}

                <TabPanel value="notes" className="rounded-[12px]">
                  {notes.length === 0 || state === 'empty' ? (
                    <EmptyState
                      icon="file-01"
                      title="No notes in this folder"
                      description="Capture ideas, meeting notes and research here."
                      action={
                        <Button variant="primary" size="md" icon="add" onClick={newNote}>
                          New note
                        </Button>
                      }
                    />
                  ) : shownNotes.length === 0 ? (
                    <EmptyState compact icon="search-02" title="No matching notes" description={`Nothing matches “${query}”.`} />
                  ) : (
                    <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[12px] border border-line-card bg-surface">
                      {shownNotes.map((n) => (
                        <li key={n.id}>
                          <Link to={`/notes/${n.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-hover">
                            <Icon name={n.pinned ? 'pin' : 'file-01'} className="mt-0.5 text-fg-2" />
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate text-[14px] font-medium">{n.title || 'Untitled note'}</span>
                              <span className="truncate text-[13px] text-fg-2">{n.body.split('\n')[0] || 'No content'}</span>
                            </span>
                            <span className="hidden shrink-0 items-center gap-2 sm:flex">
                              {n.tags.map((t) => (
                                <Badge key={t}>{t}</Badge>
                              ))}
                              <span className="w-24 text-right text-[12px] text-fg-2">{timeAgo(n.updatedAt)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabPanel>

                <TabPanel value="files" className="rounded-[12px]">
                  {files.length === 0 || state === 'empty' ? (
                    <EmptyState
                      icon="upload"
                      title="No files yet"
                      description="Upload documents, spreadsheets, images or video — or drag them onto this page."
                      action={
                        <Button variant="primary" size="md" icon="upload" onClick={() => openModal({ type: 'upload', folderId })}>
                          Upload files
                        </Button>
                      }
                    />
                  ) : shownFiles.length === 0 ? (
                    <EmptyState compact icon="search-02" title="No matching files" description={`Nothing matches “${query}”.`} />
                  ) : (
                    <div className="overflow-x-auto rounded-[12px] border border-line-card bg-surface">
                      <table className="w-full text-left text-[13px]">
                        <caption className="sr-only">Files in {folder.name}</caption>
                        <thead className="border-b border-line text-[12px] text-fg-2">
                          <tr>
                            <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                            <th scope="col" className="px-4 py-2.5 font-medium">Size</th>
                            <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Uploaded</th>
                            <th scope="col" className="w-12 px-4 py-2.5"><span className="sr-only">Actions</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {shownFiles.map((f) => (
                            <tr key={f.id} className="hover:bg-hover">
                              <td className="px-4 py-2.5">
                                <span className="flex items-center gap-3">
                                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface">
                                    <FileKindIcon kind={f.kind} />
                                  </span>
                                  <span className="truncate font-medium">{f.name}</span>
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-fg-2">{formatSize(f.sizeMb)}</td>
                              <td className="hidden px-4 py-2.5 text-fg-2 sm:table-cell">{formatDate(f.uploadedAt)}</td>
                              <td className="px-2 py-1.5">
                                <Menu
                                  label={`${f.name} options`}
                                  trigger={<IconButton icon="more-horizontal" label={`${f.name} options`} tooltip={false} />}
                                  items={[
                                    { label: 'Delete file', icon: 'delete', danger: true, onSelect: () => withUndo(`“${f.name}” deleted`, () => deleteFile(f.id)) },
                                  ]}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabPanel>
              </Tabs>
            )}
          </div>
        </FileDropArea>
      </Main>

      <InfoPanel info={info}>
        <Properties
          rows={[
            { label: 'Size', value: formatSize(folder.sizeMb) },
            { label: 'Notes', value: notes.length },
            { label: 'Files', value: files.length },
            { label: 'Created', value: formatShortDate(folder.createdAt) },
          ]}
        />
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] leading-[26px] font-bold">People</h3>
            <Button variant="ghost" icon="user-add" onClick={() => openModal({ type: 'share', folderId })}>
              Invite
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {folder.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <Avatar name={m.name} size={30} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] font-medium">{m.name}</span>
                  <span className="text-[12px] text-fg-2 capitalize">{m.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <StorageCards />
      </InfoPanel>
    </>
  )
}
