import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Spinner } from '@/components/ui'
import { ROUTES, USER_ROLES } from '@/lib/constants'

interface PublicOnlyRouteProps {
  children: React.ReactNode
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on role
    const from = location.state?.from?.pathname
    if (from) {
      return <Navigate to={from} replace />
    }

    if (user.role === USER_ROLES.INSTRUCTOR || user.role === USER_ROLES.ADMIN) {
      return <Navigate to={ROUTES.INSTRUCTOR_DASHBOARD} replace />
    }
    return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />
  }

  return <>{children}</>
}
