// Shown instead of a blank page when required environment variables are missing.
export function ConfigErrorScreen({ missing }: { missing: readonly string[] }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4 py-10">
      <title>Not configured · ZeptoURL</title>
      <h1 className="type-title">ZeptoURL isn't configured</h1>
      <p className="text-muted-foreground">
        These environment variables are missing. Add them to <code className="type-code text-sm">.env.local</code> (see{' '}
        <code className="type-code text-sm">.env.example</code>), then restart the dev server.
      </p>
      <ul className="flex flex-col gap-1">
        {missing.map((name) => (
          <li key={name}>
            <code className="type-code">{name}</code>
          </li>
        ))}
      </ul>
    </main>
  )
}
