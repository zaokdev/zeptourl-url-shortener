// The UI is English-only (<html lang="en">), so dates are formatted in English
// too. Without an explicit locale, Intl follows the browser's language and mixes
// languages on the page (e.g. "hace 2 horas" next to "Copy").
export const APP_LOCALE = 'en'

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
]

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago"… */
export function formatRelativeTime(iso: string, now: number = Date.now(), locale: string = APP_LOCALE): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''

  const seconds = Math.round((then - now) / 1000)
  if (Math.abs(seconds) < 60) return 'just now'

  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

/** Full date and time for tooltips and titles, e.g. "Nov 3, 2026, 2:15 PM". */
export function formatDateTime(iso: string, locale: string = APP_LOCALE): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
