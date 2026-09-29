import { useEffect, useMemo, useState } from 'react'
import { Icon, type IconName } from '../../components/Icon'
import { Main } from '../../components/shell/AppShell'
import { PageHeader } from '../../components/shell/PageHeader'
import { Avatar, Button, cx, EmptyState, ErrorState, IconButton, LoadingRegion, SearchInput, Skeleton } from '../../components/ui/primitives'
import { formatDateTime, timeAgo } from '../../lib/format'
import { useDocumentTitle, useMediaQuery, useViewState } from '../../lib/hooks'
import { Link, navigate } from '../../lib/router'
import { useStore } from '../../lib/store'
import type { Email, ID } from '../../lib/types'
import { openModal, toast, withUndo } from '../../lib/ui-store'
import { ResultsStatus } from '../projects/shared'

type Box = 'inbox' | 'starred' | 'sent' | 'drafts' | 'archive'

const boxes: { id: Box; label: string; icon: IconName; empty: { title: string; description: string } }[] = [
  { id: 'inbox', label: 'Inbox', icon: 'inbox', empty: { title: 'Inbox zero', description: 'You’ve read everything. New emails will show up here.' } },
  { id: 'starred', label: 'Starred', icon: 'star', empty: { title: 'No starred emails', description: 'Star important emails to find them here quickly.' } },
  { id: 'sent', label: 'Sent', icon: 'sent', empty: { title: 'Nothing sent yet', description: 'Emails you send will be kept here.' } },
  { id: 'drafts', label: 'Drafts', icon: 'pencil', empty: { title: 'No drafts', description: 'Unsent emails are saved here automatically.' } },
  { id: 'archive', label: 'Archive', icon: 'archive', empty: { title: 'Archive is empty', description: 'Archived emails leave your inbox but stay searchable here.' } },
]

export function EmailsView({ box: boxParam, emailId }: { box?: string; emailId?: ID }) {
  const box = (boxes.find((b) => b.id === boxParam)?.id ?? 'inbox') as Box
  const emails = useStore((s) => s.emails)
  const markRead = useStore((s) => s.markEmailRead)
  const [query, setQuery] = useState('')
  const wide = useMediaQuery('(min-width: 64rem)')
  const [state, retry] = useViewState('emails', emails.length === 0)
  const meta = boxes.find((b) => b.id === box)!

  const inBox = (e: Email) => (box === 'starred' ? e.starred && e.box !== 'drafts' : e.box === box)
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return emails
      .filter(inBox)
      .filter((e) => !q || e.subject.toLowerCase().includes(q) || e.from.name.toLowerCase().includes(q) || e.body.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [emails, box, query])

  const active = emails.find((e) => e.id === emailId)
  useDocumentTitle(active ? active.subject : meta.label)

  useEffect(() => {
    if (active && !active.read) markRead(active.id, true)
  }, [active, markRead])

  const counts = {
    inbox: emails.filter((e) => e.box === 'inbox' && !e.read).length,
    drafts: emails.filter((e) => e.box === 'drafts').length,
  } as Partial<Record<Box, number>>

  const open = (e: Email) => {
    if (e.box === 'drafts') openModal({ type: 'compose', draftId: e.id, to: e.to, subject: e.subject, body: e.body })
    else navigate(`/emails/${box}/${e.id}`)
  }

  const showList = wide || !emailId
  const showReader = wide || !!emailId

  return (
    <Main>
      <PageHeader
        crumbs={[{ label: 'Emails', to: '/emails', icon: 'mails' }, { label: meta.label }]}
        backTo={emailId ? `/emails/${box}` : '/home'}
        title="Emails"
        titleAction={
          <Button variant="primary" icon="pencil" onClick={() => openModal({ type: 'compose' })}>
            Compose
          </Button>
        }
      />

      <nav aria-label="Mailboxes" className="px-4">
        <ul className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line">
          {boxes.map((b) => (
            <li key={b.id}>
              <Link
                to={`/emails/${b.id}`}
                aria-current={b.id === box ? 'page' : undefined}
                className={cx(
                  'tap -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium whitespace-nowrap',
                  b.id === box ? 'border-fg text-fg' : 'border-transparent text-fg-2 hover:text-fg',
                )}
              >
                <Icon name={b.icon} size={16} />
                {b.label}
                {!!counts[b.id] && (
                  <span className="rounded-full bg-surface-2 px-1.5 text-[11px] text-fg-2">
                    {counts[b.id]}
                    <span className="sr-only">{b.id === 'inbox' ? ' unread' : ''}</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {state === 'loading' && (
        <div className="p-4">
          <LoadingRegion label="Loading emails">
            <div className="flex flex-col gap-2 lg:w-[380px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[76px]" />
              ))}
            </div>
          </LoadingRegion>
        </div>
      )}
      {state === 'error' && <ErrorState onRetry={retry} what="your emails" />}
      {state === 'empty' && (
        <EmptyState
          icon="mails"
          title="No emails yet"
          description="Connect your inbox or send your first email from Mayker."
          action={
            <Button variant="primary" size="md" icon="pencil" onClick={() => openModal({ type: 'compose' })}>
              Compose email
            </Button>
          }
        />
      )}

      {state === 'ready' && (
        <div className="flex min-h-0 flex-1 gap-4 p-4">
          {showList && (
            <section aria-label={`${meta.label} messages`} className="flex w-full min-w-0 flex-col gap-2 lg:w-[380px] lg:shrink-0">
              <SearchInput value={query} onChange={setQuery} label="Search emails" />
              <ResultsStatus count={list.length} noun="email" query={query} />
              {list.length === 0 ? (
                query ? (
                  <EmptyState compact icon="search-02" title="No matching emails" description={`Nothing in ${meta.label} matches “${query}”.`} />
                ) : (
                  <EmptyState compact icon={box === 'inbox' ? 'check-circle' : meta.icon} title={meta.empty.title} description={meta.empty.description} />
                )
              ) : (
                <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[12px] border border-line-card bg-surface">
                  {list.map((e) => {
                    const current = e.id === emailId
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => open(e)}
                          aria-current={current ? 'true' : undefined}
                          className={cx('flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left', current ? 'bg-active' : 'hover:bg-hover')}
                        >
                          <span className="mt-1.5 flex w-2 shrink-0 justify-center">
                            {!e.read && (
                              <span className="size-2 rounded-full bg-accent">
                                <span className="sr-only">Unread</span>
                              </span>
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-center justify-between gap-2">
                              <span className={cx('truncate text-[14px]', e.read ? 'font-medium' : 'font-bold')}>
                                {e.box === 'sent' || e.box === 'drafts' ? `To: ${e.to}` : e.from.name}
                              </span>
                              <span className="shrink-0 text-[12px] text-fg-2">{timeAgo(e.date)}</span>
                            </span>
                            <span className={cx('truncate text-[13px]', e.read ? 'text-fg-2' : 'font-semibold text-fg')}>
                              {e.box === 'drafts' && <span className="text-danger">Draft · </span>}
                              {e.subject || '(no subject)'}
                            </span>
                            <span className="truncate text-[12px] text-fg-2">{e.body.replace(/\s+/g, ' ')}</span>
                          </span>
                          {e.starred && (
                            <>
                              <Icon name="star" size={14} filled className="mt-1 text-warning" />
                              <span className="sr-only">Starred</span>
                            </>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {showReader && (
            <section aria-label="Reading pane" className="flex min-w-0 flex-1 flex-col rounded-[12px] border border-line-card bg-surface">
              {active ? (
                <Reader email={active} box={box} />
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <EmptyState compact icon="mail-open" title="No email selected" description="Choose an email from the list to read it here." />
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </Main>
  )
}

function Reader({ email, box }: { email: Email; box: Box }) {
  const toggleStar = useStore((s) => s.toggleEmailStar)
  const markRead = useStore((s) => s.markEmailRead)
  const moveEmail = useStore((s) => s.moveEmail)
  const deleteEmail = useStore((s) => s.deleteEmail)
  const quote = `\n\n— On ${formatDateTime(email.date)}, ${email.from.name} wrote:\n> ${email.body.split('\n').join('\n> ')}`

  const leave = () => navigate(`/emails/${box}`, { replace: true })

  return (
    <article className="flex min-h-0 flex-1 flex-col" aria-labelledby="email-subject">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
        <div className="flex items-center gap-1">
          <Button icon="reply" onClick={() => openModal({ type: 'compose', to: email.from.email, subject: `Re: ${email.subject.replace(/^Re: /, '')}`, body: quote })}>
            Reply
          </Button>
          <Button icon="forward" onClick={() => openModal({ type: 'compose', subject: `Fwd: ${email.subject}`, body: quote })}>
            Forward
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <IconButton icon="star" label={email.starred ? 'Unstar' : 'Star'} aria-pressed={email.starred} onClick={() => toggleStar(email.id)} className={email.starred ? 'text-warning' : ''} />
          <IconButton
            icon="mail-open"
            label="Mark as unread"
            onClick={() => {
              markRead(email.id, false)
              leave()
              toast('Marked as unread')
            }}
          />
          {email.box === 'archive' ? (
            <IconButton icon="inbox" label="Move to inbox" onClick={() => (moveEmail(email.id, 'inbox'), leave(), toast('Moved to inbox'))} />
          ) : (
            email.box === 'inbox' && (
              <IconButton icon="archive" label="Archive" onClick={() => (leave(), withUndo('Email archived', () => moveEmail(email.id, 'archive')))} />
            )
          )}
          <IconButton icon="delete" label="Delete" onClick={() => (leave(), withUndo('Email deleted', () => deleteEmail(email.id)))} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <h2 id="email-subject" className="text-[22px] leading-[30px] font-medium tracking-[-0.4px]">
          {email.subject}
        </h2>
        <div className="flex items-center gap-3">
          <Avatar name={email.from.name} size={36} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[14px] font-semibold">
              {email.from.name} <span className="font-normal text-fg-2">&lt;{email.from.email}&gt;</span>
            </span>
            <span className="truncate text-[12px] text-fg-2">To: {email.to}</span>
          </div>
          <time dateTime={email.date} className="shrink-0 text-[12px] text-fg-2">
            {formatDateTime(email.date)}
          </time>
        </div>
        <div className="max-w-[68ch] text-[15px] leading-[1.7] whitespace-pre-wrap">{email.body}</div>
      </div>
    </article>
  )
}
