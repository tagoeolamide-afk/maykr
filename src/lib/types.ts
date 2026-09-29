export type ID = string

export type FolderColor = 'blue' | 'grey'
export type Role = 'owner' | 'editor' | 'viewer'
export type ThemePref = 'system' | 'light' | 'dark'

export type Member = { id: ID; name: string; email: string; role: Role }

export type Project = { id: ID; name: string; description: string; createdAt: string }

export type Folder = {
  id: ID
  projectId: ID
  name: string
  color: FolderColor
  sizeMb: number
  createdAt: string
  members: Member[]
}

export type Note = {
  id: ID
  folderId: ID | null
  title: string
  body: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export type FileKind = 'document' | 'sheet' | 'image' | 'video' | 'other'

export type FileItem = {
  id: ID
  folderId: ID
  name: string
  sizeMb: number
  kind: FileKind
  uploadedAt: string
}

export type Mailbox = 'inbox' | 'sent' | 'drafts' | 'archive'

export type Email = {
  id: ID
  box: Mailbox
  from: { name: string; email: string }
  to: string
  subject: string
  body: string
  date: string
  read: boolean
  starred: boolean
}

export type TriggerId = 'file-uploaded' | 'note-created' | 'daily' | 'email-received'
export type ActionId = 'notify-email' | 'add-tag' | 'move-to-folder' | 'create-note'

export type AutomationRun = { id: ID; at: string; status: 'success' | 'failed'; durationMs: number }

export type Automation = {
  id: ID
  name: string
  trigger: TriggerId
  action: ActionId
  /** Free-form parameter for the action: tag name, folder id, email address… */
  target: string
  enabled: boolean
  createdAt: string
  runs: AutomationRun[]
}

export type NotificationKind = 'share' | 'automation' | 'email' | 'system'

export type AppNotification = {
  id: ID
  kind: NotificationKind
  title: string
  body: string
  at: string
  read: boolean
  href?: string
}

export type User = { name: string; email: string }

export type NotificationPrefs = {
  emailDigest: boolean
  mentions: boolean
  shares: boolean
  automationFailures: boolean
  productUpdates: boolean
}

export type StorageBucket = { id: 'documents' | 'videos'; label: string; usedGb: number; quotaGb: number }
