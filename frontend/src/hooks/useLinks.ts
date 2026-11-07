import { useAuthenticator } from '@aws-amplify/ui-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLink, deleteLink, listLinks, type Link } from '@/services/links'

// GET /links reads a DynamoDB secondary index, which is eventually consistent.
// Refetching right after a create or delete can briefly miss the new link or
// bring the deleted one back, so mutations update the cache directly and the
// next natural refetch (window focus, staleTime) reconciles with the server.

// One key for the signed-in user's links. The whole cache is cleared on sign-out
// (app/auth-layout.tsx), so the next user never sees these.
const LINKS_KEY = ['links'] as const

export function useLinks() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus])
  return useQuery({
    queryKey: LINKS_KEY,
    queryFn: ({ signal }) => listLinks(signal),
    enabled: authStatus === 'authenticated',
  })
}

export function useCreateLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (url: string) => createLink(url),
    // Add exactly what the API returned. Until POST /links returns createdAt
    // (PLAN.md, Backend gaps B1), the new ticket shows no time.
    onSuccess: (created) => {
      queryClient.setQueryData<Link[]>(LINKS_KEY, (links = []) => [
        created,
        ...links.filter((l) => l.code !== created.code),
      ])
    },
  })
}

export function useDeleteLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => deleteLink(code),
    // Remove the row immediately; put it back if the request fails.
    onMutate: async (code) => {
      await queryClient.cancelQueries({ queryKey: LINKS_KEY })
      const previous = queryClient.getQueryData<Link[]>(LINKS_KEY)
      queryClient.setQueryData<Link[]>(LINKS_KEY, (links) => links?.filter((l) => l.code !== code))
      return { previous }
    },
    onError: (_error, _code, result) => {
      if (result?.previous) queryClient.setQueryData(LINKS_KEY, result.previous)
    },
  })
}
