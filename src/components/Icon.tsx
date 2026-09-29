import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon,
  AlertCircleIcon,
  Archive01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowTurnForwardIcon,
  Building03Icon,
  Calendar03Icon,
  ChartLineData01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CommandIcon,
  ComputerIcon,
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  File01Icon,
  FileExportIcon,
  Folder01Icon,
  FolderTransferIcon,
  Image01Icon,
  InboxIcon,
  InformationCircleIcon,
  Link01Icon,
  Loading03Icon,
  LockPasswordIcon,
  MailOpen01Icon,
  MailReply01Icon,
  Menu01Icon,
  Moon02Icon,
  MoreHorizontalIcon,
  PaintBoardIcon,
  PencilEdit02Icon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  RefreshIcon,
  SentIcon,
  StarIcon,
  Sun03Icon,
  Tag01Icon,
  Tick02Icon,
  Upload01Icon,
  UserAdd01Icon,
  UserIcon,
  Video01Icon,
  ViewIcon,
  ViewOffIcon,
  ZapIcon,
} from '@hugeicons/core-free-icons'

import analytics01 from '../assets/icons/analytics-01.svg'
import arrowLeft02 from '../assets/icons/arrow-left-02.svg'
import arrowLeftDouble from '../assets/icons/arrow-left-double.svg'
import cancel01 from '../assets/icons/cancel-01.svg'
import chevronLeft from '../assets/icons/chevron-left.svg'
import ellipsis from '../assets/icons/ellipsis.svg'
import file01 from '../assets/icons/file-01.svg'
import filterMail from '../assets/icons/filter-mail.svg'
import folder02 from '../assets/icons/folder-02.svg'
import folderAdd from '../assets/icons/folder-add.svg'
import helpCircle from '../assets/icons/help-circle.svg'
import home05 from '../assets/icons/home-05.svg'
import logOut from '../assets/icons/log-out.svg'
import mails from '../assets/icons/mails.svg'
import moreVertical from '../assets/icons/more-vertical.svg'
import notification01 from '../assets/icons/notification-01.svg'
import panelLeftClose from '../assets/icons/panel-left-close.svg'
import search02 from '../assets/icons/search-02.svg'
import settings01 from '../assets/icons/settings-01.svg'
import share08 from '../assets/icons/share-08.svg'
import workflow from '../assets/icons/workflow.svg'

/** Icons exported from the Figma file. Rendered as masks so they take the text colour. */
const figmaIcons = {
  'analytics-01': analytics01,
  'arrow-left-02': arrowLeft02,
  'arrow-left-double': arrowLeftDouble,
  'cancel-01': cancel01,
  'chevron-left': chevronLeft,
  ellipsis,
  'file-01': file01,
  'filter-mail': filterMail,
  'folder-02': folder02,
  'folder-add': folderAdd,
  'help-circle': helpCircle,
  'home-05': home05,
  'log-out': logOut,
  mails,
  'more-vertical': moreVertical,
  'notification-01': notification01,
  'panel-left-close': panelLeftClose,
  'search-02': search02,
  'settings-01': settings01,
  'share-08': share08,
  workflow,
} as const

/** The Figma icons are from Hugeicons (stroke rounded); extra icons come from the same set. */
const hugeIcons = {
  add: Add01Icon,
  alert: AlertCircleIcon,
  archive: Archive01Icon,
  'chevron-down': ArrowDown01Icon,
  'chevron-right': ArrowRight01Icon,
  forward: ArrowTurnForwardIcon,
  building: Building03Icon,
  calendar: Calendar03Icon,
  chart: ChartLineData01Icon,
  'check-circle': CheckmarkCircle02Icon,
  clock: Clock01Icon,
  command: CommandIcon,
  computer: ComputerIcon,
  copy: Copy01Icon,
  delete: Delete02Icon,
  download: Download01Icon,
  edit: Edit02Icon,
  file: File01Icon,
  export: FileExportIcon,
  folder: Folder01Icon,
  move: FolderTransferIcon,
  image: Image01Icon,
  inbox: InboxIcon,
  info: InformationCircleIcon,
  link: Link01Icon,
  spinner: Loading03Icon,
  lock: LockPasswordIcon,
  'mail-open': MailOpen01Icon,
  reply: MailReply01Icon,
  menu: Menu01Icon,
  moon: Moon02Icon,
  'more-horizontal': MoreHorizontalIcon,
  palette: PaintBoardIcon,
  pencil: PencilEdit02Icon,
  pin: PinIcon,
  'pin-off': PinOffIcon,
  play: PlayIcon,
  refresh: RefreshIcon,
  sent: SentIcon,
  star: StarIcon,
  sun: Sun03Icon,
  tag: Tag01Icon,
  check: Tick02Icon,
  upload: Upload01Icon,
  'user-add': UserAdd01Icon,
  user: UserIcon,
  video: Video01Icon,
  eye: ViewIcon,
  'eye-off': ViewOffIcon,
  zap: ZapIcon,
} satisfies Record<string, IconSvgElement>

export type IconName = keyof typeof figmaIcons | keyof typeof hugeIcons

type IconProps = {
  name: IconName
  size?: number
  className?: string
  /** Fill Hugeicons shapes (used for the active star). */
  filled?: boolean
}

export function Icon({ name, size = 18, className = '', filled }: IconProps) {
  if (name in figmaIcons) {
    const src = figmaIcons[name as keyof typeof figmaIcons]
    return (
      <span
        aria-hidden
        className={`inline-block shrink-0 bg-current ${className}`}
        style={{
          width: size,
          height: size,
          maskImage: `url("${src}")`,
          WebkitMaskImage: `url("${src}")`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
    )
  }
  return (
    <HugeiconsIcon
      icon={hugeIcons[name as keyof typeof hugeIcons]}
      size={size}
      strokeWidth={1.5}
      color="currentColor"
      fill={filled ? 'currentColor' : 'none'}
      className={`shrink-0 ${className}`}
      aria-hidden
    />
  )
}
