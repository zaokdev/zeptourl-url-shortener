import { useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { useCreateLink } from '@/hooks/useLinks'
import { ApiError } from '@/services/http'
import { normalizeInput, validateUrl } from '@/services/links'

export function CreateLinkForm({ onCreated }: { onCreated: (code: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const errorId = useId()
  const createLink = useCreateLink()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createLink.isPending) return

    const check = validateUrl(normalizeInput(value))
    if (!check.ok) {
      setError(check.message)
      inputRef.current?.focus()
      return
    }

    createLink.mutate(check.url, {
      onSuccess: (created) => {
        setValue('')
        setError(null)
        toast.add({ type: 'success', title: 'Link shortened', description: `${created.code} is ready to copy.` })
        onCreated(created.code)
      },
      onError: (failure) => {
        // The backend's own validation message belongs next to the field.
        if (failure instanceof ApiError && failure.status === 400) {
          setError(failure.message)
          inputRef.current?.focus()
          return
        }
        toast.add({ type: 'error', title: "Couldn't shorten the link", description: failure.message })
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-xl bg-card p-4 sm:p-5">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={inputId}>Long link</FieldLabel>
        <InputGroup>
          <InputGroupInput
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="https://example.com/a/very/long/page"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              if (error) setError(null)
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          <InputGroupAddon align="inline-end">
            <Button type="submit" size="sm" disabled={createLink.isPending}>
              {createLink.isPending && <Spinner data-icon="inline-start" />}
              Shorten
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <FieldError id={errorId}>{error}</FieldError>
      </Field>
    </form>
  )
}
