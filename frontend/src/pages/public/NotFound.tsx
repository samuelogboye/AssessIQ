import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants'

export default function NotFound() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center">
      <div className="container">
        <div className="max-w-md mx-auto text-center">
          {/* 404 Display */}
          <div className="relative mb-8">
            <span className="text-[10rem] font-bold text-primary-700 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-4xl">?</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          <p className="text-neutral-400 mb-8">
            Oops! The page you are looking for does not exist or has been moved.
            Let us get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to={ROUTES.HOME}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="secondary" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
