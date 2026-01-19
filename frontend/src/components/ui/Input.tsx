import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const inputId = id || React.useId()
    const isPassword = type === 'password'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-neutral-200"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-neutral-400">{leftIcon}</span>
            </div>
          )}
          <input
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'flex h-11 w-full rounded-lg border border-primary-600 bg-primary-800 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-400 transition-colors',
              'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-error focus:border-error focus:ring-error/20',
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-200"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-neutral-400">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-neutral-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
