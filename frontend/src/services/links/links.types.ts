/** A short link as the UI uses it: only what the API returned, nothing filled in. */
export interface Link {
  /** 7 characters from [0-9A-Za-z]. */
  readonly code: string
  /** The original URL (normalized by the backend with new URL().href). */
  readonly url: string
  /**
   * ISO 8601 timestamp. Missing on a link that was just created, because
   * POST /links doesn't return it yet (PLAN.md, Backend gaps B1).
   */
  readonly createdAt?: string
}

/** GET /links (items arrive newest first). */
export interface ListLinksResponse {
  items: Array<Link & { ownerId?: string }>
}

/** POST /links (201). Today the backend returns only code and url (Backend gaps B1). */
export interface CreateLinkResponse {
  code: string
  url: string
  createdAt?: string
}
