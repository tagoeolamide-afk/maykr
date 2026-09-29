import { useState, type FormEvent, type ReactNode } from 'react'
import avatar from '../../assets/avatar.png'
import { Icon, type IconName } from '../../components/Icon'
import { StorageCards } from '../../components/shell/InfoPanel'
import { Main } from '../../components/shell/AppShell'
import { PageHeader } from '../../components/shell/PageHeader'
import { Button, Card, cx, Switch, TextField } from '../../components/ui/primitives'
import { isEmail } from '../../lib/format'
import { useDocumentTitle } from '../../lib/hooks'
import { Link } from '../../lib/router'
import { useStore } from '../../lib/store'
import type { NotificationPrefs, ThemePref } from '../../lib/types'
import { openModal, toast } from '../../lib/ui-store'

const tabs: { id: string; label: string; icon: IconName }[] = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'notifications', label: 'Notifications', icon: 'notification-01' },
  { id: 'workspace', label: 'Workspace', icon: 'building' },
  { id: 'security', label: 'Security', icon: 'lock' },
]

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-semibold">{title}</h2>
        {description && <p className="text-[13px] text-fg-2">{description}</p>}
      </div>
      {children}
    </Card>
  )
}

export function SettingsView({ tab: tabParam }: { tab?: string }) {
  const tab = tabs.find((t) => t.id === tabParam)?.id ?? 'profile'
  const label = tabs.find((t) => t.id === tab)!.label
  useDocumentTitle(`${label} settings`)

  return (
    <Main>
      <PageHeader crumbs={[{ label: 'Settings', to: '/settings', icon: 'settings-01' }, { label }]} backTo="/home" title="Settings" />
      <div className="flex flex-col gap-6 px-4 pt-2 pb-10 md:flex-row">
        <nav aria-label="Settings sections" className="md:w-52 md:shrink-0">
          <ul className="flex gap-1 overflow-x-auto overflow-y-hidden md:flex-col md:overflow-visible">
            {tabs.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/settings/${t.id}`}
                  aria-current={t.id === tab ? 'page' : undefined}
                  className={cx(
                    'tap flex items-center gap-2 rounded-[8px] px-3 py-2 text-[14px] font-medium whitespace-nowrap',
                    t.id === tab ? 'bg-active text-fg' : 'text-fg-2 hover:bg-hover hover:text-fg',
                  )}
                >
                  <Icon name={t.icon} size={18} />
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex max-w-2xl min-w-0 flex-1 flex-col gap-6">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'workspace' && <WorkspaceTab />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </Main>
  )
}

function ProfileTab() {
  const user = useStore((s) => s.user)
  const updateProfile = useStore((s) => s.updateProfile)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const save = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Enter your name'
    if (!isEmail(email)) next.email = 'Enter a valid email address'
    setErrors(next)
    if (Object.keys(next).length) return
    updateProfile({ name: name.trim(), email: email.trim() })
    toast('Profile saved', { tone: 'success' })
  }

  return (
    <Section title="Profile" description="This is how you appear to people you share with.">
      <div className="flex items-center gap-4">
        <img src={avatar} alt="" width={56} height={56} className="size-14 rounded-full" />
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold">{user?.name}</span>
          <span className="text-[12px] text-fg-2">{user?.email}</span>
        </div>
      </div>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" />
        <Button type="submit" variant="primary" size="md" className="self-start">
          Save changes
        </Button>
      </form>
    </Section>
  )
}

function AppearanceTab() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const options: { value: ThemePref; label: string; icon: IconName; description: string }[] = [
    { value: 'system', label: 'System', icon: 'computer', description: 'Match your device' },
    { value: 'light', label: 'Light', icon: 'sun', description: 'Always light' },
    { value: 'dark', label: 'Dark', icon: 'moon', description: 'Always dark' },
  ]
  return (
    <Section title="Appearance" description="Choose how Mayker looks. Both themes meet WCAG 2.2 AA contrast.">
      <fieldset>
        <legend className="sr-only">Theme</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((o) => (
            <label
              key={o.value}
              className={cx(
                'flex cursor-pointer flex-col gap-3 rounded-[12px] border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
                theme === o.value ? 'border-fg bg-hover' : 'border-line hover:bg-hover',
              )}
            >
              <input type="radio" name="theme" value={o.value} checked={theme === o.value} onChange={() => setTheme(o.value)} className="sr-only" />
              <span className="flex items-center justify-between">
                <Icon name={o.icon} size={22} />
                {theme === o.value && <Icon name="check-circle" size={18} />}
              </span>
              <span className="flex flex-col">
                <span className="text-[14px] font-semibold">{o.label}</span>
                <span className="text-[12px] text-fg-2">{o.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-[12px] text-fg-2">Animations are reduced automatically when your device’s “reduce motion” setting is on.</p>
    </Section>
  )
}

function NotificationsTab() {
  const prefs = useStore((s) => s.notificationPrefs)
  const setPref = useStore((s) => s.setNotificationPref)
  const rows: { key: keyof NotificationPrefs; label: string; description: string }[] = [
    { key: 'mentions', label: 'Mentions', description: 'When someone mentions you in a note.' },
    { key: 'shares', label: 'Shares', description: 'When a folder is shared with you.' },
    { key: 'automationFailures', label: 'Automation failures', description: 'When an automation can’t finish.' },
    { key: 'emailDigest', label: 'Weekly email digest', description: 'A summary of your workspace every Monday.' },
    { key: 'productUpdates', label: 'Product updates', description: 'News about new features.' },
  ]
  return (
    <Section title="Notifications" description="Choose what you want to hear about.">
      <div className="flex flex-col divide-y divide-line">
        {rows.map((r) => (
          <div key={r.key} className="py-3 first:pt-0 last:pb-0">
            <Switch label={r.label} description={r.description} checked={prefs[r.key]} onCheckedChange={(v) => setPref(r.key, v)} />
          </div>
        ))}
      </div>
    </Section>
  )
}

function WorkspaceTab() {
  const workspaceName = useStore((s) => s.workspaceName)
  const setWorkspaceName = useStore((s) => s.setWorkspaceName)
  const resetDemo = useStore((s) => s.resetDemo)
  const [name, setName] = useState(workspaceName)
  const [error, setError] = useState('')

  return (
    <>
      <Section title="Workspace">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return setError('Enter a workspace name')
            setWorkspaceName(name.trim())
            toast('Workspace updated', { tone: 'success' })
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <TextField label="Workspace name" value={name} onChange={(e) => (setName(e.target.value), setError(''))} error={error} />
          <Button type="submit" variant="primary" size="md" className="self-start">
            Save
          </Button>
        </form>
      </Section>
      <Section title="Storage" description="Upgrade your plan when you need more space.">
        <StorageCards />
      </Section>
      <Section title="Demo data" description="This dashboard stores everything in your browser. Use these to review empty and filled states.">
        <div className="flex flex-wrap gap-2">
          <Button
            icon="refresh"
            onClick={() => {
              resetDemo()
              toast('Demo data restored', { tone: 'success' })
            }}
          >
            Reset demo data
          </Button>
          <Button variant="danger" icon="delete" onClick={() => openModal({ type: 'clearData' })}>
            Delete all data
          </Button>
        </div>
        <p className="text-[12px] text-fg-2">
          Tip: add <code className="rounded bg-surface-2 px-1">?state=loading</code>, <code className="rounded bg-surface-2 px-1">?state=empty</code> or{' '}
          <code className="rounded bg-surface-2 px-1">?state=error</code> to any page address to preview that state.
        </p>
      </Section>
    </>
  )
}

function SecurityTab() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!current) errs.current = 'Enter your current password'
    if (next.length < 8) errs.next = 'Use at least 8 characters'
    if (confirm !== next) errs.confirm = 'Passwords don’t match'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setCurrent('')
    setNext('')
    setConfirm('')
    toast('Password updated', { tone: 'success' })
  }

  return (
    <>
      <Section title="Change password">
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <TextField label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
          <TextField label="New password" type="password" autoComplete="new-password" hint="At least 8 characters" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} />
          <TextField label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
          <Button type="submit" variant="primary" size="md" className="self-start">
            Update password
          </Button>
        </form>
      </Section>
    </>
  )
}
