import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { PublicLayout } from '@/components/layout'
import { Spinner } from '@/components/ui'
import { ROUTES } from '@/lib/constants'

// Lazy load pages for code splitting
const Landing = lazy(() => import('@/pages/public/Landing'))
const About = lazy(() => import('@/pages/public/About'))
const Contact = lazy(() => import('@/pages/public/Contact'))
const NotFound = lazy(() => import('@/pages/public/NotFound'))

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
  // Auth routes will be added in Sprint 2
  // {
  //   path: '/login',
  //   element: <AuthLayout />,
  //   children: [...]
  // },
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
