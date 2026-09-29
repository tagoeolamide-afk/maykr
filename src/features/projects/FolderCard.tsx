import type { KeyboardEvent } from 'react'
import { ART_WIDTH, FolderArt } from '../../components/FolderArt'
import { Icon } from '../../components/Icon'
import { Menu, RightClickMenu, type MenuItem } from '../../components/ui/overlays'
import { cx } from '../../components/ui/primitives'
import { formatSize, plural } from '../../lib/format'
import { navigate } from '../../lib/router'
import type { Folder } from '../../lib/types'
import { openModal } from '../../lib/ui-store'

// Card footprint from the design; the artwork bleeds past it for its drop shadow.
export const CARD_W = 230.94
export const CARD_H = 219.21

export function folderMenu(folder: Folder): MenuItem[] {
  return [
    { label: 'Open', icon: 'folder', onSelect: () => navigate(`/projects/${folder.projectId}/folders/${folder.id}`) },
    { label: 'Upload files', icon: 'upload', onSelect: () => openModal({ type: 'upload', folderId: folder.id }) },
    { label: 'Share', icon: 'share-08', onSelect: () => openModal({ type: 'share', folderId: folder.id }) },
    { type: 'separator' },
    { label: 'Rename', icon: 'edit', onSelect: () => openModal({ type: 'renameFolder', folderId: folder.id }) },
    { label: 'Move to…', icon: 'move', onSelect: () => openModal({ type: 'moveFolder', folderId: folder.id }) },
    { type: 'separator' },
    { label: 'Delete', icon: 'delete', danger: true, onSelect: () => openModal({ type: 'deleteFolder', folderId: folder.id }) },
  ]
}

type Props = { folder: Folder; notes: number; selected: boolean; onSelect: () => void }

export function FolderCard({ folder, notes, selected, onSelect }: Props) {
  const open = () => navigate(`/projects/${folder.projectId}/folders/${folder.id}`)
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      open()
    }
  }
  const items = folderMenu(folder)

  return (
    <div className="group relative" style={{ width: CARD_W, height: CARD_H }}>
      <RightClickMenu items={items}>
        <button
          type="button"
          data-card
          onClick={onSelect}
          onDoubleClick={open}
          onKeyDown={onKeyDown}
          aria-pressed={selected}
          aria-describedby="folder-card-help"
          className={cx(
            'relative block size-full cursor-pointer rounded-[22px] text-left transition-transform duration-150 hover:-translate-y-0.5',
            selected && 'outline-2 outline-offset-4 outline-accent',
          )}
        >
          <span className="absolute top-0" style={{ left: -11.0712 }}>
            <FolderArt color={folder.color} width={ART_WIDTH} />
          </span>
          <span className="sr-only">{folder.name}, </span>
          <span
            aria-hidden
            className="absolute right-[15px] bottom-[18px] left-[15px] flex h-[60px] flex-col justify-between"
            style={{ color: `var(--folder-${folder.color}-text)` }}
          >
            <span className="flex flex-col gap-1">
              <span className="truncate text-[14px] leading-[18px] font-bold">{folder.name}</span>
              <span className="text-[12px] leading-[15px] font-medium">{plural(notes, 'Note')}</span>
            </span>
            <span className="text-[11px] leading-[14px] font-medium">{formatSize(folder.sizeMb)}</span>
          </span>
          <span className="sr-only">
            {plural(notes, 'note')}, {formatSize(folder.sizeMb)}
          </span>
        </button>
      </RightClickMenu>
      <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 has-[[data-state=open]]:opacity-100 [@media(pointer:coarse)]:opacity-100">
        <Menu
          label={`${folder.name} options`}
          items={items}
          trigger={
            <button
              type="button"
              aria-label={`${folder.name} options`}
              className="tap flex size-8 cursor-pointer items-center justify-center rounded-[8px] bg-surface/90 text-fg shadow-sm backdrop-blur hover:bg-surface"
            >
              <Icon name="more-horizontal" size={18} />
            </button>
          }
        />
      </div>
    </div>
  )
}

/** Shared hidden hint referenced by every card. */
export function FolderCardHelp() {
  return (
    <p id="folder-card-help" className="sr-only">
      Press Space to select and see details, Enter to open. Right-click or use the options button for more actions.
    </p>
  )
}

/** Arrow-key navigation across a grid of cards. */
export function gridKeyNav(e: KeyboardEvent<HTMLElement>) {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
  const cards = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-card]'))
  const i = cards.indexOf(document.activeElement as HTMLElement)
  if (i < 0) return
  const top = cards[0].getBoundingClientRect().top
  const cols = Math.max(1, cards.filter((c) => c.getBoundingClientRect().top === top).length)
  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols }[e.key]!
  if (cards[next]) {
    e.preventDefault()
    cards[next].focus()
  }
}

