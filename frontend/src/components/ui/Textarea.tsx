import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  showCount?: boolean
  maxLength?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, showCount, maxLength, id, value, ...props }, ref) => {
    const textareaId = id || React.useId()
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-2 block text-sm font-medium text-neutral-200"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[120px] w-full rounded-lg border border-primary-600 bg-primary-800 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-400 transition-colors resize-y',
            'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        <div className="mt-1.5 flex justify-between">
          <div>
            {error && <p className="text-sm text-error">{error}</p>}
            {hint && !error && <p className="text-sm text-neutral-400">{hint}</p>}
          </div>
          {showCount && maxLength && (
            <p className="text-sm text-neutral-400">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
