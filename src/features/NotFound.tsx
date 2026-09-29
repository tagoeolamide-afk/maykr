import { Main } from '../components/shell/AppShell'
import { Button, EmptyState } from '../components/ui/primitives'
import { useDocumentTitle } from '../lib/hooks'
import { navigate } from '../lib/router'

export function NotFound({ what = 'page' }: { what?: string }) {
  useDocumentTitle('Not found')
  return (
    <Main>
      <div className="flex flex-1 items-center justify-center px-4">
        <div>
          <h1 tabIndex={-1} data-page-title className="sr-only">
            {`This ${what} doesn’t exist`}
          </h1>
          <EmptyState
            icon="search-02"
            title={`We can’t find that ${what}`}
            description="It may have been moved or deleted, or the link might be wrong."
            action={
              <Button variant="primary" size="md" onClick={() => navigate('/home')}>
                Go to Home
              </Button>
            }
            secondary={
              <Button size="md" onClick={() => window.history.back()}>
                Go back
              </Button>
            }
          />
        </div>
      </div>
    </Main>
  )
}
