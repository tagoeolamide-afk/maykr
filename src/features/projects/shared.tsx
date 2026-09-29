import { useState, type DragEvent, type ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { DropdownMenu } from 'radix-ui'
import { cx } from '../../components/ui/primitives'
import type { ID } from '../../lib/types'
import { openModal } from '../../lib/ui-store'

/** Drag files anywhere over the area to open the upload modal with them. */
export function FileDropArea({ folderId, children, className }: { folderId?: ID; children: ReactNode; className?: string }) {
  const [over, setOver] = useState(false)
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files')
  return (
    <div
      className={cx('relative', className)}
      onDragOver={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        setOver(false)
        openModal({ type: 'upload', folderId, files: Array.from(e.dataTransfer.files) })
      }}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-[16px] border-2 border-dashed border-accent-border bg-accent-soft/90">
          <p className="flex items-center gap-2 text-[16px] font-medium text-fg">
            <Icon name="upload" /> Drop files to upload
          </p>
        </div>
      )}
    </div>
  )
}

export type SortKey = 'default' | 'name' | 'size' | 'notes' | 'recent'

type FilterMenuProps<T extends string> = {
  sort: SortKey
  onSort: (s: SortKey) => void
  sortOptions: { value: SortKey; label: string }[]
  filter?: T
  onFilter?: (f: T) => void
  filterOptions?: { value: T; label: string }[]
  filterLabel?: string
}

/** The design's "Filter" button, opening sort + filter choices. */
export function FilterMenu<T extends string>({ sort, onSort, sortOptions, filter, onFilter, filterOptions, filterLabel = 'Show' }: FilterMenuProps<T>) {
  const active = sort !== 'default' || (filter && filter !== filterOptions?.[0]?.value)
  const item =
    'flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[6px] pr-2.5 pl-8 text-[13px] font-medium text-fg outline-none relative data-[highlighted]:bg-hover'
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="tap flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-line bg-surface px-2.5 text-[12px] font-medium text-fg hover:bg-hover"
        >
          <Icon name="filter-mail" />
          Filter
          {active && <span className="size-1.5 rounded-full bg-accent" aria-label="(active)" />}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="anim-fade z-50 min-w-52 rounded-[10px] border border-line bg-surface p-1 shadow-pop">
          <DropdownMenu.Label className="px-2.5 py-1.5 text-[12px] font-semibold text-fg-2">Sort by</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={sort} onValueChange={(v) => onSort(v as SortKey)}>
            {sortOptions.map((o) => (
              <DropdownMenu.RadioItem key={o.value} value={o.value} className={item}>
                <DropdownMenu.ItemIndicator className="absolute left-2.5">
                  <Icon name="check" size={14} />
                </DropdownMenu.ItemIndicator>
                {o.label}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          {filterOptions && onFilter && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Label className="px-2.5 py-1.5 text-[12px] font-semibold text-fg-2">{filterLabel}</DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={filter} onValueChange={(v) => onFilter(v as T)}>
                {filterOptions.map((o) => (
                  <DropdownMenu.RadioItem key={o.value} value={o.value} className={item}>
                    <DropdownMenu.ItemIndicator className="absolute left-2.5">
                      <Icon name="check" size={14} />
                    </DropdownMenu.ItemIndicator>
                    {o.label}
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** Results count announced to screen readers when filtering. */
export function ResultsStatus({ count, noun, query }: { count: number; noun: string; query: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {query ? `${count} ${noun}${count === 1 ? '' : 's'} found` : ''}
    </p>
  )
}
