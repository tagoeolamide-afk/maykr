import { useState, type ReactNode } from 'react'
import { useMediaQuery } from '../../lib/hooks'
import { useStore } from '../../lib/store'
import { Icon } from '../Icon'
import { Menu, Sheet } from '../ui/overlays'
import { Card, IconButton, ProgressBar } from '../ui/primitives'
import { navigate } from '../../lib/router'

export function useInfoPanel() {
  const wide = useMediaQuery('(min-width: 75rem)')
  const infoOpen = useStore((s) => s.infoOpen)
  const setInfoOpen = useStore((s) => s.setInfoOpen)
  const [sheetOpen, setSheetOpen] = useState(false)
  const inline = wide && infoOpen
  return {
    wide,
    inline,
    sheetOpen,
    setSheetOpen,
    canShow: !inline,
    show: () => (wide ? setInfoOpen(true) : setSheetOpen(true)),
    hide: () => (wide ? setInfoOpen(false) : setSheetOpen(false)),
  }
}

type Info = ReturnType<typeof useInfoPanel>

export function InfoPanel({ info, title = 'Info', children }: { info: Info; title?: string; children: ReactNode }) {
  const body = (
    <div className="flex h-full flex-col gap-[51px] overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] leading-[23px] font-medium">{title}</h2>
        <IconButton icon="arrow-left-double" label="Hide details" onClick={info.hide} className="[&>span]:-scale-x-100" />
      </div>
      <div className="flex w-full max-w-[338px] flex-col gap-10">{children}</div>
    </div>
  )

  if (info.inline) {
    return (
      <aside aria-label={title} className="hidden h-full w-[408px] shrink-0 bg-surface xl:block">
        {body}
      </aside>
    )
  }
  return (
    <Sheet open={info.sheetOpen} onOpenChange={info.setSheetOpen} title={title} width={408}>
      {body}
    </Sheet>
  )
}

export function StorageCards() {
  const storage = useStore((s) => s.storage)
  const colors = { documents: 'var(--c-chart-blue)', videos: 'var(--c-chart-red)' }
  return (
    <div className="flex flex-col gap-5">
      {storage.map((b) => {
        const pct = b.quotaGb ? (b.usedGb / b.quotaGb) * 100 : 0
        return (
          <Card key={b.id} className="flex flex-col gap-[25px]">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-[10px]">
                <h3 className="text-[14px] leading-[18px] font-medium">{b.label}</h3>
                <p className="text-[30px] leading-[39px] font-bold whitespace-nowrap">
                  {b.usedGb}GB
                  <span className="sr-only"> used of {b.quotaGb}GB</span>
                </p>
              </div>
              <Menu
                label={`${b.label} storage options`}
                trigger={<IconButton icon="more-vertical" label={`${b.label} storage options`} tooltip={false} />}
                items={[
                  { label: 'View report', icon: 'chart', onSelect: () => navigate('/reports') },
                  { label: 'Manage storage', icon: 'settings-01', onSelect: () => navigate('/settings/workspace') },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <ProgressBar value={pct} color={colors[b.id]} label={`${b.label} storage used`} />
              <p className="text-[12px] text-fg-2">
                {Math.round(pct)}% of {b.quotaGb}GB
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export function Properties({ rows, title = 'Properties' }: { rows: { label: string; value: ReactNode }[]; title?: string }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-[20px] leading-[26px] font-bold">{title}</h3>
      <dl className="flex flex-col gap-2 text-[12px] leading-[16px] font-semibold">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            {/* Design: 30% opacity; secondary token keeps the hierarchy and passes contrast. */}
            <dt className="text-fg-2">{r.label}</dt>
            <dd className="truncate text-right text-fg">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function InfoEmptyHint({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 rounded-[12px] bg-surface-2 p-3 text-[12px] text-fg-2">
      <Icon name="info" size={16} />
      {text}
    </p>
  )
}
