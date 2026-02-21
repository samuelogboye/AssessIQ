import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authApi, getErrorMessage } from '@/api'
import { useAuth } from '../AuthContext'
import type { UpdateProfileRequest, ChangePasswordRequest } from '@/types'

export function useProfile() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuth()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authApi.updateProfile(data),
    onSuccess: (user) => {
      updateUser(user)
      queryClient.setQueryData(['profile'], user)
      toast.success('Profile updated successfully.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
