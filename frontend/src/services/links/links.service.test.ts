import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/http/api-error'
import { request } from '@/services/http'
import { createLink, deleteLink, listLinks } from './links.service'

// Keep the real ApiError; replace only request().
vi.mock('@/services/http', async () => ({
  ApiError: (await import('@/services/http/api-error')).ApiError,
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

afterEach(() => {
  vi.clearAllMocks()
})

describe('listLinks', () => {
  it('GETs /links, passes the abort signal and drops ownerId', async () => {
    requestMock.mockResolvedValue({
      items: [
        { code: 'Ab3kQ9z', url: 'https://example.com/a', createdAt: '2026-11-03T10:00:00.000Z', ownerId: 'user-1' },
        { code: 'Zp4Qr2m', url: 'https://example.com/b', createdAt: '2026-11-02T10:00:00.000Z', ownerId: 'user-1' },
      ],
    })
    const signal = new AbortController().signal

    const links = await listLinks(signal)

    expect(requestMock).toHaveBeenCalledWith('/links', { signal })
    expect(links).toEqual([
      { code: 'Ab3kQ9z', url: 'https://example.com/a', createdAt: '2026-11-03T10:00:00.000Z' },
      { code: 'Zp4Qr2m', url: 'https://example.com/b', createdAt: '2026-11-02T10:00:00.000Z' },
    ])
    expect(links[0]).not.toHaveProperty('ownerId')
  })
})

describe('createLink', () => {
  it('POSTs the URL and returns the created code', async () => {
    requestMock.mockResolvedValue({ code: 'Ab3kQ9z', url: 'https://example.com/' })

    await expect(createLink('https://example.com/')).resolves.toEqual({ code: 'Ab3kQ9z', url: 'https://example.com/' })
    expect(requestMock).toHaveBeenCalledWith('/links', { method: 'POST', body: { url: 'https://example.com/' } })
  })
})

describe('deleteLink', () => {
  it('DELETEs /links/{code} with the code encoded', async () => {
    requestMock.mockResolvedValue(undefined)

    await deleteLink('a/b c')

    expect(requestMock).toHaveBeenCalledWith('/links/a%2Fb%20c', { method: 'DELETE' })
  })

  it.each([
    ['a 404 from the Lambda (missing, or not yours)', new ApiError(404, 'Url Not Found')],
    ['a 404 from API Gateway (route not deployed)', new ApiError(404, 'Not Found')],
    ['a network failure', new ApiError(0, 'offline')],
  ])('reports %s to the caller instead of hiding it', async (_case, failure) => {
    requestMock.mockRejectedValue(failure)

    await expect(deleteLink('Ab3kQ9z')).rejects.toBe(failure)
  })
})
