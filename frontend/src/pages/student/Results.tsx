import { Link, useParams } from 'react-router-dom'
import {
  Trophy,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, Button, Skeleton, Badge } from '@/components/ui'
import { useSubmissionReview } from '@/features/student'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

function ScoreCircle({
  percentage,
  isPassed,
}: {
  percentage: number
  isPassed: boolean
}) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-primary-700"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={isPassed ? 'text-success' : 'text-error'}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s ease-in-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-neutral-100">{Math.round(percentage)}%</span>
        <span className={cn('text-sm font-medium', isPassed ? 'text-success' : 'text-error')}>
          {isPassed ? 'Passed' : 'Failed'}
        </span>
      </div>
    </div>
  )
}

export default function SubmissionResults() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number(id)

  const { data: review, isLoading } = useSubmissionReview(submissionId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-100 mb-2">Results Not Found</h2>
        <p className="text-neutral-400 mb-4">
          We couldn’t load your results. Please try again.
        </p>
        <Link to={ROUTES.STUDENT_DASHBOARD}>
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.STUDENT_DASHBOARD}
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Results</h1>
        <p className="text-neutral-400">
          {review.exam.title} • {review.exam.course_name}
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreCircle
              percentage={review.percentage ?? 0}
              isPassed={review.is_passed ?? false}
            />

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary-700/50 rounded-lg">
                <Trophy className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xl font-bold text-neutral-100">
                  {review.total_score ?? '-'} / {review.exam.total_marks}
                </p>
                <p className="text-sm text-neutral-400">Score</p>
              </div>
              <div className="text-center p-4 bg-primary-700/50 rounded-lg">
                <Clock className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="text-xl font-bold text-neutral-100">
                  {review.time_taken_seconds ? formatTime(review.time_taken_seconds) : '-'}
                </p>
                <p className="text-sm text-neutral-400">Time Taken</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success mx-auto mb-2" />
                <p className="text-xl font-bold text-success">{review.answers.filter(a => a.is_correct === true).length}</p>
                <p className="text-sm text-neutral-400">Correct</p>
              </div>
              <div className="text-center p-4 bg-error/10 rounded-lg">
                <XCircle className="h-5 w-5 text-error mx-auto mb-2" />
                <p className="text-xl font-bold text-error">{review.answers.filter(a => a.is_correct === false).length}</p>
                <p className="text-sm text-neutral-400">Incorrect</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge variant={review.is_passed ? 'success' : 'error'}>
              {review.is_passed ? 'Passed' : 'Failed'}
            </Badge>
            <Badge variant="default">
              {review.total_score ?? 0}/{review.exam.total_marks} points
            </Badge>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {review.exam.allow_review && (
              <Link to={`/student/submissions/${submissionId}/review`}>
                <Button variant="primary">View Detailed Review</Button>
              </Link>
            )}
            <Link to={ROUTES.STUDENT_DASHBOARD}>
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-neutral-100">Exam Summary</h3>
          </div>
          <div className="text-sm text-neutral-400 space-y-1">
            <p>Total Marks: {review.exam.total_marks}</p>
            <p>Passing Marks: {review.exam.passing_marks}</p>
            <p>Review Allowed: {review.exam.allow_review ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
