/// <reference types="vite/client" />

// Only services/config reads these. Every value may be missing at runtime,
// which config.service reports as a ConfigError instead of crashing.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_USER_POOL_ID?: string
  readonly VITE_USER_POOL_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
