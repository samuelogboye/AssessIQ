import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useConfirmPasswordReset } from '@/features/auth'
import { resetPasswordSchema, type ResetPasswordFormData, getPasswordStrength } from '@/lib/validation'
import { ROUTES } from '@/lib/constants'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [isSuccess, setIsSuccess] = useState(false)
  const [isInvalid, setIsInvalid] = useState(false)
  const resetMutation = useConfirmPasswordReset()

  const uidb64 = searchParams.get('uid')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!uidb64 || !token) {
      setIsInvalid(true)
    }
  }, [uidb64, token])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: '',
      new_password_confirm: '',
    },
  })

  const watchPassword = watch('new_password')
  const passwordStrength = getPasswordStrength(watchPassword || '')

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!uidb64 || !token) return

    resetMutation.mutate(
      {
        uidb64,
        token,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      },
      {
        onSuccess: () => setIsSuccess(true),
        onError: () => setIsInvalid(true),
      }
    )
  }

  if (isInvalid) {
    return (
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-error" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Invalid or expired link</h2>
        <p className="text-neutral-400 mb-8">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link to={ROUTES.FORGOT_PASSWORD}>
          <Button className="w-full">Request new link</Button>
        </Link>
        <p className="mt-4">
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

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Password reset successful</h2>
        <p className="text-neutral-400 mb-8">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link to={ROUTES.LOGIN}>
          <Button className="w-full">Sign in</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Set new password</h2>
        <p className="text-neutral-400">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.new_password?.message}
            {...register('new_password')}
          />
          {watchPassword && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-primary-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-400">{passwordStrength.label}</span>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.new_password_confirm?.message}
          {...register('new_password_confirm')}
        />

        <Button type="submit" className="w-full" isLoading={resetMutation.isPending}>
          Reset password
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
