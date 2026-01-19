import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, User, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useRegister } from '@/features/auth'
import { registerSchema, type RegisterFormData, getPasswordStrength } from '@/lib/validation'
import { ROUTES } from '@/lib/constants'

export default function Register() {
  const [passwordValue, setPasswordValue] = useState('')
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
      role: 'student',
      terms: false,
    },
  })

  const watchPassword = watch('password')
  const passwordStrength = getPasswordStrength(watchPassword || '')

  const onSubmit = (data: RegisterFormData) => {
    const { terms, ...registerData } = data
    registerMutation.mutate(registerData)
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Create an account</h2>
        <p className="text-neutral-400">Get started with AssessIQ today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            leftIcon={<User className="h-5 w-5" />}
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.password?.message}
            {...register('password')}
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
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.password_confirm?.message}
          {...register('password_confirm')}
        />

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-200 mb-3">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="relative cursor-pointer">
              <input
                type="radio"
                value="student"
                className="peer sr-only"
                {...register('role')}
              />
              <div className="p-4 rounded-lg border border-primary-600 bg-primary-800 peer-checked:border-accent peer-checked:bg-accent/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-700 flex items-center justify-center peer-checked:bg-accent/20">
                    <User className="h-5 w-5 text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-100">Student</p>
                    <p className="text-xs text-neutral-400">Take exams</p>
                  </div>
                </div>
              </div>
            </label>
            <label className="relative cursor-pointer">
              <input
                type="radio"
                value="instructor"
                className="peer sr-only"
                {...register('role')}
              />
              <div className="p-4 rounded-lg border border-primary-600 bg-primary-800 peer-checked:border-accent peer-checked:bg-accent/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-700 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-100">Instructor</p>
                    <p className="text-xs text-neutral-400">Create exams</p>
                  </div>
                </div>
              </div>
            </label>
          </div>
          {errors.role && (
            <p className="mt-1.5 text-sm text-error">{errors.role.message}</p>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-primary-600 bg-primary-800 text-accent focus:ring-accent focus:ring-offset-0"
            {...register('terms')}
          />
          <span className="text-sm text-neutral-400">
            I agree to the{' '}
            <a href="#" className="text-accent hover:text-accent-hover">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-accent hover:text-accent-hover">
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.terms && (
          <p className="text-sm text-error">{errors.terms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          isLoading={registerMutation.isPending}
        >
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-400">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
