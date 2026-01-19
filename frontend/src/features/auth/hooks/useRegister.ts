import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi, getErrorMessage } from '@/api'
import { ROUTES } from '@/lib/constants'
import type { RegisterRequest } from '@/types'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      toast.success('Registration successful! Please check your email to verify your account.')
      navigate(ROUTES.LOGIN)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
