/** Visually hidden until focused; jumps keyboard users past the header. */
export function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Skip to content
    </a>
  )
}
