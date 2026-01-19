import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../AuthContext'
import { getErrorMessage } from '@/api'
import { ROUTES, USER_ROLES } from '@/lib/constants'
import type { LoginRequest } from '@/types'

export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: () => {
      toast.success('Welcome back!')
      // Navigation will be handled based on user role after auth state updates
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useLoginWithRedirect() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      await login(data)
      // Get user from auth context after login
      const response = await import('@/api').then((m) => m.authApi.getProfile())
      return response
    },
    onSuccess: (user) => {
      toast.success('Welcome back!')
      // Redirect based on role
      if (user.role === USER_ROLES.INSTRUCTOR || user.role === USER_ROLES.ADMIN) {
        navigate(ROUTES.INSTRUCTOR_DASHBOARD)
      } else {
        navigate(ROUTES.STUDENT_DASHBOARD)
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
