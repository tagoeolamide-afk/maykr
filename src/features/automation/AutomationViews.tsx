import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Main } from '../../components/shell/AppShell'
import { PageHeader } from '../../components/shell/PageHeader'
import { ConfirmDialog, Menu } from '../../components/ui/overlays'
import { Badge, Button, Card, EmptyState, ErrorState, IconButton, LoadingRegion, SearchInput, Skeleton, Switch } from '../../components/ui/primitives'
import { formatDateTime, timeAgo } from '../../lib/format'
import { useDocumentTitle, useViewState } from '../../lib/hooks'
import { Link, navigate } from '../../lib/router'
import { useStore } from '../../lib/store'
import type { Automation, ID } from '../../lib/types'
import { openModal, toast, withUndo } from '../../lib/ui-store'
import { NotFound } from '../NotFound'
import { ResultsStatus } from '../projects/shared'
import { actions, describe, templates, triggers } from './catalog'

function StatusBadge({ a }: { a: Automation }) {
  const last = a.runs[0]
  if (!a.enabled) return <Badge>Paused</Badge>
  if (!last) return <Badge tone="accent">Waiting for first run</Badge>
  return last.status === 'success' ? (
    <Badge tone="success">
      <Icon name="check-circle" size={14} /> Healthy
    </Badge>
  ) : (
    <Badge tone="danger">
      <Icon name="alert" size={14} /> Last run failed
    </Badge>
  )
}

export function AutomationList() {
  useDocumentTitle('Automation')
  const automations = useStore((s) => s.automations)
  const toggle = useStore((s) => s.toggleAutomation)
  const [query, setQuery] = useState('')
  const [state, retry] = useViewState('automation', automations.length === 0)
  const list = automations.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Main>
      <PageHeader
        crumbs={[{ label: 'Automation', icon: 'workflow' }]}
        backTo="/home"
        title="Automation"
        titleAction={
          <Button variant="primary" icon="add" onClick={() => openModal({ type: 'newAutomation' })}>
            New automation
          </Button>
        }
        toolbar={state === 'ready' && <SearchInput value={query} onChange={setQuery} label="Search automations" className="w-full sm:w-[220px]" />}
      />
      <div className="px-4 pt-2 pb-10">
        {state === 'loading' && (
          <LoadingRegion label="Loading automations">
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[88px] rounded-[16px]" />
              ))}
            </div>
          </LoadingRegion>
        )}
        {state === 'error' && <ErrorState onRetry={retry} what="your automations" />}
        {state === 'empty' && (
          <div className="flex flex-col gap-8">
            <EmptyState
              icon="zap"
              title="Automate the busywork"
              description="Automations run on their own when something happens — like tagging new notes or emailing you about uploads."
              action={
                <Button variant="primary" size="md" icon="add" onClick={() => openModal({ type: 'newAutomation' })}>
                  Create automation
                </Button>
              }
            />
            <section aria-labelledby="templates-h" className="mx-auto w-full max-w-3xl">
              <h2 id="templates-h" className="mb-3 text-[14px] font-semibold">
                Start from a template
              </h2>
              <ul className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(templates) as (keyof typeof templates)[]).map((k) => {
                  const t = templates[k]
                  return (
                    <li key={k}>
                      <button
                        type="button"
                        onClick={() => openModal({ type: 'newAutomation', template: k })}
                        className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-[16px] border border-line-card bg-surface p-4 text-left hover:shadow-card"
                      >
                        <Icon name={triggers[t.trigger].icon} size={20} />
                        <span className="text-[14px] font-semibold">{t.name}</span>
                        <span className="text-[12px] text-fg-2">{describe(t.trigger, t.action, '')}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        )}
        {state === 'ready' && (
          <>
            <ResultsStatus count={list.length} noun="automation" query={query} />
            {list.length === 0 ? (
              <EmptyState compact icon="search-02" title="No matching automations" description={`Nothing matches “${query}”.`} />
            ) : (
              <ul className="flex flex-col gap-3">
                {list.map((a) => (
                  <li key={a.id} className="relative flex flex-wrap items-center gap-4 rounded-[16px] border border-line-card bg-surface p-4 hover:shadow-card">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-2">
                      <Icon name={triggers[a.trigger].icon} size={20} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h2 className="text-[15px] font-semibold">
                        <Link to={`/automation/${a.id}`} className="rounded after:absolute after:inset-0 after:rounded-[16px] hover:underline">
                          {a.name}
                        </Link>
                      </h2>
                      <p className="truncate text-[13px] text-fg-2">{describe(a.trigger, a.action, a.target)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge a={a} />
                      <span className="hidden w-28 text-right text-[12px] text-fg-2 md:block">{a.runs[0] ? `Ran ${timeAgo(a.runs[0].at)}` : 'Never run'}</span>
                      <div className="relative z-10">
                        <Switch
                          hideLabel
                          label={`${a.name} ${a.enabled ? 'on' : 'off'}`}
                          checked={a.enabled}
                          onCheckedChange={(v) => {
                            toggle(a.id, v)
                            toast(`“${a.name}” ${v ? 'turned on' : 'paused'}`)
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Main>
  )
}

export function AutomationDetail({ id }: { id: ID }) {
  const a = useStore((s) => s.automations.find((x) => x.id === id))
  const toggle = useStore((s) => s.toggleAutomation)
  const run = useStore((s) => s.runAutomation)
  const remove = useStore((s) => s.deleteAutomation)
  const [confirm, setConfirm] = useState(false)
  const [running, setRunning] = useState(false)
  useDocumentTitle(a?.name ?? 'Automation')
  if (!a) return <NotFound what="automation" />

  const runNow = () => {
    setRunning(true)
    setTimeout(() => {
      run(a.id)
      setRunning(false)
      toast('Run completed', { tone: 'success' })
    }, 900)
  }

  const successes = a.runs.filter((r) => r.status === 'success').length

  return (
    <Main>
      <PageHeader
        crumbs={[{ label: 'Automation', to: '/automation', icon: 'workflow' }, { label: a.name }]}
        backTo="/automation"
        actions={
          <Menu
            label="Automation actions"
            trigger={<IconButton icon="ellipsis" label="More actions" tooltip={false} />}
            items={[{ label: 'Delete automation', icon: 'delete', danger: true, onSelect: () => setConfirm(true) }]}
          />
        }
        title={a.name}
        titleAction={
          <Button variant="primary" icon="play" loading={running} disabled={!a.enabled} onClick={runNow}>
            {running ? 'Running…' : 'Run now'}
          </Button>
        }
      />
      <div className="grid gap-6 px-4 pt-2 pb-10 2xl:grid-cols-[1fr_338px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="flex flex-col gap-5">
            <Switch
              label={a.enabled ? 'Automation is on' : 'Automation is paused'}
              description={a.enabled ? 'It runs every time the trigger happens.' : 'Turn it on to start running again.'}
              checked={a.enabled}
              onCheckedChange={(v) => toggle(a.id, v)}
            />
            <ol className="flex flex-col gap-3" aria-label="Steps">
              <li className="flex items-center gap-3 rounded-[12px] bg-surface-2 p-3">
                <span className="flex size-9 items-center justify-center rounded-[8px] bg-surface">
                  <Icon name={triggers[a.trigger].icon} />
                </span>
                <span className="flex flex-col">
                  <span className="text-[12px] font-semibold text-fg-2">When</span>
                  <span className="text-[14px] font-medium">{triggers[a.trigger].label}</span>
                </span>
              </li>
              <li aria-hidden className="ml-7 h-4 w-px bg-line-control" />
              <li className="flex items-center gap-3 rounded-[12px] bg-surface-2 p-3">
                <span className="flex size-9 items-center justify-center rounded-[8px] bg-surface">
                  <Icon name={actions[a.action].icon} />
                </span>
                <span className="flex flex-col">
                  <span className="text-[12px] font-semibold text-fg-2">Then</span>
                  <span className="text-[14px] font-medium">
                    {actions[a.action].label}
                    {a.target && <span className="text-fg-2"> · {a.target}</span>}
                  </span>
                </span>
              </li>
            </ol>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold">Run history</h2>
            {a.runs.length === 0 ? (
              <EmptyState compact icon="clock" title="No runs yet" description="Runs will appear here after the trigger happens, or use Run now to test it." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <caption className="sr-only">Run history for {a.name}</caption>
                  <thead className="border-b border-line text-[12px] text-fg-2">
                    <tr>
                      <th scope="col" className="py-2 pr-3 font-medium">Time</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                      <th scope="col" className="py-2 text-right font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {a.runs.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-3">{formatDateTime(r.at)}</td>
                        <td className="py-2 pr-3">
                          {r.status === 'success' ? (
                            <Badge tone="success">
                              <Icon name="check-circle" size={14} /> Success
                            </Badge>
                          ) : (
                            <Badge tone="danger">
                              <Icon name="alert" size={14} /> Failed
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 text-right text-fg-2">{(r.durationMs / 1000).toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <aside aria-label="Summary" className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <h2 className="text-[14px] font-medium">Status</h2>
            <StatusBadge a={a} />
            <dl className="mt-2 flex flex-col gap-2 text-[12px] font-semibold">
              <div className="flex justify-between">
                <dt className="text-fg-2">Total runs</dt>
                <dd>{a.runs.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-2">Success rate</dt>
                <dd>{a.runs.length ? Math.round((successes / a.runs.length) * 100) : 0}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-2">Created</dt>
                <dd>{formatDateTime(a.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete “${a.name}”?`}
        description="It will stop running and its history will be removed."
        confirmLabel="Delete automation"
        onConfirm={() => {
          navigate('/automation', { replace: true })
          withUndo('Automation deleted', () => remove(a.id))
        }}
      />
    </Main>
  )
}
