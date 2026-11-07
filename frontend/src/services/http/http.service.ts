// The only module that calls fetch. Adds the base URL and the Bearer token, and
// turns every failure into an ApiError with a message the UI can show as-is.
import { getAccessToken, signOut } from '@/services/auth'
import { getConfig } from '@/services/config'
import { ApiError } from './api-error'

export const MESSAGES = {
  network: "Can't reach ZeptoURL. Check your connection and try again.",
  sessionEnded: 'Your session has ended. Log in again.',
  server: 'ZeptoURL had a problem on its side. Try again in a moment.',
} as const

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  /** Sent as JSON. */
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const token = await getAccessToken()
  if (!token) return endSession()

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${getConfig().apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    // Cancelled on purpose (e.g. TanStack Query unmounting): let it through untouched.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, MESSAGES.network)
  }

  if (response.status === 401) return endSession()
  if (!response.ok) throw new ApiError(response.status, await errorMessage(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Signs out (the route guard then shows the login page) and fails the request. */
async function endSession(): Promise<never> {
  try {
    await signOut()
  } catch {
    // Already signed out, or offline: the 401 below still ends the request.
  }
  throw new ApiError(401, MESSAGES.sessionEnded)
}

/** 4xx: the backend's own `{ message }`. 5xx: a generic message (it's not the user's fault). */
async function errorMessage(response: Response): Promise<string> {
  if (response.status >= 500) return MESSAGES.server
  try {
    const data: unknown = await response.json()
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message) {
      return data.message
    }
  } catch {
    // Not JSON: fall through.
  }
  return `The request failed (${response.status}). Try again.`
}
