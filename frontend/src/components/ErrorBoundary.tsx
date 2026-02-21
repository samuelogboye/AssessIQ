import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-primary-900 flex items-center justify-center p-6">
          <Card className="max-w-lg w-full">
            <CardContent className="p-8 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
              <h1 className="text-xl font-semibold text-neutral-100">Something went wrong</h1>
              <p className="text-neutral-400">
                {this.state.message || 'An unexpected error occurred. Please try again.'}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button onClick={() => window.location.reload()}>Reload</Button>
                <Button variant="secondary" asChild>
                  <Link to="/">Go to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
