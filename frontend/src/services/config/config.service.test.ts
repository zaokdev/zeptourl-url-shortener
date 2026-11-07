import { describe, expect, it } from 'vitest'
import { ConfigError, readConfig } from './config.service'

const complete: ImportMetaEnv = {
  VITE_API_URL: ' https://api.test// ',
  VITE_USER_POOL_ID: 'us-east-1_AbCdEfGhI',
  VITE_USER_POOL_CLIENT_ID: 'client123',
} as ImportMetaEnv

describe('readConfig', () => {
  it('trims values and strips trailing slashes from the API URL', () => {
    expect(readConfig(complete)).toEqual({
      apiUrl: 'https://api.test',
      userPoolId: 'us-east-1_AbCdEfGhI',
      userPoolClientId: 'client123',
    })
  })

  it('returns a frozen object', () => {
    expect(Object.isFrozen(readConfig(complete))).toBe(true)
  })

  it('lists every missing or blank variable by name', () => {
    const env = { ...complete, VITE_API_URL: '   ', VITE_USER_POOL_ID: undefined } as ImportMetaEnv

    expect(() => readConfig(env)).toThrow(ConfigError)
    try {
      readConfig(env)
    } catch (error) {
      expect((error as ConfigError).missing).toEqual(['VITE_API_URL', 'VITE_USER_POOL_ID'])
    }
  })
})
