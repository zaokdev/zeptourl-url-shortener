import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken, signOut } from '@/services/auth'
import { ApiError } from './api-error'
import { MESSAGES, request } from './http.service'

vi.mock('@/services/auth', () => ({
  getAccessToken: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/services/config', () => ({
  getConfig: () => ({ apiUrl: 'https://api.test' }),
}))

const fetchMock = vi.fn<typeof fetch>()

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Resolves with the rejection so assertions can inspect it. */
async function failure(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => {
      throw new Error('expected the request to fail')
    },
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.mocked(getAccessToken).mockResolvedValue('token-123')
  vi.mocked(signOut).mockResolvedValue()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('request', () => {
  it('sends the Bearer token and a JSON body, and returns the parsed response', async () => {
    fetchMock.mockResolvedValue(json(201, { code: 'Ab3kQ9z', url: 'https://example.com/' }))

    const result = await request('/links', { method: 'POST', body: { url: 'https://example.com/' } })

    expect(result).toEqual({ code: 'Ab3kQ9z', url: 'https://example.com/' })
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/links', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-123', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/' }),
      signal: undefined,
    })
  })

  it('sends no Content-Type without a body, and passes the abort signal', async () => {
    fetchMock.mockResolvedValue(json(200, { items: [] }))
    const controller = new AbortController()

    await request('/links', { signal: controller.signal })

    const [, init] = fetchMock.mock.calls[0]!
    expect(init?.method).toBe('GET')
    expect(init?.headers).toEqual({ Authorization: 'Bearer token-123' })
    expect(init?.signal).toBe(controller.signal)
  })

  it('returns undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(request('/links/Ab3kQ9z', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('signs out without calling the API when there is no token', async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null)

    const error = await failure(request('/links'))

    expect(error.status).toBe(401)
    expect(error.message).toBe(MESSAGES.sessionEnded)
    expect(signOut).toHaveBeenCalledOnce()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('signs out on a 401 from the API', async () => {
    fetchMock.mockResolvedValue(json(401, { message: 'Unauthorized' }))

    const error = await failure(request('/links'))

    expect(error).toMatchObject({ status: 401, message: MESSAGES.sessionEnded })
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('still fails with 401 when signing out itself fails', async () => {
    fetchMock.mockResolvedValue(json(401, {}))
    vi.mocked(signOut).mockRejectedValue(new Error('offline'))

    expect(await failure(request('/links'))).toMatchObject({ status: 401 })
  })

  it("shows the backend's message for a 4xx", async () => {
    fetchMock.mockResolvedValue(json(400, { message: 'Only http and https URLs are allowed' }))

    expect(await failure(request('/links', { method: 'POST', body: {} }))).toMatchObject({
      status: 400,
      message: 'Only http and https URLs are allowed',
    })
  })

  it('falls back to a generic 4xx message when the body is not usable JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Not Found', { status: 404 }))

    expect(await failure(request('/links'))).toMatchObject({
      status: 404,
      message: 'The request failed (404). Try again.',
    })
  })

  it('hides the server message for a 5xx', async () => {
    fetchMock.mockResolvedValue(json(500, { message: 'Internal Server Error' }))

    expect(await failure(request('/links'))).toMatchObject({ status: 500, message: MESSAGES.server })
  })

  it('turns a network failure into a friendly status-0 error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    expect(await failure(request('/links'))).toMatchObject({ status: 0, message: MESSAGES.network })
  })

  it('lets an abort pass through untouched', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError')
    fetchMock.mockRejectedValue(abort)

    await expect(request('/links')).rejects.toBe(abort)
  })
})
