import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/components/ui/toast'
import { copyText } from '@/services/clipboard'

/** `copied` stays true for `resetMs` after a successful copy; failures show a toast. */
export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = useCallback(
    async (text: string) => {
      try {
        await copyText(text)
      } catch (error) {
        toast.add({ type: 'error', title: error instanceof Error ? error.message : "Couldn't copy." })
        return false
      }
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), resetMs)
      return true
    },
    [resetMs],
  )

  return { copy, copied }
}
