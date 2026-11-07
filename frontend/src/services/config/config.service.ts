// The only module that reads import.meta.env. Everything else asks getConfig().

export interface AppConfig {
  /**
   * The API Gateway endpoint (no trailing slash). It serves both the /links API
   * and the public redirect GET /{code}, so short links are built from it too.
   */
  readonly apiUrl: string
  readonly userPoolId: string
  readonly userPoolClientId: string
}

/** Thrown when required environment variables are missing; lists their names. */
export class ConfigError extends Error {
  readonly missing: readonly string[]

  constructor(missing: readonly string[]) {
    super(`Missing environment variables: ${missing.join(', ')}`)
    this.name = 'ConfigError'
    this.missing = missing
  }
}

const ENV_KEYS = {
  apiUrl: 'VITE_API_URL',
  userPoolId: 'VITE_USER_POOL_ID',
  userPoolClientId: 'VITE_USER_POOL_CLIENT_ID',
} as const satisfies Record<keyof AppConfig, keyof ImportMetaEnv>

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '')

/** Reads and validates the config from an env object. Pure, so it's easy to test. */
export function readConfig(env: ImportMetaEnv): AppConfig {
  const read = (key: keyof AppConfig) => env[ENV_KEYS[key]]?.trim() ?? ''

  const values = {
    apiUrl: stripTrailingSlashes(read('apiUrl')),
    userPoolId: read('userPoolId'),
    userPoolClientId: read('userPoolClientId'),
  }

  const missing = (Object.keys(ENV_KEYS) as (keyof AppConfig)[])
    .filter((key) => !values[key])
    .map((key) => ENV_KEYS[key])

  if (missing.length > 0) throw new ConfigError(missing)

  return Object.freeze(values)
}

let cached: AppConfig | undefined

/** The app config, read once. Throws ConfigError if anything is missing. */
export function getConfig(): AppConfig {
  cached ??= readConfig(import.meta.env)
  return cached
}
