import { useCallback } from 'react'
import { toast } from '@/components/ui/toast'
import { signOut } from '@/services/auth'

/** Signs out; the route guard then sends the user to /login. */
export function useSignOut() {
  return useCallback(async () => {
    try {
      await signOut()
    } catch {
      toast.add({ type: 'error', title: "Couldn't sign out", description: 'Check your connection and try again.' })
    }
  }, [])
}
