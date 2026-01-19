import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { authApi, getErrorMessage } from '@/api'
import { loginSchema, type LoginFormData } from '@/lib/validation'
import { ROUTES, USER_ROLES } from '@/lib/constants'
import { useState } from 'react'
import { toast } from 'sonner'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data)
      toast.success('Welcome back!')

      // Get user to determine redirect
      const user = await authApi.getProfile()

      if (from) {
        navigate(from, { replace: true })
      } else if (user.role === USER_ROLES.INSTRUCTOR || user.role === USER_ROLES.ADMIN) {
        navigate(ROUTES.INSTRUCTOR_DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.STUDENT_DASHBOARD, { replace: true })
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Welcome back</h2>
        <p className="text-neutral-400">Sign in to your account to continue</p>
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

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-primary-600 bg-primary-800 text-accent focus:ring-accent focus:ring-offset-0"
            />
            <span className="text-sm text-neutral-400">Remember me</span>
          </label>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-400">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="text-accent hover:text-accent-hover font-medium transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
