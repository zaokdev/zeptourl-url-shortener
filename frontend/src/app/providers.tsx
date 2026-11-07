import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from './query-client'

// Authenticator.Provider lives in the lazy auth-layout route, and the Amplify
// ThemeProvider only around <Authenticator> (pages/Login), so neither Amplify's
// code nor its styling reaches the landing page.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster>
          <BrowserRouter>{children}</BrowserRouter>
        </Toaster>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
