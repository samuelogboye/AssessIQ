import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi, getErrorMessage } from '@/api'
import { ROUTES } from '@/lib/constants'
import type { PasswordResetRequest, PasswordResetConfirmRequest } from '@/types'

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (data: PasswordResetRequest) => authApi.requestPasswordReset(data),
    onSuccess: () => {
      toast.success('If an account exists with this email, you will receive reset instructions.')
    },
    onError: (error) => {
      // Show generic message for security
      toast.success('If an account exists with this email, you will receive reset instructions.')
    },
  })
}

export function useConfirmPasswordReset() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: PasswordResetConfirmRequest) => authApi.confirmPasswordReset(data),
    onSuccess: () => {
      toast.success('Password reset successful! You can now log in.')
      navigate(ROUTES.LOGIN)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
