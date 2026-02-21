import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Spinner } from '@/components/ui'
import { ROUTES, USER_ROLES } from '@/lib/constants'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = ROUTES.STUDENT_DASHBOARD,
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

// Convenience components for common role checks
export function InstructorOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={[USER_ROLES.INSTRUCTOR, USER_ROLES.ADMIN]}
      fallbackPath={ROUTES.STUDENT_DASHBOARD}
    >
      {children}
    </RoleGuard>
  )
}

export function StudentOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard
      allowedRoles={[USER_ROLES.STUDENT]}
      fallbackPath={ROUTES.INSTRUCTOR_DASHBOARD}
    >
      {children}
    </RoleGuard>
  )
}

export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN]} fallbackPath={ROUTES.STUDENT_DASHBOARD}>
      {children}
    </RoleGuard>
  )
}
