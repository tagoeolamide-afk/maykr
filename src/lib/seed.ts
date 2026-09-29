import type {
  AppNotification,
  Automation,
  AutomationRun,
  Email,
  FileItem,
  Folder,
  Note,
  Project,
  StorageBucket,
} from './types'

// Deterministic pseudo-random so the demo data is stable between reloads.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}
const rand = rng(42)
const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)]

const DAY = 86_400_000
const NOW = Date.UTC(2026, 8, 29, 9, 0, 0)
const daysAgo = (d: number, h = 0) => new Date(NOW - d * DAY - h * 3_600_000).toISOString()

export const SEED_USER = { name: 'Jenny Wilson', email: 'debbie.baker@example.com' }

export const seedProjects: Project[] = [
  { id: 'sections', name: 'Sections', description: 'Reusable layout sections and page blocks.', createdAt: daysAgo(120) },
  { id: 'code-base', name: 'Code base', description: 'Engineering notes, RFCs and architecture docs.', createdAt: daysAgo(90) },
  { id: 'svn-studios', name: 'SVN Studios', description: 'Client work for SVN Studios.', createdAt: daysAgo(60) },
]

const owner = { id: 'm-owner', name: SEED_USER.name, email: SEED_USER.email, role: 'owner' as const }
const teammates = [
  { id: 'm-1', name: 'Wade Warren', email: 'wade@example.com', role: 'editor' as const },
  { id: 'm-2', name: 'Esther Howard', email: 'esther@example.com', role: 'viewer' as const },
]

type FolderSeed = [id: string, projectId: string, name: string, color: Folder['color'], sizeMb: number, notes: number]

const folderSeeds: FolderSeed[] = [
  ['der', 'svn-studios', 'Design Engineering Research', 'blue', 120, 45],
  ['untitled', 'svn-studios', 'Untitled', 'grey', 10, 25],
  ['dark-matter', 'svn-studios', 'Dark Matter', 'grey', 100, 85],
  ['svn', 'svn-studios', 'SVN', 'grey', 200, 50],
  ['ai-video', 'svn-studios', 'AI Video Structure', 'grey', 150, 10],
  ['building', 'svn-studios', 'Building Project', 'grey', 150, 105],
  ['hero-blocks', 'sections', 'Hero blocks', 'blue', 42, 12],
  ['pricing', 'sections', 'Pricing tables', 'grey', 18, 6],
  ['rfcs', 'code-base', 'RFCs', 'grey', 64, 18],
]

export const seedFolders: Folder[] = folderSeeds.map(([id, projectId, name, color, sizeMb], i) => ({
  id,
  projectId,
  name,
  color,
  sizeMb,
  createdAt: daysAgo(50 - i * 4),
  members: i % 3 === 0 ? [owner, ...teammates] : [owner],
}))

const topics = ['Kickoff', 'Research', 'Interview', 'Sprint review', 'Moodboard', 'Retro', 'Spec', 'Ideas', 'Feedback', 'Checklist', 'Meeting', 'Draft']
const subjects = ['typography scale', 'onboarding flow', 'client call', 'motion study', 'API contract', 'launch plan', 'grid system', 'colour tokens', 'user journey', 'budget', 'timeline', 'asset list']
const tagPool = ['design', 'research', 'client', 'engineering', 'urgent', 'ideas']
const bodies = [
  'Summary of what we agreed today.\n\n- Tighten the spacing on cards\n- Revisit the empty states\n- Share a prototype by Friday',
  'Open questions:\n1. Who owns the final sign-off?\n2. Do we need a dark theme at launch?\n\nNext step: book a review with the team.',
  'Rough notes from the session. The main pain point is finding older files quickly, so search needs to cover notes and file names.',
  'Checklist before handoff:\n- Export assets\n- Write component docs\n- Record a short walkthrough',
]

export const seedNotes: Note[] = folderSeeds.flatMap(([folderId, , , , , count]) =>
  Array.from({ length: count }, (_, i) => {
    const created = daysAgo(Math.floor(rand() * 60) + 1, Math.floor(rand() * 20))
    return {
      id: `n-${folderId}-${i}`,
      folderId,
      title: `${pick(topics)}: ${pick(subjects)}`,
      body: pick(bodies),
      tags: rand() > 0.5 ? [pick(tagPool)] : [],
      pinned: i === 0 && rand() > 0.4,
      createdAt: created,
      updatedAt: created,
    }
  }),
)

export const seedFiles: FileItem[] = [
  { id: 'f-1', folderId: 'der', name: 'Research synthesis.pdf', sizeMb: 12.4, kind: 'document', uploadedAt: daysAgo(3) },
  { id: 'f-2', folderId: 'der', name: 'Interview recordings.mp4', sizeMb: 86.2, kind: 'video', uploadedAt: daysAgo(6) },
  { id: 'f-3', folderId: 'der', name: 'Survey results.xlsx', sizeMb: 3.1, kind: 'sheet', uploadedAt: daysAgo(9) },
  { id: 'f-4', folderId: 'dark-matter', name: 'Moodboard.png', sizeMb: 8.7, kind: 'image', uploadedAt: daysAgo(2) },
  { id: 'f-5', folderId: 'svn', name: 'Brand guidelines.pdf', sizeMb: 24.0, kind: 'document', uploadedAt: daysAgo(12) },
]

const people = [
  { name: 'Wade Warren', email: 'wade@example.com' },
  { name: 'Esther Howard', email: 'esther@example.com' },
  { name: 'Cameron Williamson', email: 'cameron@example.com' },
  { name: 'Brooklyn Simmons', email: 'brooklyn@example.com' },
  { name: 'Leslie Alexander', email: 'leslie@example.com' },
]
const mailSubjects = [
  ['Feedback on the research deck', 'Hi Jenny,\n\nI went through the deck — really strong work. Two small things: slide 4 needs a source, and could we swap the order of sections 2 and 3?\n\nThanks,\nWade'],
  ['Invoice #1042 for September', 'Hello,\n\nPlease find the invoice for September attached. Let me know if anything looks off.\n\nBest,\nEsther'],
  ['Can we move Thursday’s review?', 'Hey,\n\nSomething came up on Thursday. Would Friday at 10:00 work instead?\n\nCameron'],
  ['New files in Dark Matter', 'Hi team,\n\nI uploaded the latest moodboards to Dark Matter. Take a look when you get a chance.\n\nBrooklyn'],
  ['Kickoff agenda', 'Hi all,\n\nHere is the agenda for Monday’s kickoff:\n1. Goals\n2. Timeline\n3. Roles\n\nLeslie'],
  ['Re: Motion study', 'Love the direction. Could we try a slightly slower ease on the page transitions?'],
  ['Weekly summary', 'Here is what happened in your workspace this week: 12 notes created, 5 files uploaded, 3 automations ran.'],
] as const

export const seedEmails: Email[] = [
  ...mailSubjects.map(([subject, body], i): Email => ({
    id: `e-${i}`,
    box: 'inbox',
    from: people[i % people.length],
    to: SEED_USER.email,
    subject,
    body,
    date: daysAgo(Math.floor(i / 2), i * 3),
    read: i > 2,
    starred: i === 1 || i === 4,
  })),
  {
    id: 'e-sent-1',
    box: 'sent',
    from: SEED_USER,
    to: 'wade@example.com',
    subject: 'Re: Feedback on the research deck',
    body: 'Thanks Wade — updated both. New version is in the Design Engineering Research folder.',
    date: daysAgo(0, 2),
    read: true,
    starred: false,
  },
  {
    id: 'e-draft-1',
    box: 'drafts',
    from: SEED_USER,
    to: 'leslie@example.com',
    subject: 'Timeline questions',
    body: 'Hi Leslie,\n\nA couple of questions on the timeline before Monday:',
    date: daysAgo(1),
    read: true,
    starred: false,
  },
]

function runs(count: number, failEvery = 0): AutomationRun[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `r-${Math.floor(rand() * 1e9)}`,
    at: daysAgo(i, Math.floor(rand() * 12)),
    status: failEvery && i % failEvery === 1 ? 'failed' : 'success',
    durationMs: 300 + Math.floor(rand() * 2400),
  }))
}

export const seedAutomations: Automation[] = [
  { id: 'a-1', name: 'Tag new research notes', trigger: 'note-created', action: 'add-tag', target: 'research', enabled: true, createdAt: daysAgo(30), runs: runs(8) },
  { id: 'a-2', name: 'Email me when files are uploaded', trigger: 'file-uploaded', action: 'notify-email', target: SEED_USER.email, enabled: true, createdAt: daysAgo(21), runs: runs(6, 3) },
  { id: 'a-3', name: 'Daily stand-up note', trigger: 'daily', action: 'create-note', target: 'Stand-up', enabled: false, createdAt: daysAgo(14), runs: runs(4) },
]

export const seedNotifications: AppNotification[] = [
  { id: 'nt-1', kind: 'share', title: 'Wade Warren shared a folder', body: 'You now have edit access to “Design Engineering Research”.', at: daysAgo(0, 1), read: false, href: '/projects/svn-studios/folders/der' },
  { id: 'nt-2', kind: 'automation', title: 'Automation failed', body: '“Email me when files are uploaded” could not send an email.', at: daysAgo(0, 5), read: false, href: '/automation/a-2' },
  { id: 'nt-3', kind: 'email', title: 'New email from Cameron', body: 'Can we move Thursday’s review?', at: daysAgo(1), read: false, href: '/emails/inbox/e-2' },
  { id: 'nt-4', kind: 'system', title: 'Storage at 50%', body: 'You have used half of your document storage.', at: daysAgo(3), read: true },
]

export const seedStorage: StorageBucket[] = [
  { id: 'documents', label: 'Documents', usedGb: 59, quotaGb: 117.3 },
  { id: 'videos', label: 'Videos', usedGb: 159, quotaGb: 316.2 },
]

export { NOW as SEED_NOW }
