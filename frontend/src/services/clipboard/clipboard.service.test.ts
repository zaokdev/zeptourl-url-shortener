import { afterEach, describe, expect, it, vi } from 'vitest'
import { COPY_FAILED, copyText } from './clipboard.service'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('copyText', () => {
  it('writes the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await copyText('https://s.test/Ab3kQ9z')

    expect(writeText).toHaveBeenCalledWith('https://s.test/Ab3kQ9z')
  })

  it('fails with a friendly message when the clipboard API is missing', async () => {
    vi.stubGlobal('navigator', {})

    await expect(copyText('x')).rejects.toThrow(COPY_FAILED)
  })

  it('fails with a friendly message when the browser refuses', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new DOMException('denied')) } })

    await expect(copyText('x')).rejects.toThrow(COPY_FAILED)
  })
})
