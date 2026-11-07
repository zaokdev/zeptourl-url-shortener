import { Authenticator } from '@aws-amplify/ui-react'
import { Outlet } from 'react-router'
import { configureAuth, onSignedOut } from '@/services/auth'
import { queryClient } from './query-client'

// Loaded lazily for /login and /dashboard only, so Amplify (~half of the
// JavaScript) never ships with the landing and 404 pages.
// main.tsx has already validated the config, so this can't throw ConfigError.
configureAuth()

// The next person to sign in on this browser never sees the previous user's
// cached links.
onSignedOut(() => queryClient.clear())

export default function AuthLayout() {
  return (
    <Authenticator.Provider>
      <Outlet />
    </Authenticator.Provider>
  )
}
