import type { ReactNode } from 'react'

export const inputClass =
  'block min-h-12 w-full rounded-lg border border-border bg-surface px-3.5 text-[1rem] text-ink transition-colors placeholder:text-muted/70 hover:border-ink/30 focus:border-forest focus:outline-none focus-visible:outline-[0.1875rem] focus-visible:outline-offset-2 focus-visible:outline-copper aria-[invalid=true]:border-danger'

export interface FieldControlProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

interface FieldProps {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

/** Visible label, optional hint and error message wired to the control for assistive tech. */
export default function Field({ id, label, required, hint, error, className = '', children }: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[0.875rem] font-semibold text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-copper" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-[0.8125rem] font-normal text-muted">(optional)</span>
        )}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, 'aria-required': required || undefined })}
      {hint && (
        <p id={`${id}-hint`} className="text-[0.8125rem] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-[0.8125rem] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
