import { useAuthenticator } from '@aws-amplify/ui-react'
import { Button } from '@/components/ui/button'
import { SkipLink } from '@/components/SkipLink'
import { Wordmark } from '@/components/Wordmark'
import { useSignOut } from '@/hooks/useSignOut'

export function AppHeader() {
  const { user } = useAuthenticator((context) => [context.user])
  const signOut = useSignOut()
  const email = user?.signInDetails?.loginId

  return (
    <header className="border-b">
      <SkipLink />
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
        <Wordmark to="/dashboard" />
        <div className="flex min-w-0 items-center gap-3">
          {email && <span className="hidden truncate text-sm text-muted-foreground sm:inline">{email}</span>}
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
