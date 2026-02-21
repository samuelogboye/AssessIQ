import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../AuthContext'
import { ROUTES } from '@/lib/constants'

export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success('You have been logged out.')
      navigate(ROUTES.LOGIN)
    },
    onError: () => {
      // Even if logout fails on server, we still clear local state
      toast.success('You have been logged out.')
      navigate(ROUTES.LOGIN)
    },
  })
}
