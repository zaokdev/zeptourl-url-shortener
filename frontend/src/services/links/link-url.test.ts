import { describe, expect, it, vi } from 'vitest'
import { displayUrl, MAX_URL_LENGTH, normalizeInput, shortLink, URL_MESSAGES, validateUrl } from './link-url'

vi.mock('@/services/config', () => ({
  getConfig: () => ({ apiUrl: 'https://s.test' }),
}))

describe('normalizeInput', () => {
  it.each([
    ['  example.com/x  ', 'https://example.com/x'],
    ['localhost:3000/x', 'https://localhost:3000/x'],
    ['example.com:8080/path', 'https://example.com:8080/path'],
    ['http://a.com', 'http://a.com'],
    ['HTTPS://A.com/x', 'HTTPS://A.com/x'],
    ['ftp://files.example.com', 'ftp://files.example.com'],
    // Schemes without "//" stay as they are, so validateUrl can reject them clearly.
    ['mailto:someone@example.com', 'mailto:someone@example.com'],
    ['javascript:alert(1)', 'javascript:alert(1)'],
    ['', ''],
    ['   ', ''],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeInput(input)).toBe(expected)
  })
})

describe('validateUrl (mirrors the create Lambda)', () => {
  it('rejects an empty value', () => {
    expect(validateUrl('')).toEqual({ ok: false, message: URL_MESSAGES.empty })
  })

  it('accepts exactly 2,048 characters and rejects 2,049', () => {
    const base = 'https://example.com/'
    const atLimit = base + 'a'.repeat(MAX_URL_LENGTH - base.length)
    expect(validateUrl(atLimit)).toEqual({ ok: true, url: atLimit })
    expect(validateUrl(atLimit + 'a')).toEqual({ ok: false, message: URL_MESSAGES.tooLong })
  })

  it('rejects a link that only grows past the limit once percent-encoded', () => {
    const candidate = 'https://example.com/' + 'a b'.repeat(500) // 1,520 characters, 2,520 encoded
    expect(candidate.length).toBeLessThanOrEqual(MAX_URL_LENGTH)
    expect(validateUrl(candidate)).toEqual({ ok: false, message: URL_MESSAGES.tooLong })
  })

  it.each(['ftp://example.com/file', 'javascript:alert(1)', 'mailto:someone@example.com', 'data:text/plain,hi'])(
    'rejects the non-http(s) URL %j',
    (candidate) => {
      expect(validateUrl(candidate)).toEqual({ ok: false, message: URL_MESSAGES.protocol })
    },
  )

  it.each(['https://', 'http://exa mple.com', 'not a url'])('rejects the unparseable %j', (candidate) => {
    expect(validateUrl(candidate)).toEqual({ ok: false, message: URL_MESSAGES.invalid })
  })

  it('returns the normalized href, like the backend stores', () => {
    expect(validateUrl('https://Example.COM/a b?q=1')).toEqual({ ok: true, url: 'https://example.com/a%20b?q=1' })
    expect(validateUrl('http://example.com')).toEqual({ ok: true, url: 'http://example.com/' })
  })
})

describe('shortLink', () => {
  it('joins the base and the code without a double slash', () => {
    expect(shortLink('Ab3kQ9z', 'https://s.test/')).toBe('https://s.test/Ab3kQ9z')
    expect(shortLink('Ab3kQ9z', 'https://s.test')).toBe('https://s.test/Ab3kQ9z')
  })

  it('defaults to the API endpoint (which serves the redirect)', () => {
    expect(shortLink('Ab3kQ9z')).toBe('https://s.test/Ab3kQ9z')
  })
})

describe('displayUrl', () => {
  it.each([
    ['https://example.com/', 'example.com'],
    ['https://example.com/a/', 'example.com/a/'],
    ['http://x.com/?q=1', 'x.com/?q=1'],
    ['https://docs.example.org/guides/start', 'docs.example.org/guides/start'],
  ])('shows %j as %j', (url, expected) => {
    expect(displayUrl(url)).toBe(expected)
  })
})
