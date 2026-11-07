import { describe, expect, it } from 'vitest'
import { formatDateTime, formatRelativeTime } from './relative-time'

const now = Date.parse('2026-11-03T12:00:00.000Z')
const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString()

describe('formatRelativeTime', () => {
  it.each([
    [ago(30), 'just now'],
    [ago(5 * 60), '5 minutes ago'],
    [ago(3 * 60 * 60), '3 hours ago'],
    [ago(24 * 60 * 60), 'yesterday'],
    [ago(9 * 24 * 60 * 60), 'last week'],
    [ago(400 * 24 * 60 * 60), 'last year'],
  ])('formats %s as %j', (iso, expected) => {
    expect(formatRelativeTime(iso, now, 'en')).toBe(expected)
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatRelativeTime('not a date', now, 'en')).toBe('')
  })

  it('formats in English by default, whatever the browser language', () => {
    expect(formatRelativeTime(ago(3 * 60 * 60), now)).toBe('3 hours ago')
  })
})

describe('formatDateTime', () => {
  it('formats in English by default', () => {
    expect(formatDateTime('2026-11-03T14:15:00.000Z')).toMatch(/^Nov 3, 2026/)
  })
})
