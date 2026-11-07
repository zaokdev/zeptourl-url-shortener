import { request } from '@/services/http'
import type { CreateLinkResponse, Link, ListLinksResponse } from './links.types'

/** The signed-in user's links, newest first. */
export async function listLinks(signal?: AbortSignal): Promise<Link[]> {
  const { items } = await request<ListLinksResponse>('/links', { signal })
  return items.map(({ code, url, createdAt }) => ({ code, url, createdAt }))
}

/** Creates a short link. `url` should already have passed validateUrl. */
export function createLink(url: string): Promise<CreateLinkResponse> {
  return request<CreateLinkResponse>('/links', { method: 'POST', body: { url } })
}

/** Deletes a link. Every failure, including 404 (missing, or not yours), reaches the caller. */
export function deleteLink(code: string): Promise<void> {
  return request<void>(`/links/${encodeURIComponent(code)}`, { method: 'DELETE' })
}
