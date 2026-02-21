import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { PublicLayout } from '@/components/layout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute'
import { StudentOnly, InstructorOnly } from '@/features/auth/RoleGuard'

// Lazy load pages for code splitting
// Public pages
const Landing = lazy(() => import('@/pages/public/Landing'))
const About = lazy(() => import('@/pages/public/About'))
const Contact = lazy(() => import('@/pages/public/Contact'))
const NotFound = lazy(() => import('@/pages/public/NotFound'))

// Auth pages
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))

// Student pages
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'))
const StudentExams = lazy(() => import('@/pages/student/Exams'))
const StudentExamDetail = lazy(() => import('@/pages/student/ExamDetail'))
const TakeExam = lazy(() => import('@/pages/student/TakeExam'))
const StudentSubmissions = lazy(() => import('@/pages/student/Submissions'))
const SubmissionReview = lazy(() => import('@/pages/student/SubmissionReview'))
const SubmissionResults = lazy(() => import('@/pages/student/Results'))

// Instructor pages
const InstructorDashboard = lazy(() => import('@/pages/instructor/Dashboard'))
const InstructorCourses = lazy(() => import('@/pages/instructor/Courses'))
const InstructorExams = lazy(() => import('@/pages/instructor/Exams'))
const InstructorGrading = lazy(() => import('@/pages/instructor/Grading'))
const InstructorAnalytics = lazy(() => import('@/pages/instructor/Analytics'))

// Shared pages
const Profile = lazy(() => import('@/pages/shared/Profile'))

// Loading component
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

// Wrap lazy components with Suspense
function withSuspense(Component: React.LazyExoticComponent<() => JSX.Element>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: withSuspense(Landing),
      },
      {
        path: 'about',
        element: withSuspense(About),
      },
      {
        path: 'contact',
        element: withSuspense(Contact),
      },
    ],
  },

  // Auth routes (public only - redirect if logged in)
  {
    path: '/auth',
    element: (
      <PublicOnlyRoute>
        <AuthLayout />
      </PublicOnlyRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login',
        element: withSuspense(Login),
      },
      {
        path: 'register',
        element: withSuspense(Register),
      },
      {
        path: 'forgot-password',
        element: withSuspense(ForgotPassword),
      },
    ],
  },

  // Email verification route (separate path with uidb64 and token params)
  {
    path: '/verify-email/:uidb64/:token',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: withSuspense(VerifyEmail),
      },
    ],
  },

  // Password reset route (separate path with uidb64 and token params)
  {
    path: '/reset-password/:uidb64/:token',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: withSuspense(ResetPassword),
      },
    ],
  },

  // Student dashboard routes (protected)
  {
    path: '/student',
    element: (
      <ProtectedRoute>
        <StudentOnly>
          <AppShell />
        </StudentOnly>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/student/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(StudentDashboard),
      },
      {
        path: 'exams',
        element: withSuspense(StudentExams),
      },
      {
        path: 'exams/:id',
        element: withSuspense(StudentExamDetail),
      },
      {
        path: 'submissions',
        element: withSuspense(StudentSubmissions),
      },
      {
        path: 'submissions/:id/review',
        element: withSuspense(SubmissionReview),
      },
      {
        path: 'submissions/:id/results',
        element: withSuspense(SubmissionResults),
      },
      {
        path: 'profile',
        element: withSuspense(Profile),
      },
    ],
  },

  // Exam taking route (full screen, no app shell)
  {
    path: '/student/exams/:id/take/:submissionId',
    element: (
      <ProtectedRoute>
        <StudentOnly>
          {withSuspense(TakeExam)}
        </StudentOnly>
      </ProtectedRoute>
    ),
  },

  // Instructor dashboard routes (protected)
  {
    path: '/instructor',
    element: (
      <ProtectedRoute>
        <InstructorOnly>
          <AppShell />
        </InstructorOnly>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/instructor/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(InstructorDashboard),
      },
      {
        path: 'courses',
        element: withSuspense(InstructorCourses),
      },
      {
        path: 'exams',
        element: withSuspense(InstructorExams),
      },
      {
        path: 'grading',
        element: withSuspense(InstructorGrading),
      },
      {
        path: 'analytics',
        element: withSuspense(InstructorAnalytics),
      },
      {
        path: 'profile',
        element: withSuspense(Profile),
      },
    ],
  },

  // Catch-all 404 route
  {
    path: '*',
    element: <PublicLayout />,
    children: [
      {
        path: '*',
        element: withSuspense(NotFound),
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
