import { useEffect, useState, type FormEvent } from 'react'
import { FolderArt } from '../../components/FolderArt'
import { Icon } from '../../components/Icon'
import { ConfirmDialog, Modal } from '../../components/ui/overlays'
import { Avatar, Button, cx, Select, TextArea, TextField } from '../../components/ui/primitives'
import { isEmail } from '../../lib/format'
import { navigate, useRoute } from '../../lib/router'
import { useStore } from '../../lib/store'
import type { FolderColor, ID, Role } from '../../lib/types'
import { openModal, toast, withUndo } from '../../lib/ui-store'

type Base = { open: boolean; onOpenChange: (o: boolean) => void }

function useResetOnOpen(open: boolean, reset: () => void) {
  useEffect(() => void (open && reset()), [open])
}

/* ---------- New folder ---------- */

export function NewFolderModal({ open, onOpenChange, projectId }: Base & { projectId?: ID }) {
  const projects = useStore((s) => s.projects)
  const createFolder = useStore((s) => s.createFolder)
  const createProject = useStore((s) => s.createProject)
  const { segments } = useRoute()
  const [name, setName] = useState('')
  const [color, setColor] = useState<FolderColor>('grey')
  const [pid, setPid] = useState('')
  const [error, setError] = useState('')

  useResetOnOpen(open, () => {
    setName('')
    setColor('grey')
    setError('')
    setPid(projectId || (segments[0] === 'projects' && segments[1]) || projects[0]?.id || '')
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a folder name')
    const targetProject = pid || createProject('My project').id
    const folder = createFolder(targetProject, name.trim(), color)
    onOpenChange(false)
    toast(`Folder “${folder.name}” created`, {
      tone: 'success',
      action: { label: 'Open', onClick: () => navigate(`/projects/${targetProject}/folders/${folder.id}`) },
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New folder"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="new-folder">
            Create folder
          </Button>
        </>
      }
    >
      <form id="new-folder" onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <TextField label="Folder name" value={name} onChange={(e) => (setName(e.target.value), setError(''))} error={error} autoFocus placeholder="e.g. Brand research" />
        {!projectId && projects.length > 0 && (
          <Select label="Project" value={pid} onChange={(e) => setPid(e.target.value)} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        )}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-medium">Colour</legend>
          <div className="flex gap-3">
            {(['grey', 'blue'] as const).map((c) => (
              <label
                key={c}
                className={cx(
                  'flex flex-1 cursor-pointer items-center gap-3 rounded-[10px] border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
                  color === c ? 'border-fg bg-hover' : 'border-line',
                )}
              >
                <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} className="sr-only" />
                <FolderArt color={c} width={44} />
                <span className="text-[14px] font-medium capitalize">{c}</span>
                {color === c && <Icon name="check" size={16} className="ml-auto" />}
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}

/* ---------- New project ---------- */

export function NewProjectModal({ open, onOpenChange }: Base) {
  const createProject = useStore((s) => s.createProject)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  useResetOnOpen(open, () => (setName(''), setDescription(''), setError('')))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a project name')
    const p = createProject(name.trim(), description.trim())
    onOpenChange(false)
    navigate(`/projects/${p.id}`)
    toast(`Project “${p.name}” created`, { tone: 'success' })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New project"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="new-project">
            Create project
          </Button>
        </>
      }
    >
      <form id="new-project" onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <TextField label="Project name" value={name} onChange={(e) => (setName(e.target.value), setError(''))} error={error} autoFocus />
        <TextArea label="Description" hint="Optional" value={description} onChange={(e) => setDescription(e.target.value)} />
      </form>
    </Modal>
  )
}

/* ---------- Rename folder ---------- */

export function RenameFolderModal({ open, onOpenChange, folderId }: Base & { folderId: ID }) {
  const folder = useStore((s) => s.folders.find((f) => f.id === folderId))
  const renameFolder = useStore((s) => s.renameFolder)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  useResetOnOpen(open, () => (setName(folder?.name ?? ''), setError('')))
  if (!folder) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a folder name')
    renameFolder(folderId, name.trim())
    onOpenChange(false)
    toast('Folder renamed')
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Rename folder"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="rename-folder">
            Save
          </Button>
        </>
      }
    >
      <form id="rename-folder" onSubmit={submit} noValidate>
        <TextField label="Folder name" value={name} onChange={(e) => (setName(e.target.value), setError(''))} error={error} autoFocus onFocus={(e) => e.target.select()} />
      </form>
    </Modal>
  )
}

/* ---------- Move folder ---------- */

export function MoveFolderModal({ open, onOpenChange, folderId }: Base & { folderId: ID }) {
  const folder = useStore((s) => s.folders.find((f) => f.id === folderId))
  const projects = useStore((s) => s.projects)
  const moveFolder = useStore((s) => s.moveFolder)
  const [target, setTarget] = useState('')
  useResetOnOpen(open, () => setTarget(folder?.projectId ?? ''))
  if (!folder) return null

  const submit = () => {
    const project = projects.find((p) => p.id === target)
    if (!project || target === folder.projectId) return onOpenChange(false)
    withUndo(`Moved “${folder.name}” to ${project.name}`, () => moveFolder(folderId, target))
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Move folder"
      description={`Choose where “${folder.name}” should live.`}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={target === folder.projectId}>
            Move here
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="sr-only">Destination project</legend>
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <label
              key={p.id}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-[10px] border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
                target === p.id ? 'border-fg bg-hover' : 'border-line hover:bg-hover',
              )}
            >
              <input type="radio" name="dest" checked={target === p.id} onChange={() => setTarget(p.id)} className="sr-only" />
              <Icon name="folder-02" />
              <span className="flex-1 text-[14px] font-medium">{p.name}</span>
              {p.id === folder.projectId && <span className="text-[12px] text-fg-2">Current</span>}
              {target === p.id && <Icon name="check" size={16} />}
            </label>
          ))}
        </div>
      </fieldset>
    </Modal>
  )
}

/* ---------- Share ---------- */

const roleOptions = [
  { value: 'editor', label: 'Can edit' },
  { value: 'viewer', label: 'Can view' },
]

export function ShareModal({ open, onOpenChange, folderId }: Base & { folderId: ID }) {
  const folder = useStore((s) => s.folders.find((f) => f.id === folderId))
  const addMember = useStore((s) => s.addMember)
  const updateRole = useStore((s) => s.updateMemberRole)
  const removeMember = useStore((s) => s.removeMember)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [error, setError] = useState('')
  useResetOnOpen(open, () => (setEmail(''), setError('')))
  if (!folder) return null

  const invite = (e: FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) return setError('Enter a valid email address')
    if (folder.members.some((m) => m.email === email.trim())) return setError('This person already has access')
    addMember(folderId, email.trim(), role)
    toast(`Invited ${email.trim()}`, { tone: 'success' })
    setEmail('')
  }

  const copyLink = async () => {
    const url = `${location.origin}${location.pathname}#/projects/${folder.projectId}/folders/${folder.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copied to clipboard', { tone: 'success' })
    } catch {
      toast('Couldn’t copy the link', { tone: 'error' })
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Share “${folder.name}”`}
      width={520}
      footerStart={
        <Button variant="ghost" icon="link" onClick={copyLink}>
          Copy link
        </Button>
      }
      footer={
        <Button variant="primary" onClick={() => onOpenChange(false)}>
          Done
        </Button>
      }
    >
      <form onSubmit={invite} className="flex flex-col gap-2" noValidate>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <TextField
              label="Invite by email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => (setEmail(e.target.value), setError(''))}
              error={error}
              autoComplete="off"
            />
          </div>
          <div className="w-32">
            <Select label="Permission" value={role} onChange={(e) => setRole(e.target.value as Role)} options={roleOptions} />
          </div>
        </div>
        <Button variant="primary" size="md" type="submit" icon="user-add" className="self-start">
          Invite
        </Button>
      </form>

      <h3 className="mt-7 mb-2 text-[13px] font-medium">People with access</h3>
      <ul className="flex flex-col">
        {folder.members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2">
            <Avatar name={m.name} size={32} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14px] font-medium">{m.name}</span>
              <span className="truncate text-[12px] text-fg-2">{m.email}</span>
            </div>
            {m.role === 'owner' ? (
              <span className="text-[12px] text-fg-2">Owner</span>
            ) : (
              <div className="flex items-center gap-1">
                <label className="sr-only" htmlFor={`role-${m.id}`}>
                  Permission for {m.name}
                </label>
                <select
                  id={`role-${m.id}`}
                  value={m.role}
                  onChange={(e) => updateRole(folderId, m.id, e.target.value as Role)}
                  className="h-8 cursor-pointer rounded-[6px] border border-line-control bg-surface px-2 text-[12px] text-fg"
                >
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Remove ${m.name}`}
                  onClick={() => removeMember(folderId, m.id)}
                  className="tap flex size-8 cursor-pointer items-center justify-center rounded-[6px] text-fg-2 hover:bg-hover hover:text-fg"
                >
                  <Icon name="cancel-01" size={16} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  )
}

/* ---------- Manage project ---------- */

export function ManageProjectModal({ open, onOpenChange, projectId }: Base & { projectId: ID }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const updateProject = useStore((s) => s.updateProject)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  useResetOnOpen(open, () => (setName(project?.name ?? ''), setDescription(project?.description ?? ''), setError('')))
  if (!project) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a project name')
    updateProject(projectId, { name: name.trim(), description: description.trim() })
    onOpenChange(false)
    toast('Project updated', { tone: 'success' })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Manage project"
      width={520}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" type="submit" form="manage-project">
            Save changes
          </Button>
        </>
      }
    >
      <form id="manage-project" onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <TextField label="Project name" value={name} onChange={(e) => (setName(e.target.value), setError(''))} error={error} />
        <TextArea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </form>
      <section className="mt-8 flex items-center justify-between gap-4 rounded-[10px] border border-danger/40 p-4">
        <div>
          <h3 className="text-[14px] font-semibold text-danger">Delete project</h3>
          <p className="text-[12px] text-fg-2">Deletes all folders, notes and files in this project.</p>
        </div>
        <Button variant="danger" onClick={() => openModal({ type: 'deleteProject', projectId })}>
          Delete
        </Button>
      </section>
    </Modal>
  )
}

/* ---------- Deletes ---------- */

export function DeleteProjectDialog({ open, onOpenChange, projectId }: Base & { projectId: ID }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const deleteProject = useStore((s) => s.deleteProject)
  if (!project) return null
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete “${project.name}”?`}
      description="All folders, notes and files in this project will be deleted."
      confirmLabel="Delete project"
      requireText={project.name}
      onConfirm={() => {
        navigate('/projects')
        withUndo(`Project “${project.name}” deleted`, () => deleteProject(projectId))
      }}
    />
  )
}

export function DeleteFolderDialog({ open, onOpenChange, folderId }: Base & { folderId: ID }) {
  const folder = useStore((s) => s.folders.find((f) => f.id === folderId))
  const count = useStore((s) => s.notes.filter((n) => n.folderId === folderId).length)
  const deleteFolder = useStore((s) => s.deleteFolder)
  if (!folder) return null
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete “${folder.name}”?`}
      description={`This folder and its ${count} notes will be deleted. You can undo right after.`}
      confirmLabel="Delete folder"
      onConfirm={() => {
        if (location.hash.includes(`/folders/${folderId}`)) navigate(`/projects/${folder.projectId}`)
        withUndo(`Folder “${folder.name}” deleted`, () => deleteFolder(folderId))
      }}
    />
  )
}
