import type { IconName } from '../../components/Icon'
import type { ActionId, TriggerId } from '../../lib/types'

export const triggers: Record<TriggerId, { label: string; description: string; icon: IconName }> = {
  'file-uploaded': { label: 'A file is uploaded', description: 'Runs when anyone uploads a file to a folder.', icon: 'upload' },
  'note-created': { label: 'A note is created', description: 'Runs when a new note is added anywhere.', icon: 'pencil' },
  daily: { label: 'Every day at 9:00', description: 'Runs once a day on a schedule.', icon: 'calendar' },
  'email-received': { label: 'An email arrives', description: 'Runs when a new email lands in your inbox.', icon: 'mails' },
}

export const actions: Record<ActionId, { label: string; description: string; icon: IconName; targetLabel: string; targetPlaceholder: string }> = {
  'notify-email': { label: 'Send me an email', description: 'Get an email with a summary.', icon: 'sent', targetLabel: 'Send to', targetPlaceholder: 'name@company.com' },
  'add-tag': { label: 'Add a tag', description: 'Tag the note or file automatically.', icon: 'tag', targetLabel: 'Tag', targetPlaceholder: 'e.g. research' },
  'move-to-folder': { label: 'Move to a folder', description: 'File it into a folder of your choice.', icon: 'move', targetLabel: 'Folder name', targetPlaceholder: 'e.g. Inbox' },
  'create-note': { label: 'Create a note', description: 'Start a new note from a template.', icon: 'file-01', targetLabel: 'Note title', targetPlaceholder: 'e.g. Stand-up' },
}

export const templates = {
  tag: { name: 'Tag new research notes', trigger: 'note-created', action: 'add-tag', target: 'research' },
  notify: { name: 'Email me when files are uploaded', trigger: 'file-uploaded', action: 'notify-email', target: '' },
  daily: { name: 'Daily stand-up note', trigger: 'daily', action: 'create-note', target: 'Stand-up' },
} as const satisfies Record<string, { name: string; trigger: TriggerId; action: ActionId; target: string }>

export function describe(trigger: TriggerId, action: ActionId, target: string) {
  const t = triggers[trigger].label
  const a = actions[action].label
  return `When ${t.charAt(0).toLowerCase()}${t.slice(1)}, ${a.charAt(0).toLowerCase()}${a.slice(1)}${target ? ` (${target})` : ''}`
}
