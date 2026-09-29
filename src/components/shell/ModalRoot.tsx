import { NewAutomationModal } from '../../features/automation/NewAutomationModal'
import { ComposeModal } from '../../features/emails/ComposeModal'
import {
  DeleteFolderDialog,
  DeleteProjectDialog,
  ManageProjectModal,
  MoveFolderModal,
  NewFolderModal,
  NewProjectModal,
  RenameFolderModal,
  ShareModal,
} from '../../features/projects/modals'
import { UploadModal } from '../../features/projects/UploadModal'
import { useStore } from '../../lib/store'
import { toast, useUI } from '../../lib/ui-store'
import { ConfirmDialog } from '../ui/overlays'

/** Renders whichever modal is open. Any screen can open one via openModal(). */
export function ModalRoot() {
  const modal = useUI((s) => s.modal)
  const closeModal = useUI((s) => s.closeModal)
  const clearAll = useStore((s) => s.clearAll)
  if (!modal) return null

  const common = { open: true, onOpenChange: (o: boolean) => !o && closeModal() }

  switch (modal.type) {
    case 'upload':
      return <UploadModal {...common} folderId={modal.folderId} initialFiles={modal.files} />
    case 'newFolder':
      return <NewFolderModal {...common} projectId={modal.projectId} />
    case 'newProject':
      return <NewProjectModal {...common} />
    case 'renameFolder':
      return <RenameFolderModal {...common} folderId={modal.folderId} />
    case 'moveFolder':
      return <MoveFolderModal {...common} folderId={modal.folderId} />
    case 'share':
      return <ShareModal {...common} folderId={modal.folderId} />
    case 'manageProject':
      return <ManageProjectModal {...common} projectId={modal.projectId} />
    case 'deleteProject':
      return <DeleteProjectDialog {...common} projectId={modal.projectId} />
    case 'deleteFolder':
      return <DeleteFolderDialog {...common} folderId={modal.folderId} />
    case 'compose':
      return <ComposeModal {...common} draftId={modal.draftId} to={modal.to} subject={modal.subject} body={modal.body} />
    case 'newAutomation':
      return <NewAutomationModal {...common} template={modal.template} />
    case 'clearData':
      return (
        <ConfirmDialog
          {...common}
          title="Delete all workspace data?"
          description="Removes every project, folder, note, file, email and automation from this demo so you can see the empty states. Reset demo data brings it back."
          confirmLabel="Delete everything"
          requireText="DELETE"
          onConfirm={() => {
            clearAll()
            toast('Workspace cleared')
          }}
        />
      )
  }
}
