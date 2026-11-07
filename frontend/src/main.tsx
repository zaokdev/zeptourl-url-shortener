import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// index.css also imports Amplify's layered CSS, in a fixed cascade order.
import './index.css'
import { Providers } from '@/app/providers'
import { AppRoutes } from '@/app/routes'
import { ConfigErrorScreen } from '@/components/ConfigErrorScreen'
import { ConfigError, getConfig } from '@/services/config'

const root = createRoot(document.getElementById('root')!)

try {
  // Validate the env up front; Amplify itself is configured in the lazy auth layout.
  getConfig()
  root.render(
    <StrictMode>
      <Providers>
        <AppRoutes />
      </Providers>
    </StrictMode>,
  )
} catch (error) {
  if (!(error instanceof ConfigError)) throw error
  root.render(
    <StrictMode>
      <ConfigErrorScreen missing={error.missing} />
    </StrictMode>,
  )
}
