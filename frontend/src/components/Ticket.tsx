import { useEffect, useRef } from 'react'
import { CheckIcon, CopyIcon, ExternalLinkIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { formatDateTime, formatRelativeTime } from '@/services/format'
import { displayUrl, shortLink, type Link } from '@/services/links'

interface TicketProps {
  link: Link
  /** Just created: play the print animation and move focus to Copy. */
  printing?: boolean
  /** Landing-page specimen: no time, no actions, no real short link. */
  specimen?: boolean
  onDelete?: (link: Link) => void
}

export function Ticket({ link, printing = false, specimen = false, onDelete }: TicketProps) {
  return (
    <article
      data-slot="ticket"
      className="ticket"
      data-printing={printing || undefined}
      aria-label={`Short link ${link.code}`}
    >
      <div className="ticket-stub">
        <span className="type-code-lg">{link.code}</span>
      </div>
      <div className="ticket-body">
        <p className="truncate text-sm" title={link.url}>
          {displayUrl(link.url)}
        </p>
        {!specimen && (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            {link.createdAt && (
              <time dateTime={link.createdAt} title={formatDateTime(link.createdAt)} className="text-sm text-ticket-muted">
                {formatRelativeTime(link.createdAt)}
              </time>
            )}
            <TicketActions link={link} focusCopy={printing} onDelete={onDelete} />
          </div>
        )}
      </div>
    </article>
  )
}

function TicketActions({
  link,
  focusCopy,
  onDelete,
}: {
  link: Link
  focusCopy: boolean
  onDelete?: (link: Link) => void
}) {
  const short = shortLink(link.code)
  const { copy, copied } = useCopyToClipboard()
  const copyRef = useRef<HTMLButtonElement>(null)

  // After creating a link, copying it is the likely next step.
  useEffect(() => {
    if (focusCopy) copyRef.current?.focus()
  }, [focusCopy])

  return (
    <div className="-mr-2 ml-auto flex items-center gap-1">
      <Button ref={copyRef} variant="ghost" onClick={() => void copy(short)}>
        {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
        {copied ? 'Copied' : 'Copy'}
        <span className="sr-only"> short link {link.code}</span>
      </Button>
      <span className="sr-only" aria-live="polite">
        {copied ? `Copied ${short}` : ''}
      </span>
      <Button variant="ghost" render={<a href={short} target="_blank" rel="noreferrer" />} nativeButton={false}>
        <ExternalLinkIcon data-icon="inline-start" />
        Open
        <span className="sr-only"> {link.code} in a new tab</span>
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Delete link ${link.code}`} onClick={() => onDelete?.(link)}>
        <Trash2Icon />
      </Button>
    </div>
  )
}
