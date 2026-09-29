import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Main } from '../../components/shell/AppShell'
import { PageHeader } from '../../components/shell/PageHeader'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingRegion, Select, Skeleton } from '../../components/ui/primitives'
import { formatSize } from '../../lib/format'
import { useDocumentTitle, useViewState } from '../../lib/hooks'
import { navigate } from '../../lib/router'
import { useStore } from '../../lib/store'
import { openModal, toast } from '../../lib/ui-store'

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

function wave(i: number, seed: number) {
  return Math.sin(i / 3 + seed) * 0.5 + Math.sin(i / 7 + seed * 2) * 0.3
}

function Delta({ value }: { value: number }) {
  const up = value >= 0
  return (
    <Badge tone={up ? 'success' : 'danger'}>
      <span aria-hidden>{up ? '↑' : '↓'}</span>
      <span className="sr-only">{up ? 'Up' : 'Down'}</span>
      {Math.abs(value).toFixed(1)}%
    </Badge>
  )
}

const tooltipStyle = {
  background: 'var(--c-surface)',
  border: '1px solid var(--c-border)',
  borderRadius: 8,
  color: 'var(--c-text)',
  fontSize: 12,
  boxShadow: 'var(--shadow-pop)',
}

export function ReportsView() {
  useDocumentTitle('Reports')
  const folders = useStore((s) => s.folders)
  const notes = useStore((s) => s.notes)
  const files = useStore((s) => s.files)
  const projects = useStore((s) => s.projects)
  const automations = useStore((s) => s.automations)
  const storage = useStore((s) => s.storage)
  const [range, setRange] = useState('30')
  const [asTable, setAsTable] = useState(false)
  const days = Number(range)
  const [state, retry] = useViewState('reports', folders.length === 0 && notes.length === 0)

  const usedGb = storage.reduce((s, b) => s + b.usedGb, 0)
  const quotaGb = storage.reduce((s, b) => s + b.quotaGb, 0)

  const series = useMemo(() => {
    const docs = storage.find((b) => b.id === 'documents')?.usedGb ?? 0
    const vids = storage.find((b) => b.id === 'videos')?.usedGb ?? 0
    return Array.from({ length: days }, (_, i) => {
      const t = (i + 1) / days
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      return {
        date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        Documents: +(docs * (0.8 + 0.2 * t) + wave(i, 1)).toFixed(1),
        Videos: +(vids * (0.75 + 0.25 * t) + wave(i, 2) * 2).toFixed(1),
      }
    })
  }, [days, storage])

  const weekly = useMemo(() => {
    const weeks = Math.max(1, Math.round(days / 7))
    const since = Date.now() - days * 86_400_000
    const recent = notes.filter((n) => new Date(n.createdAt).getTime() >= since)
    return Array.from({ length: weeks }, (_, w) => {
      const start = since + w * 7 * 86_400_000
      const end = start + 7 * 86_400_000
      const count = recent.filter((n) => {
        const t = new Date(n.createdAt).getTime()
        return t >= start && t < end
      }).length
      return { week: `Wk ${w + 1}`, Notes: count }
    })
  }, [days, notes])

  const notesInRange = weekly.reduce((s, w) => s + w.Notes, 0)
  const runs = automations.flatMap((a) => a.runs)
  const successRate = runs.length ? (runs.filter((r) => r.status === 'success').length / runs.length) * 100 : 0

  const rows = folders
    .map((f) => ({
      id: f.id,
      name: f.name,
      project: projects.find((p) => p.id === f.projectId)?.name ?? '—',
      projectId: f.projectId,
      notes: notes.filter((n) => n.folderId === f.id).length,
      files: files.filter((x) => x.folderId === f.id).length,
      sizeMb: f.sizeMb,
    }))
    .sort((a, b) => b.sizeMb - a.sizeMb)
  const totalMb = rows.reduce((s, r) => s + r.sizeMb, 0) || 1

  const exportCsv = () => {
    const lines = [['Folder', 'Project', 'Notes', 'Files', 'Size (MB)'], ...rows.map((r) => [r.name, r.project, r.notes, r.files, r.sizeMb])]
    const csv = lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `mayker-report-${range}d.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Report exported', { tone: 'success' })
  }

  const kpis = [
    { label: 'Storage used', value: `${usedGb}GB`, sub: `of ${Math.round(quotaGb)}GB`, delta: 4.2 },
    { label: 'Notes created', value: String(notesInRange), sub: RANGES.find((r) => r.value === range)!.label.toLowerCase(), delta: 12.5 },
    { label: 'Files', value: String(files.length), sub: 'across all folders', delta: -2.1 },
    { label: 'Automation success', value: `${successRate.toFixed(0)}%`, sub: `${runs.length} runs`, delta: 1.4 },
  ]

  return (
    <Main>
      <PageHeader
        crumbs={[{ label: 'Reports', icon: 'analytics-01' }]}
        backTo="/home"
        title="Reports"
        titleAction={
          state === 'ready' && (
            <Button variant="primary" icon="export" onClick={exportCsv}>
              Export CSV
            </Button>
          )
        }
        toolbar={
          state === 'ready' && (
            <div className="w-44">
              <Select label="Date range" hideLabel value={range} onChange={(e) => setRange(e.target.value)} options={RANGES} />
            </div>
          )
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-2 pb-10">
        {state === 'loading' && (
          <LoadingRegion label="Loading reports">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[120px] rounded-[20px]" />
              ))}
            </div>
            <Skeleton className="mt-6 h-[320px] rounded-[20px]" />
          </LoadingRegion>
        )}
        {state === 'error' && <ErrorState onRetry={retry} what="your reports" />}
        {state === 'empty' && (
          <EmptyState
            icon="chart"
            title="Not enough data yet"
            description="Reports fill in as you add folders, notes and files. Come back after a few days of activity."
            action={
              <Button variant="primary" size="md" icon="add" onClick={() => openModal({ type: 'newFolder' })}>
                Create a folder
              </Button>
            }
            secondary={
              <Button size="md" onClick={() => navigate('/home')}>
                Go to Home
              </Button>
            }
          />
        )}

        {state === 'ready' && (
          <>
            <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((k) => (
                <Card key={k.label} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[14px] font-medium">{k.label}</h2>
                    <Delta value={k.delta} />
                  </div>
                  <p className="text-[30px] leading-[39px] font-bold">{k.value}</p>
                  <p className="text-[12px] text-fg-2">
                    {k.sub} · vs previous period
                  </p>
                </Card>
              ))}
            </section>

            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-[18px] font-semibold">Storage over time</h2>
                  <p className="text-[12px] text-fg-2">Gigabytes used, by type</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[12px] text-fg-2">
                    <span className="h-0.5 w-4 rounded bg-chart-blue" aria-hidden /> Documents
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-fg-2">
                    <span className="h-0.5 w-4 rounded border-t-2 border-dashed border-chart-red" aria-hidden /> Videos
                  </span>
                  <Button variant="ghost" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
                    {asTable ? 'Show chart' : 'Show as table'}
                  </Button>
                </div>
              </div>
              {asTable ? (
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-left text-[13px]">
                    <caption className="sr-only">Storage used per day in gigabytes</caption>
                    <thead className="sticky top-0 bg-surface text-[12px] text-fg-2">
                      <tr>
                        <th scope="col" className="py-2 font-medium">Date</th>
                        <th scope="col" className="py-2 font-medium">Documents (GB)</th>
                        <th scope="col" className="py-2 font-medium">Videos (GB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {series.map((s) => (
                        <tr key={s.date}>
                          <th scope="row" className="py-1.5 font-medium">{s.date}</th>
                          <td className="py-1.5">{s.Documents}</td>
                          <td className="py-1.5">{s.Videos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  role="img"
                  aria-label={`Storage over the ${RANGES.find((r) => r.value === range)!.label.toLowerCase()}: documents grew to ${series.at(-1)?.Documents}GB and videos to ${series.at(-1)?.Videos}GB. Use “Show as table” for exact values.`}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                      <defs>
                        <linearGradient id="fillDocs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--c-chart-blue)" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="var(--c-chart-blue)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--c-border)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: 'var(--c-text-2)', fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                      <YAxis tick={{ fill: 'var(--c-text-2)', fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--c-border-control)' }} />
                      <Area type="monotone" dataKey="Documents" stroke="var(--c-chart-blue)" strokeWidth={2} fill="url(#fillDocs)" />
                      <Area type="monotone" dataKey="Videos" stroke="var(--c-chart-red)" strokeWidth={2} strokeDasharray="5 4" fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <div className="grid gap-6 2xl:grid-cols-[1fr_1.4fr]">
              <Card className="flex flex-col gap-4">
                <div>
                  <h2 className="text-[18px] font-semibold">Notes created</h2>
                  <p className="text-[12px] text-fg-2">Per week</p>
                </div>
                <div role="img" aria-label={`Notes created per week: ${weekly.map((w) => `${w.week} ${w.Notes}`).join(', ')}.`} className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid stroke="var(--c-border)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fill: 'var(--c-text-2)', fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--c-text-2)', fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--c-hover)' }} />
                      <Bar dataKey="Notes" fill="var(--c-text)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="flex flex-col gap-4">
                <h2 className="text-[18px] font-semibold">Storage by folder</h2>
                {rows.length === 0 ? (
                  <p className="text-[14px] text-fg-2">No folders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <caption className="sr-only">Storage, notes and files per folder</caption>
                      <thead className="border-b border-line text-[12px] text-fg-2">
                        <tr>
                          <th scope="col" className="py-2 pr-3 font-medium">Folder</th>
                          <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">Project</th>
                          <th scope="col" className="py-2 pr-3 text-right font-medium">Notes</th>
                          <th scope="col" className="py-2 pr-3 text-right font-medium">Size</th>
                          <th scope="col" className="w-32 py-2 font-medium">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {rows.map((r) => {
                          const pct = (r.sizeMb / totalMb) * 100
                          return (
                            <tr key={r.id}>
                              <th scope="row" className="py-2 pr-3 font-medium">
                                <button type="button" onClick={() => navigate(`/projects/${r.projectId}/folders/${r.id}`)} className="cursor-pointer rounded text-left hover:underline">
                                  {r.name}
                                </button>
                              </th>
                              <td className="hidden py-2 pr-3 text-fg-2 md:table-cell">{r.project}</td>
                              <td className="py-2 pr-3 text-right">{r.notes}</td>
                              <td className="py-2 pr-3 text-right">{formatSize(r.sizeMb)}</td>
                              <td className="py-2">
                                <span className="flex items-center gap-2">
                                  <span className="h-1.5 flex-1 overflow-hidden rounded bg-track" aria-hidden>
                                    <span className="block h-full rounded bg-chart-blue" style={{ width: `${pct}%` }} />
                                  </span>
                                  <span className="w-9 text-right text-[12px] text-fg-2">{pct.toFixed(0)}%</span>
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </Main>
  )
}
