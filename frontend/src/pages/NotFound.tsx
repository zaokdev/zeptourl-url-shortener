import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// Short links never land here: they're served by the API domain, not this app.
export default function NotFound() {
  return (
    <main id="content" className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4 py-10">
      <title>Page not found · ZeptoURL</title>
      <h1 className="type-title">This page doesn't exist</h1>
      <p className="text-muted-foreground">Check the address, or start again from the home page.</p>
      <div>
        <Button render={<Link to="/" />} nativeButton={false}>
          Go to the home page
        </Button>
      </div>
    </main>
  )
}
