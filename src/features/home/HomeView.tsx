import { useMemo } from 'react'
import { FolderArt } from '../../components/FolderArt'
import { Icon, type IconName } from '../../components/Icon'
import { StorageCards } from '../../components/shell/InfoPanel'
import { Main } from '../../components/shell/AppShell'
import { PageHeader } from '../../components/shell/PageHeader'
import { Button, Card, cx, ErrorState, LoadingRegion, Skeleton } from '../../components/ui/primitives'
import { formatSize, greeting, plural, timeAgo } from '../../lib/format'
import { useDocumentTitle, useViewState } from '../../lib/hooks'
import { Link, navigate } from '../../lib/router'
import { useStore } from '../../lib/store'
import { openModal, useUI } from '../../lib/ui-store'

function QuickAction({ icon, label, description, onClick }: { icon: IconName; label: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-line-card bg-surface p-4 text-left transition-shadow hover:shadow-card"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-2">
        <Icon name={icon} size={20} />
      </span>
      <span className="flex flex-col">
        <span className="text-[14px] font-semibold">{label}</span>
        <span className="text-[12px] text-fg-2">{description}</span>
      </span>
    </button>
  )
}

export function HomeView() {
  useDocumentTitle('Home')
  const user = useStore((s) => s.user)
  const projects = useStore((s) => s.projects)
  const folders = useStore((s) => s.folders)
  const notes = useStore((s) => s.notes)
  const files = useStore((s) => s.files)
  const members = useStore((s) => s.folders.some((f) => f.members.length > 1))
  const notifications = useStore((s) => s.notifications)
  const onboardingDismissed = useStore((s) => s.onboardingDismissed)
  const dismissOnboarding = useStore((s) => s.dismissOnboarding)
  const createNote = useStore((s) => s.createNote)
  const setNotificationsOpen = useUI((s) => s.setNotificationsOpen)
  const isEmpty = folders.length === 0 && notes.length === 0
  const [state, retry] = useViewState('home', isEmpty)

  const recentFolders = useMemo(() => [...folders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4), [folders])
  const recentNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5), [notes])
  const firstName = user?.name.split(' ')[0] ?? ''

  const checklist = [
    { done: folders.length > 0, label: 'Create a folder', action: () => openModal({ type: 'newFolder' }) },
    { done: notes.length > 0, label: 'Write your first note', action: () => navigate(`/notes/${createNote(null).id}`) },
    { done: files.length > 0, label: 'Upload a file', action: () => openModal({ type: 'upload' }) },
    { done: members, label: 'Invite a teammate', action: () => (folders[0] ? openModal({ type: 'share', folderId: folders[0].id }) : openModal({ type: 'newFolder' })) },
  ]
  const doneCount = checklist.filter((c) => c.done).length
  const showChecklist = !onboardingDismissed && doneCount < checklist.length

  const quick = (
    <div className="grid gap-3 sm:grid-cols-3">
      <QuickAction icon="pencil" label="New note" description="Capture an idea" onClick={() => navigate(`/notes/${createNote(null).id}`)} />
      <QuickAction icon="folder-add" label="New folder" description="Organise your work" onClick={() => openModal({ type: 'newFolder' })} />
      <QuickAction icon="upload" label="Upload files" description="Docs, images, video" onClick={() => openModal({ type: 'upload' })} />
    </div>
  )

  return (
    <Main>
      <PageHeader crumbs={[{ label: 'Home', icon: 'home-05' }]} title={`${greeting()}, ${firstName}`} />

      <div className="flex flex-col gap-8 px-4 pt-2 pb-10">
        {state === 'loading' && (
          <LoadingRegion label="Loading your workspace">
            <div className="flex flex-col gap-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-[74px] rounded-[16px]" />
                ))}
              </div>
              <Skeleton className="h-48 rounded-[20px]" />
            </div>
          </LoadingRegion>
        )}
        {state === 'error' && <ErrorState onRetry={retry} what="your workspace" />}

        {state === 'empty' && (
          <section aria-labelledby="welcome" className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <FolderArt color="blue" width={120} />
              <h2 id="welcome" className="text-[22px] font-semibold tracking-[-0.4px]">
                Welcome to Mayker
              </h2>
              <p className="max-w-md text-[14px] text-fg-2">
                Keep projects, notes and files in one calm place. Here’s how to get set up — it takes about two minutes.
              </p>
            </div>
            <Card className="p-2">
              <ol className="flex flex-col">
                {checklist.map((c, i) => (
                  <li key={c.label}>
                    <button
                      type="button"
                      onClick={c.action}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-[12px] p-3 text-left hover:bg-hover"
                    >
                      <span
                        className={cx(
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                          c.done ? 'bg-success text-white dark:text-black' : 'border border-line-control text-fg-2',
                        )}
                      >
                        {c.done ? <Icon name="check" size={14} /> : i + 1}
                      </span>
                      <span className={cx('flex-1 text-[14px] font-medium', c.done && 'text-fg-2 line-through')}>{c.label}</span>
                      <span className="sr-only">{c.done ? '(done)' : ''}</span>
                      <Icon name="chevron-right" size={16} className="text-fg-2" />
                    </button>
                  </li>
                ))}
              </ol>
            </Card>
            {projects.length === 0 && (
              <p className="text-center text-[12px] text-fg-2">Creating a folder also creates your first project.</p>
            )}
          </section>
        )}

        {state === 'ready' && (
          <>
            {quick}

            {showChecklist && (
              <section aria-labelledby="setup" className="flex flex-col gap-3 rounded-[16px] border border-line-card bg-surface p-4">
                <div className="flex items-center justify-between">
                  <h2 id="setup" className="text-[14px] font-semibold">
                    Finish setting up · {doneCount} of {checklist.length}
                  </h2>
                  <Button variant="ghost" onClick={dismissOnboarding}>
                    Dismiss
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {checklist
                    .filter((c) => !c.done)
                    .map((c) => (
                      <Button key={c.label} onClick={c.action} icon="add">
                        {c.label}
                      </Button>
                    ))}
                </div>
              </section>
            )}

            <div className="grid gap-8 2xl:grid-cols-[1fr_338px]">
              <div className="flex min-w-0 flex-col gap-8">
                <section aria-labelledby="recent-folders" className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 id="recent-folders" className="text-[18px] font-semibold">
                      Recent folders
                    </h2>
                    <Link to="/projects" className="rounded text-[13px] font-medium text-accent hover:underline">
                      All projects
                    </Link>
                  </div>
                  {recentFolders.length === 0 ? (
                    <p className="text-[14px] text-fg-2">No folders yet.</p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {recentFolders.map((f) => (
                        <li key={f.id}>
                          <Link
                            to={`/projects/${f.projectId}/folders/${f.id}`}
                            className="flex flex-col gap-2 rounded-[16px] border border-line-card bg-surface p-3 transition-shadow hover:shadow-card"
                          >
                            <FolderArt color={f.color} width={64} />
                            <span className="truncate text-[14px] font-semibold">{f.name}</span>
                            <span className="text-[12px] text-fg-2">
                              {plural(notes.filter((n) => n.folderId === f.id).length, 'note')} · {formatSize(f.sizeMb)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="recent-notes" className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 id="recent-notes" className="text-[18px] font-semibold">
                      Recently edited
                    </h2>
                    <Link to="/notes" className="rounded text-[13px] font-medium text-accent hover:underline">
                      All notes
                    </Link>
                  </div>
                  {recentNotes.length === 0 ? (
                    <p className="text-[14px] text-fg-2">No notes yet.</p>
                  ) : (
                    <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[16px] border border-line-card bg-surface">
                      {recentNotes.map((n) => (
                        <li key={n.id}>
                          <Link to={`/notes/${n.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-hover">
                            <Icon name="file-01" className="text-fg-2" />
                            <span className="flex-1 truncate text-[14px] font-medium">{n.title || 'Untitled note'}</span>
                            <span className="hidden truncate text-[12px] text-fg-2 sm:block">
                              {folders.find((f) => f.id === n.folderId)?.name ?? 'No folder'}
                            </span>
                            <span className="w-24 shrink-0 text-right text-[12px] text-fg-2">{timeAgo(n.updatedAt)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <div className="flex flex-col gap-8">
                <section aria-labelledby="storage-h" className="flex flex-col gap-3">
                  <h2 id="storage-h" className="text-[18px] font-semibold">
                    Storage
                  </h2>
                  <StorageCards />
                </section>
                <section aria-labelledby="activity-h" className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 id="activity-h" className="text-[18px] font-semibold">
                      Activity
                    </h2>
                    <Button variant="ghost" onClick={() => setNotificationsOpen(true)}>
                      View all
                    </Button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-[14px] text-fg-2">Nothing new.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {notifications.slice(0, 4).map((n) => (
                        <li key={n.id} className="flex flex-col gap-0.5 border-l-2 border-line pl-3">
                          <span className="text-[13px] font-medium">{n.title}</span>
                          <span className="text-[12px] text-fg-2">{timeAgo(n.at)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </Main>
  )
}
