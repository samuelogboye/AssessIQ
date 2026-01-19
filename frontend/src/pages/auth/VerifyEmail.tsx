import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useVerifyEmail } from '@/features/auth'
import { ROUTES } from '@/lib/constants'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const verifyMutation = useVerifyEmail()

  const uidb64 = searchParams.get('uid')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!uidb64 || !token) {
      setStatus('error')
      return
    }

    verifyMutation.mutate(
      { uidb64, token },
      {
        onSuccess: () => setStatus('success'),
        onError: () => setStatus('error'),
      }
    )
  }, [uidb64, token])

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary-700 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Verifying your email...</h2>
        <p className="text-neutral-400">Please wait while we verify your email address.</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-error" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-100 mb-2">Verification failed</h2>
        <p className="text-neutral-400 mb-8">
          This verification link is invalid or has expired. Please request a new one.
        </p>
        <Link to={ROUTES.LOGIN}>
          <Button className="w-full">Go to sign in</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <h2 className="text-2xl font-bold text-neutral-100 mb-2">Email verified!</h2>
      <p className="text-neutral-400 mb-8">
        Your email has been verified. You can now sign in to your account.
      </p>
      <Link to={ROUTES.LOGIN}>
        <Button className="w-full">Sign in</Button>
      </Link>
    </div>
  )
}
