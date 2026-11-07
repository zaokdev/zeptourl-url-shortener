import { useRef, useState, type RefObject } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Link } from '@/services/links'

interface DeleteLinkDialogProps {
  /** The link to confirm, or null when closed. */
  link: Link | null
  onCancel: () => void
  onConfirm: (link: Link) => void
  /** Where focus goes after a confirmed delete (the deleted ticket is gone). */
  afterDeleteFocus: RefObject<HTMLElement | null>
}

export function DeleteLinkDialog({ link, onCancel, onConfirm, afterDeleteFocus }: DeleteLinkDialogProps) {
  // Keep showing the last link while the dialog animates closed.
  const [shown, setShown] = useState(link)
  if (link && link !== shown) setShown(link)

  const confirmed = useRef(false)

  return (
    <AlertDialog
      open={link !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent
        // Confirmed: the ticket is gone, so focus the list heading.
        // Cancelled: the default (back to the Delete button).
        finalFocus={() => {
          const target = confirmed.current ? afterDeleteFocus.current : true
          confirmed.current = false
          return target
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this link?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="type-code text-sm">{shown?.code}</span> will stop redirecting. Browsers that opened it in
            the last minute may keep redirecting for up to 60 seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (!link) return
              confirmed.current = true
              onConfirm(link)
            }}
          >
            Delete link
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
