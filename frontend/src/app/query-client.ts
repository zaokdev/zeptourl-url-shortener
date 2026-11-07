import { QueryClient } from '@tanstack/react-query'

// Cache clearing on sign-out is registered in auth-layout.tsx, next to Amplify.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
})
