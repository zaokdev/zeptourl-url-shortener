import { Link as RouterLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { SkipLink } from '@/components/SkipLink'
import { Ticket } from '@/components/Ticket'
import { Wordmark } from '@/components/Wordmark'
import type { Link } from '@/services/links'

// No auth state here on purpose: Amplify isn't loaded on this page. Signed-in
// users who click "Log in" are sent straight on to /dashboard.

const SAMPLE_URL =
  'https://shop.example.com/collections/winter/coats/wool-overcoat-charcoal?size=m&ref=newsletter&utm_source=email&utm_campaign=first-frost'

const SPECIMEN: Link = { code: 'Ab3kQ9z', url: SAMPLE_URL }

const STEPS = [
  { title: 'Paste a long link', body: 'Any http or https address, up to 2,048 characters.' },
  { title: 'Get a 7-character code', body: 'Codes avoid look-alike confusion: 0 and O, 1, l and I all read differently.' },
  { title: 'Share the short link', body: 'It redirects to the original. Copy, open or delete it from your list anytime.' },
]

export default function Landing() {
  return (
    <>
      <title>ZeptoURL: short links you can keep track of</title>
      <SkipLink />
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
        <Wordmark />
        <Button variant="ghost" render={<RouterLink to="/login" />} nativeButton={false}>
          Log in
        </Button>
      </header>

      <main id="content" className="mx-auto flex max-w-3xl flex-col gap-20 px-4 pt-12 pb-20 sm:pt-20">
        <section aria-labelledby="hero-title" className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <h1 id="hero-title" className="type-display max-w-[14ch]">
              Turn long links into short ones.
            </h1>
            <p className="type-lede text-muted-foreground">
              Paste a link, get a 7-character code, and keep every link you've made in one list.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" render={<RouterLink to="/login?mode=signup" />} nativeButton={false}>
                Create an account
              </Button>
              <Button size="lg" variant="outline" render={<RouterLink to="/login" />} nativeButton={false}>
                Log in
              </Button>
            </div>
          </div>

          {/* The hero visual is the product's own transformation: a real long URL, kept as a ticket. */}
          <figure className="flex flex-col gap-4">
            <p className="text-sm break-all text-muted-foreground">{SAMPLE_URL}</p>
            <Ticket link={SPECIMEN} specimen />
            <figcaption className="text-sm text-muted-foreground">
              A {SAMPLE_URL.length}-character link, kept as a 7-character ticket.
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="how-title" className="flex flex-col gap-6">
          <h2 id="how-title" className="type-title">
            How it works
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-2">
                <span aria-hidden="true" className="type-code text-muted-foreground">
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t">
        <p className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
          Built on AWS Lambda, API Gateway, DynamoDB and Cognito.
        </p>
      </footer>
    </>
  )
}
