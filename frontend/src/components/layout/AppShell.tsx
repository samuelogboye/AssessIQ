import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardCheck,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { useAuth, useLogout } from '@/features/auth'
import { ROUTES, USER_ROLES } from '@/lib/constants'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

// Navigation items for students
const studentNavItems = [
  { href: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { href: ROUTES.STUDENT_EXAMS, icon: FileText, label: 'Exams' },
  { href: ROUTES.STUDENT_SUBMISSIONS, icon: ClipboardCheck, label: 'My Results' },
]

// Navigation items for instructors
const instructorNavItems = [
  { href: ROUTES.INSTRUCTOR_DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { href: ROUTES.INSTRUCTOR_COURSES, icon: BookOpen, label: 'Courses' },
  { href: ROUTES.INSTRUCTOR_EXAMS, icon: FileText, label: 'Exams' },
  { href: ROUTES.INSTRUCTOR_GRADING, icon: ClipboardCheck, label: 'Grading' },
  { href: ROUTES.INSTRUCTOR_ANALYTICS, icon: BarChart3, label: 'Analytics' },
]

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const logoutMutation = useLogout()
  const isOnline = useOnlineStatus()

  const isInstructor = user?.role === USER_ROLES.INSTRUCTOR || user?.role === USER_ROLES.ADMIN
  const navItems = isInstructor ? instructorNavItems : studentNavItems

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-primary-900">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {!isOnline && (
        <div className="bg-warning/10 border-b border-warning/30 text-warning text-sm px-4 py-2">
          You are offline. Changes will sync when you reconnect.
        </div>
      )}
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary-900/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 border-r border-primary-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-primary-700">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-primary-900 font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-neutral-100">AssessIQ</span>
            </Link>
            <button
              className="lg:hidden p-2 text-neutral-400 hover:text-neutral-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-3 border-b border-primary-700">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <GraduationCap className="h-4 w-4" />
              <span className="capitalize">{user?.role || 'User'}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== ROUTES.STUDENT_DASHBOARD &&
                   item.href !== ROUTES.INSTRUCTOR_DASHBOARD &&
                   location.pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : 'text-neutral-400 hover:text-neutral-100 hover:bg-primary-700'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-primary-700">
            <Link
              to={ROUTES.PROFILE}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === ROUTES.PROFILE
                  ? 'bg-accent/10 text-accent'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-primary-700'
              )}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-primary-900/80 backdrop-blur-md border-b border-primary-700">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-neutral-400 hover:text-neutral-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Spacer for desktop */}
            <div className="hidden lg:block" />

            {/* User Menu */}
            <div className="relative">
              <button
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-800 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-neutral-300">
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-neutral-100">{user?.full_name}</p>
                  <p className="text-xs text-neutral-400">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-primary-800 border border-primary-600 rounded-lg shadow-xl z-50 animate-scale-in origin-top-right">
                    <div className="p-2">
                      <Link
                        to={ROUTES.PROFILE}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-neutral-100 hover:bg-primary-700 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <button
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-neutral-100 hover:bg-primary-700 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleLogout()
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
