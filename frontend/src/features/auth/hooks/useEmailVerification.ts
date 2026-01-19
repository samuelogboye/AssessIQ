import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authApi, getErrorMessage } from '@/api'
import type { VerifyEmailRequest } from '@/types'

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => authApi.verifyEmail(data),
    onSuccess: () => {
      toast.success('Email verified successfully! You can now log in.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => authApi.resendVerification(),
    onSuccess: () => {
      toast.success('Verification email sent.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
