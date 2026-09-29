import { lazy, Suspense } from 'react'
import { Tooltip } from 'radix-ui'
import { AppShell } from './components/shell/AppShell'
import { Toaster } from './components/shell/Toaster'
import { AutomationDetail, AutomationList } from './features/automation/AutomationViews'
import { EmailsView } from './features/emails/EmailsView'
import { HomeView } from './features/home/HomeView'
import { NotesView } from './features/notes/NotesView'
import { NotFound } from './features/NotFound'
import { FolderView, ProjectsIndex, ProjectView } from './features/projects/ProjectsViews'
import { SettingsView } from './features/settings/SettingsView'
import { useApplyTheme } from './lib/hooks'
import { useRoute } from './lib/router'

const ReportsView = lazy(() => import('./features/reports/ReportsView').then((m) => ({ default: m.ReportsView })))

function View() {
  const { segments: s } = useRoute()
  switch (s[0] ?? 'home') {
    case 'home':
      return s.length === 1 ? <HomeView /> : <NotFound />
    case 'projects':
      if (!s[1]) return <ProjectsIndex />
      if (s[2] === 'folders' && s[3]) return <FolderView key={s[3]} projectId={s[1]} folderId={s[3]} />
      return <ProjectView key={s[1]} projectId={s[1]} />
    case 'notes':
      return <NotesView noteId={s[1]} />
    case 'reports':
      return (
        <Suspense fallback={<div role="status" className="flex-1 p-8 text-[14px] text-fg-2">Loading reports…</div>}>
          <ReportsView />
        </Suspense>
      )
    case 'emails':
      return <EmailsView box={s[1]} emailId={s[2]} />
    case 'automation':
      return s[1] ? <AutomationDetail key={s[1]} id={s[1]} /> : <AutomationList />
    case 'settings':
      return <SettingsView tab={s[1]} />
    default:
      return <NotFound />
  }
}

export default function App() {
  useApplyTheme()

  // Login is switched off for now; the screen lives in features/auth/LoginView.tsx.
  return (
    <Tooltip.Provider>
      <AppShell>
        <View />
      </AppShell>
      <Toaster />
    </Tooltip.Provider>
  )
}
