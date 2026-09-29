import { useEffect, useRef, useState, type DragEvent } from 'react'
import fileDownload from '../../assets/upload/file-download.svg'
import xls from '../../assets/upload/xls.png'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/ui/overlays'
import { Button, cx, Select } from '../../components/ui/primitives'
import { formatSize } from '../../lib/format'
import { navigate } from '../../lib/router'
import { uid, useStore } from '../../lib/store'
import type { FileKind, ID } from '../../lib/types'
import { toast } from '../../lib/ui-store'

const MAX_MB = 250

type Upload = { id: string; name: string; sizeMb: number; kind: FileKind; progress: number; error?: string }

function kindOf(name: string): FileKind {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['xls', 'xlsx', 'csv', 'numbers'].includes(ext)) return 'sheet'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'webm', 'mkv'].includes(ext)) return 'video'
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'pages', 'key', 'ppt', 'pptx'].includes(ext)) return 'document'
  return 'other'
}

/** Spreadsheet icon from the design (a crop of a larger PNG, positioned as in Figma). */
export function XlsIcon({ size = 20 }: { size?: number }) {
  return (
    <span className="relative block shrink-0 overflow-hidden" style={{ width: size, height: size * 0.923 }} aria-hidden>
      <img src={xls} alt="" className="absolute max-w-none" style={{ width: '184.62%', height: '133.33%', left: '-46.15%', top: '-16.67%' }} />
    </span>
  )
}

export function FileKindIcon({ kind }: { kind: FileKind }) {
  if (kind === 'sheet') return <XlsIcon />
  const map = { document: 'file', image: 'image', video: 'video', other: 'file' } as const
  return <Icon name={map[kind]} size={18} className="text-fg-2" />
}

export function UploadModal({
  open,
  onOpenChange,
  folderId: initialFolder,
  initialFiles,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  folderId?: ID
  initialFiles?: File[]
}) {
  const folders = useStore((s) => s.folders)
  const projects = useStore((s) => s.projects)
  const addFiles = useStore((s) => s.addFiles)
  const [folderId, setFolderId] = useState<ID>(initialFolder ?? folders[0]?.id ?? '')
  const [uploads, setUploads] = useState<Upload[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUploads([])
      setFolderId(initialFolder ?? folders[0]?.id ?? '')
      if (initialFiles?.length) accept(initialFiles)
    }
  }, [open, initialFolder])

  // Simulated upload progress.
  useEffect(() => {
    if (!uploads.some((u) => !u.error && u.progress < 100)) return
    const t = setInterval(() => {
      setUploads((list) =>
        list.map((u) => (u.error || u.progress >= 100 ? u : { ...u, progress: Math.min(100, u.progress + 8 + Math.random() * 14) })),
      )
    }, 220)
    return () => clearInterval(t)
  }, [uploads])

  const accept = (files: FileList | File[]) => {
    const next = Array.from(files).map((f): Upload => {
      const sizeMb = f.size / 1024 / 1024
      return {
        id: uid('up'),
        name: f.name,
        sizeMb,
        kind: kindOf(f.name),
        progress: 0,
        error: sizeMb > MAX_MB ? `This file is larger than ${MAX_MB}MB` : undefined,
      }
    })
    setUploads((u) => [...u, ...next])
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) accept(e.dataTransfer.files)
  }

  const valid = uploads.filter((u) => !u.error)
  const uploading = valid.some((u) => u.progress < 100)
  const done = valid.length > 0 && !uploading
  const folder = folders.find((f) => f.id === folderId)

  const finish = () => {
    if (!folder) return
    addFiles(folderId, valid.map((u) => ({ name: u.name, sizeMb: +u.sizeMb.toFixed(2), kind: u.kind })))
    onOpenChange(false)
    toast(`${valid.length} ${valid.length === 1 ? 'file' : 'files'} uploaded to ${folder.name}`, {
      tone: 'success',
      action: { label: 'View', onClick: () => navigate(`/projects/${folder.projectId}/folders/${folder.id}?tab=files`) },
    })
  }

  const downloadTemplate = () => {
    const blob = new Blob(['Name,Owner,Status,Due date\nExample task,Jenny Wilson,In progress,2026-10-15\n'], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'table-example.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload files"
      footerStart={
        <button
          type="button"
          onClick={() => toast('The help center isn’t connected in this demo.')}
          className="tap flex cursor-pointer items-center gap-1.5 rounded-[6px] text-[12px] text-fg hover:underline"
        >
          <Icon name="help-circle" size={22} />
          Help center
        </button>
      }
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!done || !folder} onClick={finish}>
            {uploading ? 'Uploading…' : 'Done'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!initialFolder && (
          <Select
            label="Upload to"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            options={folders.map((f) => ({ value: f.id, label: `${f.name} — ${projects.find((p) => p.id === f.projectId)?.name ?? ''}` }))}
          />
        )}

        <div className="flex flex-col gap-[19px]">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cx(
              'flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-accent-border bg-accent-soft px-6 py-[55px] transition-colors',
              dragging && 'border-solid brightness-95',
            )}
          >
            <div className="flex flex-col items-center gap-6">
              <span className="relative block h-[31.636px] w-6" aria-hidden>
                <img
                  src={fileDownload}
                  alt=""
                  width={37.0455}
                  height={40.1138}
                  className="absolute block max-w-none"
                  style={{ left: '-2.27%', top: '-1.72%' }}
                />
              </span>
              <p className="text-center text-[14px] tracking-[-0.42px] text-fg">
                Drag and drop file here or{' '}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="cursor-pointer rounded underline underline-offset-2 hover:text-accent"
                >
                  choose file
                </button>
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  if (e.target.files) accept(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-[12px] text-fg-2">
            <p>Supported formats: documents, sheets, images, video</p>
            <p>Maximum size: {MAX_MB}MB</p>
          </div>
        </div>

        {uploads.length === 0 ? (
          <div className="flex items-center justify-between gap-4 rounded-[8px] bg-surface-2 p-4">
            <div className="flex max-w-[240px] flex-col gap-2.5">
              <p className="flex items-center gap-1.5 text-[14px] font-medium">
                <XlsIcon size={13} />
                Table Example
              </p>
              <p className="text-[12px] leading-[14px] text-fg-2">
                You can download the attached example and use it as a starting point for your own file
              </p>
            </div>
            <Button onClick={downloadTemplate}>Download</Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Files">
            {uploads.map((u) => {
              const pct = Math.round(u.progress)
              return (
                <li key={u.id} className={cx('flex flex-col gap-3.5 rounded-[8px] p-4', u.error ? 'bg-danger-soft' : 'bg-surface-2')}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex size-[33px] shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface">
                        <FileKindIcon kind={u.kind} />
                      </span>
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <p className="truncate text-[14px] font-medium tracking-[-0.42px]">{u.name}</p>
                        <p className={cx('text-[12px]', u.error ? 'font-medium text-danger' : 'text-fg-2')}>
                          {u.error ?? formatSize(+u.sizeMb.toFixed(2))}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${u.name}`}
                      onClick={() => setUploads((list) => list.filter((x) => x.id !== u.id))}
                      className="tap flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] hover:bg-hover"
                    >
                      <Icon name="cancel-01" size={22} />
                    </button>
                  </div>
                  {!u.error && (
                    <div className="flex items-center gap-6">
                      <div
                        role="progressbar"
                        aria-label={`Uploading ${u.name}`}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-[5px] flex-1 overflow-hidden rounded-[4px] bg-surface"
                      >
                        <div className="h-full rounded-[4px] bg-chart-blue transition-[width] duration-200" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-9 text-right text-[12px] font-medium">{pct === 100 ? <Icon name="check" size={16} className="ml-auto text-success" /> : `${pct}%`}</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <p className="sr-only" aria-live="polite">
          {uploading ? 'Uploading files' : done ? 'Upload complete' : ''}
        </p>
      </div>
    </Modal>
  )
}
