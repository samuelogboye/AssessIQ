import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, Badge, Button, Skeleton } from '@/components/ui'
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

function AnswerReviewCard({
  answer,
  index,
  showCorrectAnswer,
}: {
  answer: {
    id: number
    question: {
      question_number: number
      question_text: string
      question_type: string
      marks: number
      options: { key: string; text: string }[] | null
      correct_answer: string | null
    }
    answer_text: string | null
    score: number | null
    feedback: string | null
    is_correct: boolean | null
  }
  index: number
  showCorrectAnswer: boolean
}) {
  const getOptionText = (key: string) => {
    return answer.question.options?.find((o) => o.key === key)?.text || key
  }

  return (
    <Card className={cn(answer.is_correct === true && 'border-success/50', answer.is_correct === false && 'border-error/50')}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">
              Question {answer.question.question_number}
            </span>
            <Badge variant="secondary" className="text-xs capitalize">
              {answer.question.question_type.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {answer.is_correct !== null && (
              answer.is_correct ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-error" />
              )
            )}
            <span className="text-sm font-medium text-neutral-300">
              {answer.score !== null ? answer.score : '-'} / {answer.question.marks}
            </span>
          </div>
        </div>

        {/* Question */}
        <p className="text-neutral-100 mb-4">{answer.question.question_text}</p>

        {/* Answers */}
        <div className="space-y-3">
          {/* Your Answer */}
          <div className="p-3 bg-primary-700/50 rounded-lg">
            <p className="text-xs text-neutral-500 mb-1">Your Answer</p>
            <p className="text-neutral-200">
              {answer.answer_text ? (
                answer.question.question_type === 'multiple_choice' ? (
                  <>
                    <span className="font-medium">{answer.answer_text}.</span>{' '}
                    {getOptionText(answer.answer_text)}
                  </>
                ) : (
                  answer.answer_text
                )
              ) : (
                <span className="text-neutral-500 italic">No answer provided</span>
              )}
            </p>
          </div>

          {/* Correct Answer (if allowed to show) */}
          {showCorrectAnswer && answer.question.correct_answer && (
            <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
              <p className="text-xs text-success mb-1">Correct Answer</p>
              <p className="text-neutral-200">
                {answer.question.question_type === 'multiple_choice' ? (
                  <>
                    <span className="font-medium">{answer.question.correct_answer}.</span>{' '}
                    {getOptionText(answer.question.correct_answer)}
                  </>
                ) : (
                  answer.question.correct_answer
                )}
              </p>
            </div>
          )}

          {/* Feedback */}
          {answer.feedback && (
            <div className="p-3 bg-info/10 border border-info/30 rounded-lg">
              <p className="text-xs text-info mb-1">Feedback</p>
              <p className="text-neutral-300 text-sm">{answer.feedback}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SubmissionReview() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number(id)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null)

  const { data: review, isLoading } = useSubmissionReview(submissionId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-100 mb-2">Submission Not Found</h2>
        <p className="text-neutral-400 mb-4">
          The submission you're looking for doesn't exist or you don't have access.
        </p>
        <Link to={ROUTES.STUDENT_SUBMISSIONS}>
          <Button>Back to Submissions</Button>
        </Link>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const correctCount = review.answers.filter((a) => a.is_correct === true).length
  const incorrectCount = review.answers.filter((a) => a.is_correct === false).length
  const pendingCount = review.answers.filter((a) => a.is_correct === null).length

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT_SUBMISSIONS}
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Submissions
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">{review.exam.title}</h1>
        <p className="text-neutral-400">{review.exam.course_name}</p>
      </div>

      {/* Score Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Circle */}
            <ScoreCircle
              percentage={review.percentage ?? 0}
              isPassed={review.is_passed ?? false}
            />

            {/* Stats */}
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
                <p className="text-xl font-bold text-success">{correctCount}</p>
                <p className="text-sm text-neutral-400">Correct</p>
              </div>
              <div className="text-center p-4 bg-error/10 rounded-lg">
                <XCircle className="h-5 w-5 text-error mx-auto mb-2" />
                <p className="text-xl font-bold text-error">{incorrectCount}</p>
                <p className="text-sm text-neutral-400">Incorrect</p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {review.status === 'submitted' && (
            <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-warning animate-spin" />
                <div>
                  <p className="font-medium text-neutral-100">Grading in Progress</p>
                  <p className="text-sm text-neutral-400">
                    Your submission is being graded. Check back soon for your results.
                  </p>
                </div>
              </div>
            </div>
          )}

          {pendingCount > 0 && review.status === 'graded' && (
            <div className="mt-6 p-4 bg-info/10 border border-info/30 rounded-lg">
              <p className="text-sm text-neutral-400">
                {pendingCount} {pendingCount === 1 ? 'question is' : 'questions are'} pending
                manual grading.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Review + Summary Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {review.exam.allow_review ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-neutral-100">Question Review</h3>
                </div>
                {currentQuestionIndex !== null && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCurrentQuestionIndex(
                          currentQuestionIndex > 0 ? currentQuestionIndex - 1 : null
                        )
                      }
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-neutral-400">
                      {currentQuestionIndex + 1} / {review.answers.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCurrentQuestionIndex(
                          currentQuestionIndex < review.answers.length - 1
                            ? currentQuestionIndex + 1
                            : currentQuestionIndex
                        )
                      }
                      disabled={currentQuestionIndex === review.answers.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQuestionIndex === null ? (
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {review.answers.map((answer, index) => (
                      <button
                        key={answer.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                          answer.is_correct === true && 'bg-success/20 text-success border border-success/50',
                          answer.is_correct === false && 'bg-error/20 text-error border border-error/50',
                          answer.is_correct === null && 'bg-primary-700 text-neutral-400'
                        )}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentQuestionIndex(null)}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Overview
                    </Button>
                    <AnswerReviewCard
                      answer={review.answers[currentQuestionIndex]}
                      index={currentQuestionIndex}
                      showCorrectAnswer={review.exam.allow_review}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-300 mb-2">
                  Review Not Available
                </h3>
                <p className="text-neutral-400">
                  Question review is not enabled for this exam.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-sm text-neutral-400">Summary</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Questions</span>
                <span className="text-neutral-200">{review.answers.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Correct</span>
                <span className="text-success">{correctCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Incorrect</span>
                <span className="text-error">{incorrectCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Pending</span>
                <span className="text-warning">{pendingCount}</span>
              </div>
            </CardContent>
          </Card>

          {review.exam.allow_review && (
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-neutral-400 mb-3">Quick Nav</div>
                <div className="grid grid-cols-5 gap-2">
                  {review.answers.map((answer, index) => (
                    <button
                      key={answer.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={cn(
                        'w-8 h-8 rounded-md text-xs font-medium transition-all',
                        answer.is_correct === true && 'bg-success/20 text-success border border-success/50',
                        answer.is_correct === false && 'bg-error/20 text-error border border-error/50',
                        answer.is_correct === null && 'bg-primary-700 text-neutral-400'
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Link to={ROUTES.STUDENT_SUBMISSIONS}>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Submissions
          </Button>
        </Link>
        <Link to={ROUTES.STUDENT_EXAMS}>
          <Button>Browse More Exams</Button>
        </Link>
      </div>
    </div>
  )
}
