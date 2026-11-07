import { useAuthenticator } from '@aws-amplify/ui-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from '@/components/FullPageSpinner'

/** Renders child routes only for signed-in users; everyone else goes to /login. */
export default function ProtectedRoute() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus])
  const location = useLocation()

  if (authStatus === 'configuring') return <FullPageSpinner />
  if (authStatus !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
