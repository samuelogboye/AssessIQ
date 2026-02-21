import { Outlet, Link } from 'react-router-dom'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const features = [
  'Create secure assessments in minutes',
  'AI-powered grading saves hours',
  'Real-time analytics and insights',
  'Works for any class size',
]

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

        {/* Gradient Orb */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-primary-900 font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold text-neutral-100">AssessIQ</span>
          </Link>

          {/* Content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-neutral-100 mb-6">
              Smart Assessment,{' '}
              <span className="gradient-text">Simplified</span>
            </h1>
            <p className="text-neutral-400 mb-8">
              Join thousands of educators who have transformed their assessment workflow with
              AI-powered grading and real-time insights.
            </p>

            {/* Features */}
            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-neutral-300">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} AssessIQ. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-primary-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to={ROUTES.HOME} className="inline-flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-primary-900 font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-neutral-100">AssessIQ</span>
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
