export const COPY_FAILED = "Couldn't copy. Select the link and copy it manually."

/** Copies text to the clipboard. Throws an Error with a user-facing message on failure. */
export async function copyText(text: string): Promise<void> {
  const clipboard = globalThis.navigator?.clipboard
  if (!clipboard?.writeText) throw new Error(COPY_FAILED)
  try {
    await clipboard.writeText(text)
  } catch {
    throw new Error(COPY_FAILED)
  }
}
