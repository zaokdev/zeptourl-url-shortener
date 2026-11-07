// URL rules for links. validateUrl mirrors the create Lambda exactly, so the
// browser rejects what the backend would reject, with clearer messages.
import { getConfig } from '@/services/config'

export const MAX_URL_LENGTH = 2048

export const URL_MESSAGES = {
  empty: 'Paste a link to shorten.',
  tooLong: 'Links can be up to 2,048 characters.',
  protocol: 'Only http and https links can be shortened.',
  invalid: 'Enter a full link, like https://example.com/page.',
} as const

export type UrlCheck = { ok: true; url: string } | { ok: false; message: string }

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i
// Schemes written without "//". Kept as-is so validateUrl can reject them clearly,
// instead of becoming e.g. https://mailto:… after the https:// prefix.
const OTHER_SCHEME = /^(mailto|javascript|data|vbscript|file|tel|sms|blob|about):/i

/** Trims the input and adds https:// when it has no scheme ("example.com/x"). */
export function normalizeInput(input: string): string {
  const trimmed = input.trim()
  if (!trimmed || HAS_SCHEME.test(trimmed) || OTHER_SCHEME.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/** The backend's rules: non-empty, ≤ 2048 characters, parseable, http(s) only. */
export function validateUrl(candidate: string): UrlCheck {
  if (!candidate) return { ok: false, message: URL_MESSAGES.empty }
  if (candidate.length > MAX_URL_LENGTH) return { ok: false, message: URL_MESSAGES.tooLong }

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return { ok: false, message: URL_MESSAGES.invalid }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, message: URL_MESSAGES.protocol }
  }
  // The backend stores href; percent-encoding can make it longer than the input.
  if (parsed.href.length > MAX_URL_LENGTH) return { ok: false, message: URL_MESSAGES.tooLong }

  return { ok: true, url: parsed.href }
}

/**
 * The full short link people share, e.g. https://abc.execute-api…/Ab3kQ9z.
 * The API that serves /links also serves the public redirect GET /{code}.
 */
export function shortLink(code: string, base: string = getConfig().apiUrl): string {
  return `${base.replace(/\/+$/, '')}/${code}`
}

/** The URL without its protocol (and without a bare trailing slash), for display. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^([^/?#]+)\/$/, '$1')
}
