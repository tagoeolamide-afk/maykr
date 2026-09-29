import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  SEED_USER,
  seedAutomations,
  seedEmails,
  seedFiles,
  seedFolders,
  seedNotes,
  seedNotifications,
  seedProjects,
  seedStorage,
} from './seed'
import type {
  ActionId,
  AppNotification,
  Automation,
  Email,
  FileItem,
  Folder,
  FolderColor,
  ID,
  Mailbox,
  Member,
  Note,
  NotificationPrefs,
  Project,
  Role,
  StorageBucket,
  ThemePref,
  TriggerId,
  User,
} from './types'

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
const now = () => new Date().toISOString()

type Data = {
  projects: Project[]
  folders: Folder[]
  notes: Note[]
  files: FileItem[]
  emails: Email[]
  automations: Automation[]
  notifications: AppNotification[]
  storage: StorageBucket[]
}

const seedData = (): Data => ({
  projects: seedProjects,
  folders: seedFolders,
  notes: seedNotes,
  files: seedFiles,
  emails: seedEmails,
  automations: seedAutomations,
  notifications: seedNotifications,
  storage: seedStorage,
})

const emptyData = (): Data => ({
  projects: [],
  folders: [],
  notes: [],
  files: [],
  emails: [],
  automations: [],
  notifications: [],
  storage: seedStorage.map((b) => ({ ...b, usedGb: 0 })),
})

const DATA_KEYS = ['projects', 'folders', 'notes', 'files', 'emails', 'automations', 'notifications', 'storage'] as const
export type Snapshot = Pick<Data, (typeof DATA_KEYS)[number]>

type State = Data & {
  user: User | null
  theme: ThemePref
  sidebarCollapsed: boolean
  infoOpen: boolean
  notificationPrefs: NotificationPrefs
  workspaceName: string
  onboardingDismissed: boolean

  snapshot: () => Snapshot
  restore: (s: Snapshot) => void

  login: (email: string) => void
  updateProfile: (u: Partial<User>) => void
  setTheme: (t: ThemePref) => void
  toggleSidebar: () => void
  setInfoOpen: (open: boolean) => void
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => void
  setWorkspaceName: (name: string) => void
  dismissOnboarding: () => void
  resetDemo: () => void
  clearAll: () => void

  createProject: (name: string, description?: string) => Project
  updateProject: (id: ID, patch: Partial<Pick<Project, 'name' | 'description'>>) => void
  deleteProject: (id: ID) => void

  createFolder: (projectId: ID, name: string, color: FolderColor) => Folder
  renameFolder: (id: ID, name: string) => void
  moveFolder: (id: ID, projectId: ID) => void
  deleteFolder: (id: ID) => void
  addMember: (folderId: ID, email: string, role: Role) => void
  updateMemberRole: (folderId: ID, memberId: ID, role: Role) => void
  removeMember: (folderId: ID, memberId: ID) => void

  createNote: (folderId: ID | null, title?: string) => Note
  updateNote: (id: ID, patch: Partial<Omit<Note, 'id' | 'createdAt'>>) => void
  deleteNote: (id: ID) => void

  addFiles: (folderId: ID, files: Omit<FileItem, 'id' | 'folderId' | 'uploadedAt'>[]) => void
  deleteFile: (id: ID) => void

  markEmailRead: (id: ID, read: boolean) => void
  toggleEmailStar: (id: ID) => void
  moveEmail: (id: ID, box: Mailbox) => void
  deleteEmail: (id: ID) => void
  sendEmail: (draft: { to: string; subject: string; body: string }, draftId?: ID) => void
  saveDraft: (draft: { to: string; subject: string; body: string }, draftId?: ID) => ID

  createAutomation: (a: { name: string; trigger: TriggerId; action: ActionId; target: string }) => Automation
  toggleAutomation: (id: ID, enabled: boolean) => void
  runAutomation: (id: ID) => void
  deleteAutomation: (id: ID) => void

  markNotificationRead: (id: ID) => void
  markAllNotificationsRead: () => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seedData(),
      user: SEED_USER,
      theme: 'system',
      sidebarCollapsed: false,
      infoOpen: true,
      notificationPrefs: { emailDigest: true, mentions: true, shares: true, automationFailures: true, productUpdates: false },
      workspaceName: 'Mayker',
      onboardingDismissed: false,

      snapshot: () => {
        const s = get()
        return Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as Snapshot
      },
      restore: (snap) => set(snap),

      login: (email) => set({ user: { name: SEED_USER.name, email } }),
      updateProfile: (u) => set((s) => ({ user: s.user ? { ...s.user, ...u } : s.user })),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setInfoOpen: (infoOpen) => set({ infoOpen }),
      setNotificationPref: (key, value) => set((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: value } })),
      setWorkspaceName: (workspaceName) => set({ workspaceName }),
      dismissOnboarding: () => set({ onboardingDismissed: true }),
      resetDemo: () => set({ ...seedData(), onboardingDismissed: false }),
      clearAll: () => set({ ...emptyData(), onboardingDismissed: false }),

      createProject: (name, description = '') => {
        const project = { id: uid('p'), name, description, createdAt: now() }
        set((s) => ({ projects: [...s.projects, project] }))
        return project
      },
      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProject: (id) =>
        set((s) => {
          const folderIds = new Set(s.folders.filter((f) => f.projectId === id).map((f) => f.id))
          return {
            projects: s.projects.filter((p) => p.id !== id),
            folders: s.folders.filter((f) => !folderIds.has(f.id)),
            notes: s.notes.filter((n) => !n.folderId || !folderIds.has(n.folderId)),
            files: s.files.filter((f) => !folderIds.has(f.folderId)),
          }
        }),

      createFolder: (projectId, name, color) => {
        const u = get().user ?? SEED_USER
        const folder: Folder = {
          id: uid('fd'),
          projectId,
          name,
          color,
          sizeMb: 0,
          createdAt: now(),
          members: [{ id: 'm-owner', name: u.name, email: u.email, role: 'owner' }],
        }
        set((s) => ({ folders: [...s.folders, folder] }))
        return folder
      },
      renameFolder: (id, name) => set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) })),
      moveFolder: (id, projectId) =>
        set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, projectId } : f)) })),
      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          notes: s.notes.filter((n) => n.folderId !== id),
          files: s.files.filter((f) => f.folderId !== id),
        })),
      addMember: (folderId, email, role) =>
        set((s) => ({
          folders: s.folders.map((f) => {
            if (f.id !== folderId || f.members.some((m) => m.email === email)) return f
            const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            const member: Member = { id: uid('m'), name, email, role }
            return { ...f, members: [...f.members, member] }
          }),
        })),
      updateMemberRole: (folderId, memberId, role) =>
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === folderId ? { ...f, members: f.members.map((m) => (m.id === memberId ? { ...m, role } : m)) } : f,
          ),
        })),
      removeMember: (folderId, memberId) =>
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === folderId ? { ...f, members: f.members.filter((m) => m.id !== memberId) } : f,
          ),
        })),

      createNote: (folderId, title = '') => {
        const t = now()
        const note: Note = { id: uid('n'), folderId, title, body: '', tags: [], pinned: false, createdAt: t, updatedAt: t }
        set((s) => ({ notes: [note, ...s.notes] }))
        return note
      },
      updateNote: (id, patch) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)) })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      addFiles: (folderId, files) =>
        set((s) => {
          const added = files.map((f) => ({ ...f, id: uid('f'), folderId, uploadedAt: now() }))
          const mb = added.reduce((sum, f) => sum + f.sizeMb, 0)
          return {
            files: [...added, ...s.files],
            folders: s.folders.map((f) => (f.id === folderId ? { ...f, sizeMb: +(f.sizeMb + mb).toFixed(1) } : f)),
          }
        }),
      deleteFile: (id) =>
        set((s) => {
          const file = s.files.find((f) => f.id === id)
          return {
            files: s.files.filter((f) => f.id !== id),
            folders: file
              ? s.folders.map((f) =>
                  f.id === file.folderId ? { ...f, sizeMb: Math.max(0, +(f.sizeMb - file.sizeMb).toFixed(1)) } : f,
                )
              : s.folders,
          }
        }),

      markEmailRead: (id, read) => set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, read } : e)) })),
      toggleEmailStar: (id) =>
        set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)) })),
      moveEmail: (id, box) => set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, box } : e)) })),
      deleteEmail: (id) => set((s) => ({ emails: s.emails.filter((e) => e.id !== id) })),
      sendEmail: (draft, draftId) => {
        const u = get().user ?? SEED_USER
        const email: Email = {
          id: uid('e'),
          box: 'sent',
          from: { name: u.name, email: u.email },
          ...draft,
          date: now(),
          read: true,
          starred: false,
        }
        set((s) => ({ emails: [email, ...s.emails.filter((e) => e.id !== draftId)] }))
      },
      saveDraft: (draft, draftId) => {
        const u = get().user ?? SEED_USER
        const id = draftId ?? uid('e')
        const email: Email = {
          id,
          box: 'drafts',
          from: { name: u.name, email: u.email },
          ...draft,
          date: now(),
          read: true,
          starred: false,
        }
        set((s) => ({ emails: [email, ...s.emails.filter((e) => e.id !== id)] }))
        return id
      },

      createAutomation: (a) => {
        const automation: Automation = { ...a, id: uid('a'), enabled: true, createdAt: now(), runs: [] }
        set((s) => ({ automations: [automation, ...s.automations] }))
        return automation
      },
      toggleAutomation: (id, enabled) =>
        set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, enabled } : a)) })),
      runAutomation: (id) =>
        set((s) => ({
          automations: s.automations.map((a) =>
            a.id === id
              ? {
                  ...a,
                  runs: [
                    { id: uid('r'), at: now(), status: 'success', durationMs: 400 + Math.floor(Math.random() * 1200) },
                    ...a.runs,
                  ],
                }
              : a,
          ),
        })),
      deleteAutomation: (id) => set((s) => ({ automations: s.automations.filter((a) => a.id !== id) })),

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: 'mayker-v1',
      // Login is switched off for now: always have a signed-in user, even if a saved session had none.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>
        return { ...current, ...p, user: p.user ?? current.user }
      },
      partialize: (s) => {
        // Functions are not persisted; everything else is.
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(s)) if (typeof v !== 'function') out[k] = v
        return out as Partial<State>
      },
    },
  ),
)

/** Folder stats derived from notes. */
export function useFolderNoteCount(folderId: ID) {
  return useStore((s) => s.notes.filter((n) => n.folderId === folderId).length)
}
