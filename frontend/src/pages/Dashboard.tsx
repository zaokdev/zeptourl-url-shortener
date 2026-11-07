import { useRef, useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { CreateLinkForm } from '@/components/CreateLinkForm'
import { DeleteLinkDialog } from '@/components/DeleteLinkDialog'
import { LinkList } from '@/components/LinkList'
import { toast } from '@/components/ui/toast'
import { useDeleteLink, useLinks } from '@/hooks/useLinks'
import type { Link } from '@/services/links'

export default function Dashboard() {
  const [printingCode, setPrintingCode] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Link | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { data: links } = useLinks()
  const deleteLink = useDeleteLink()

  function confirmDelete(link: Link) {
    setPendingDelete(null)
    deleteLink.mutate(link.code, {
      onSuccess: () => toast.add({ type: 'success', title: 'Link deleted', description: `${link.code} no longer redirects.` }),
      onError: (error) => toast.add({ type: 'error', title: "Couldn't delete the link", description: error.message }),
    })
  }

  return (
    <>
      <title>Your links · ZeptoURL</title>
      <AppHeader />
      <main id="content" className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        <div className="flex items-baseline justify-between gap-4">
          <h1 ref={headingRef} tabIndex={-1} className="type-title rounded-md">
            Your links
          </h1>
          {links && links.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </p>
          )}
        </div>
        <CreateLinkForm onCreated={setPrintingCode} />
        <LinkList printingCode={printingCode} onDelete={setPendingDelete} />
      </main>
      <DeleteLinkDialog
        link={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        afterDeleteFocus={headingRef}
      />
    </>
  )
}
