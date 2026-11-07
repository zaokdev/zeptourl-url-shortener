import { InboxIcon } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Ticket } from '@/components/Ticket'
import { useLinks } from '@/hooks/useLinks'
import type { Link } from '@/services/links'

interface LinkListProps {
  /** The code just created, which prints and takes focus. */
  printingCode: string | null
  onDelete: (link: Link) => void
}

export function LinkList({ printingCode, onDelete }: LinkListProps) {
  const { data: links, isPending, isError, error, refetch, isFetching } = useLinks()

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <span className="sr-only">Loading your links</span>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const loadError = isError && (
    <Alert variant="destructive" className="pr-32">
      <AlertTitle>Couldn't load your links</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
          Try again
        </Button>
      </AlertAction>
    </Alert>
  )

  if (!links) return loadError

  return (
    <div className="flex flex-col gap-4">
      {loadError}
      {links.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No links yet</EmptyTitle>
            <EmptyDescription>Paste a long link above to make your first short link.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {links.map((link) => (
            <li key={link.code}>
              <Ticket link={link} printing={link.code === printingCode} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
