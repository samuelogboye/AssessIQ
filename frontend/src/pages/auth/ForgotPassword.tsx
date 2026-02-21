import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useRequestPasswordReset } from '@/features/auth'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation'
import { ROUTES } from '@/lib/constants'

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const resetMutation = useRequestPasswordReset()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = (data: ForgotPasswordFormData) => {
    resetMutation.mutate(data, {
      onSuccess: () => setIsSubmitted(true),
    })
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Check your email</h2>
        <p className="text-neutral-400 mb-8">
          If an account exists with that email, we&apos;ve sent password reset instructions.
        </p>
        <Link to={ROUTES.LOGIN}>
          <Button variant="secondary" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Forgot password?</h2>
        <p className="text-neutral-400">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" className="w-full" isLoading={resetMutation.isPending}>
          Send reset link
        </Button>
      </form>

      <p className="mt-8 text-center">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center text-sm text-neutral-400 hover:text-accent transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
