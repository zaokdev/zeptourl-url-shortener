import { Spinner } from '@/components/ui/spinner'

export function FullPageSpinner() {
  return (
    <div className="grid min-h-svh place-items-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}
