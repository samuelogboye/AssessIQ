import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AppRouter } from '@/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Modal, Button } from '@/components/ui'
import { tokenStorage } from '@/api/client'

function App() {
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const handler = () => setSessionExpired(true)
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#171717',
              border: '1px solid #404040',
              color: '#f5f5f5',
            },
          }}
        />
        <Modal isOpen={sessionExpired} onClose={() => setSessionExpired(false)} title="Session Expired">
          <div className="space-y-4">
            <p className="text-sm text-neutral-400">
              Your session has expired. Please sign in again to continue.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSessionExpired(false)}>
                Dismiss
              </Button>
              <Button
                onClick={() => {
                  tokenStorage.clearTokens()
                  window.location.href = '/auth/login'
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </Modal>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
