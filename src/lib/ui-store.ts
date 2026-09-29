import { create } from 'zustand'
import type { ID, Mailbox } from './types'
import { useStore, type Snapshot } from './store'

/* ---------- Toasts ---------- */

export type Toast = {
  id: number
  message: string
  tone?: 'default' | 'success' | 'error'
  action?: { label: string; onClick: () => void }
}

type ToastState = {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

let toastId = 0
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id: ++toastId }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (message: string, opts: Omit<Toast, 'id' | 'message'> = {}) =>
  useToasts.getState().push({ message, ...opts })

/** Runs a destructive change and offers Undo by restoring a data snapshot. */
export function withUndo(message: string, run: () => void) {
  const store = useStore.getState()
  const snap: Snapshot = store.snapshot()
  run()
  toast(message, { action: { label: 'Undo', onClick: () => useStore.getState().restore(snap) } })
}

/* ---------- Modals ---------- */

export type ModalSpec =
  | { type: 'upload'; folderId?: ID; projectId?: ID; files?: File[] }
  | { type: 'newFolder'; projectId?: ID }
  | { type: 'newProject' }
  | { type: 'renameFolder'; folderId: ID }
  | { type: 'moveFolder'; folderId: ID }
  | { type: 'share'; folderId: ID }
  | { type: 'manageProject'; projectId: ID }
  | { type: 'deleteProject'; projectId: ID }
  | { type: 'deleteFolder'; folderId: ID }
  | { type: 'compose'; draftId?: ID; to?: string; subject?: string; body?: string; returnBox?: Mailbox }
  | { type: 'newAutomation'; template?: 'tag' | 'notify' | 'daily' }
  | { type: 'clearData' }

type UIState = {
  modal: ModalSpec | null
  openModal: (m: ModalSpec) => void
  closeModal: () => void
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  modal: null,
  openModal: (modal) => set({ modal, paletteOpen: false }),
  closeModal: () => set({ modal: null }),
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  notificationsOpen: false,
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}))

export const openModal = (m: ModalSpec) => useUI.getState().openModal(m)
