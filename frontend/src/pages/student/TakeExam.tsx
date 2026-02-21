import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  Check,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, Button, Modal, Badge } from '@/components/ui'
import {
  useSubmissionDetail,
  useSubmissionAnswers,
  useSaveAnswer,
  useSubmitExam,
} from '@/features/student'
import { cn } from '@/lib/utils'
import type { StudentQuestion } from '@/types'

// Timer Component
function ExamTimer({
  initialSeconds,
  onTimeUp,
}: {
  initialSeconds: number
  onTimeUp: () => void
}) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp()
      return
    }

    const interval = setInterval(() => {
      setSeconds((s) => s - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [seconds, onTimeUp])

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const isWarning = seconds <= 300 && seconds > 60 // 5 minutes
  const isCritical = seconds <= 60 // 1 minute

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg',
        isCritical && 'bg-error/20 text-error animate-pulse',
        isWarning && !isCritical && 'bg-warning/20 text-warning',
        !isWarning && !isCritical && 'bg-primary-700 text-neutral-100'
      )}
    >
      <Clock className="h-5 w-5" />
      <span>
        {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
        {minutes.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  )
}

// Question Navigation
function QuestionNav({
  questions,
  currentIndex,
  answers,
  flagged,
  onSelect,
}: {
  questions: StudentQuestion[]
  currentIndex: number
  answers: Record<number, string>
  flagged: Set<number>
  onSelect: (index: number) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, index) => {
          const isAnswered = !!answers[q.id]
          const isFlagged = flagged.has(q.id)
          const isCurrent = index === currentIndex

          return (
            <button
              key={q.id}
              onClick={() => onSelect(index)}
              className={cn(
                'w-10 h-10 rounded-lg text-sm font-medium transition-all relative',
                isCurrent && 'ring-2 ring-accent',
                isAnswered && !isCurrent && 'bg-primary-600 text-neutral-100',
                !isAnswered && !isCurrent && 'bg-primary-700/50 text-neutral-400',
                isFlagged && 'border-2 border-warning'
              )}
            >
              {index + 1}
              {isFlagged && (
                <Flag className="absolute -top-1 -right-1 h-3 w-3 text-warning fill-warning" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="text-xs space-y-1 text-neutral-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-700/50" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-600" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-warning" />
          <span>Flagged</span>
        </div>
      </div>
    </div>
  )
}

// Multiple Choice Answer
function MultipleChoiceAnswer({
  question,
  value,
  onChange,
}: {
  question: StudentQuestion
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <label
          key={option.key}
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors',
            value === option.key
              ? 'bg-accent/10 border border-accent'
              : 'bg-primary-700/50 border border-transparent hover:bg-primary-700'
          )}
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            value={option.key}
            checked={value === option.key}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 h-4 w-4 text-accent focus:ring-accent"
          />
          <span className="text-neutral-200">
            <span className="font-medium mr-2">{option.key}.</span>
            {option.text}
          </span>
        </label>
      ))}
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Clear selection
        </button>
      )}
    </div>
  )
}

// True/False Answer
function TrueFalseAnswer({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex gap-4">
      {['True', 'False'].map((option) => (
        <button
          key={option}
          onClick={() => onChange(option.toLowerCase())}
          className={cn(
            'flex-1 py-4 px-6 rounded-lg font-medium text-lg transition-colors',
            value === option.toLowerCase()
              ? 'bg-accent text-primary-900'
              : 'bg-primary-700 text-neutral-300 hover:bg-primary-600'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

// Short Answer
function ShortAnswer({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="text-xs text-neutral-500 text-right">{value.length} characters</div>
    </div>
  )
}

// Essay Answer
function EssayAnswer({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here..."
        rows={10}
        className="w-full px-4 py-3 bg-primary-700 border border-primary-600 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent resize-y"
      />
      <div className="flex items-center justify-between text-sm text-neutral-500">
        <span>Tip: Structure your response with clear points.</span>
        <span>{wordCount} words</span>
      </div>
    </div>
  )
}

// Question Display
function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
  isFlagged,
  onToggleFlag,
}: {
  question: StudentQuestion
  questionNumber: number
  totalQuestions: number
  answer: string
  onAnswerChange: (value: string) => void
  isFlagged: boolean
  onToggleFlag: () => void
}) {
  const renderAnswerInput = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceAnswer
            question={question}
            value={answer}
            onChange={onAnswerChange}
          />
        )
      case 'true_false':
        return <TrueFalseAnswer value={answer} onChange={onAnswerChange} />
      case 'short_answer':
        return <ShortAnswer value={answer} onChange={onAnswerChange} />
      case 'essay':
        return <EssayAnswer value={answer} onChange={onAnswerChange} />
      default:
        return <ShortAnswer value={answer} onChange={onAnswerChange} />
    }
  }

  const getQuestionTypeLabel = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return 'Multiple Choice'
      case 'true_false':
        return 'True/False'
      case 'short_answer':
        return 'Short Answer'
      case 'essay':
        return 'Essay'
      default:
        return question.question_type
    }
  }

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-neutral-500">
              Question {questionNumber} of {totalQuestions}
            </span>
            <Badge variant="default" className="text-xs">
              {getQuestionTypeLabel()}
            </Badge>
            <Badge variant="default" className="text-xs">
              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
            </Badge>
          </div>
        </div>
        <button
          onClick={onToggleFlag}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isFlagged
              ? 'bg-warning/20 text-warning'
              : 'bg-primary-700 text-neutral-400 hover:text-warning'
          )}
          title={isFlagged ? 'Unflag question' : 'Flag for review'}
        >
          <Flag className={cn('h-5 w-5', isFlagged && 'fill-warning')} />
        </button>
      </div>

      {/* Question Text */}
      <div className="text-lg text-neutral-100">{question.question_text}</div>

      {/* Answer Input */}
      <div>{renderAnswerInput()}</div>
    </div>
  )
}

// Submit Review Modal
function SubmitReviewModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  questions,
  answers,
  flagged,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  isSubmitting: boolean
  questions: StudentQuestion[]
  answers: Record<number, string>
  flagged: Set<number>
}) {
  const answeredCount = questions.filter((q) => !!answers[q.id]).length
  const unansweredCount = questions.length - answeredCount
  const flaggedCount = flagged.size

  const unansweredQuestions = questions
    .map((q, i) => (!answers[q.id] ? i + 1 : null))
    .filter((n) => n !== null)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review & Submit">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-success">{answeredCount}</p>
            <p className="text-sm text-neutral-400">Answered</p>
          </div>
          <div className="p-4 bg-error/10 border border-error/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-error">{unansweredCount}</p>
            <p className="text-sm text-neutral-400">Unanswered</p>
          </div>
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-warning">{flaggedCount}</p>
            <p className="text-sm text-neutral-400">Flagged</p>
          </div>
        </div>

        {/* Warnings */}
        {unansweredCount > 0 && (
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-neutral-100">Unanswered Questions</p>
                <p className="text-sm text-neutral-400">
                  You have {unansweredCount} unanswered{' '}
                  {unansweredCount === 1 ? 'question' : 'questions'}:{' '}
                  {unansweredQuestions.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation */}
        <div className="p-4 bg-primary-700/50 rounded-lg">
          <p className="text-sm text-neutral-400">
            Once submitted, you cannot change your answers. Are you sure you want to submit?
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Review Answers
          </Button>
          <Button onClick={onSubmit} isLoading={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            Submit Exam
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Main Component
export default function TakeExam() {
  const { submissionId } = useParams<{ id: string; submissionId: string }>()
  const navigate = useNavigate()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'queued' | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [showNav, setShowNav] = useState(false)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<Record<number, string>>({})
  const pendingQueueRef = useRef<Record<number, string>>({})

  const { data: submission, isLoading } = useSubmissionDetail(Number(submissionId))
  const { data: savedAnswers } = useSubmissionAnswers(Number(submissionId))
  const saveAnswer = useSaveAnswer(Number(submissionId))
  const submitExam = useSubmitExam(Number(submissionId))
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const flushPending = async () => {
      const pendingEntries = Object.entries(pendingQueueRef.current)
      if (!isOnline || pendingEntries.length === 0) return
      for (const [questionId, answerText] of pendingEntries) {
        try {
          await saveAnswer.mutateAsync({
            question_id: Number(questionId),
            answer_text: answerText,
          })
          lastSavedRef.current[Number(questionId)] = answerText
          delete pendingQueueRef.current[Number(questionId)]
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus(null), 2000)
        } catch {
          setSaveStatus('error')
        }
      }
    }
    flushPending()
  }, [isOnline, saveAnswer])


  // Get questions from submission data
  // Questions can come from submission.questions or submission.exam.questions
  const questions: StudentQuestion[] = submission?.questions
    || submission?.exam?.questions
    || []

  // Load saved answers on mount
  useEffect(() => {
    if (savedAnswers) {
      const answersMap: Record<number, string> = {}
      savedAnswers.forEach((a) => {
        answersMap[a.question_id] = a.answer_text
      })
      setAnswers(answersMap)
      lastSavedRef.current = answersMap
    }
  }, [savedAnswers])

  // Auto-save handler
  const handleAnswerChange = useCallback(
    (questionId: number, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))

      // Debounced auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (value !== lastSavedRef.current[questionId]) {
          if (!isOnline) {
            pendingQueueRef.current[questionId] = value
            setSaveStatus('queued')
            return
          }
          setSaveStatus('saving')
          try {
            await saveAnswer.mutateAsync({ question_id: questionId, answer_text: value })
            lastSavedRef.current[questionId] = value
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2000)
          } catch {
            setSaveStatus('error')
          }
        }
      }, 1500)
    },
    [isOnline, saveAnswer]
  )

  // Handle time up
  const handleTimeUp = useCallback(() => {
    // Auto-submit when time is up
    handleSubmit()
  }, [])

  // Handle submit
  const handleSubmit = async () => {
    const answersArray = Object.entries(answers).map(([questionId, answerText]) => ({
      question_id: Number(questionId),
      answer_text: answerText,
    }))

    try {
      await submitExam.mutateAsync({ answers: answersArray })
      navigate(`/student/submissions/${submissionId}/results`)
    } catch {
      // Error handled by mutation
    }
  }

  // Toggle flag
  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  // Navigation
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
    }
  }

  if (isLoading || !submission) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  // Check if submission is already submitted
  if (submission.status !== 'in_progress') {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-100 mb-2">
              Exam Already Submitted
            </h2>
            <p className="text-neutral-400 mb-4">
              This exam has already been submitted. You can view your results.
            </p>
            <Button onClick={() => navigate(`/student/submissions/${submissionId}/results`)}>
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if we have questions
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-100 mb-2">
              No Questions Available
            </h2>
            <p className="text-neutral-400 mb-4">
              Unable to load exam questions. Please try again or contact support.
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  // Calculate remaining time based on started_at
  const calculateRemainingTime = () => {
    if (!submission) return 0
    const startedAt = new Date(submission.started_at).getTime()
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - startedAt) / 1000)
    const totalSeconds = submission.exam.duration_minutes * 60
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    return remaining
  }

  const timeRemaining = calculateRemainingTime()

  return (
    <div className="min-h-screen bg-primary-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary-800 border-b border-primary-600">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-neutral-100">{submission.exam.title}</h1>
            <p className="text-sm text-neutral-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Save Status */}
            {saveStatus && (
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                    <span className="text-neutral-400">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-success">Saved</span>
                  </>
                )}
                {saveStatus === 'queued' && (
                  <span className="text-warning">Offline - queued</span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-error">Save failed</span>
                )}
              </div>
            )}

            {/* Timer */}
            <ExamTimer initialSeconds={timeRemaining} onTimeUp={handleTimeUp} />

            {/* Submit Button */}
            <Button onClick={() => setShowSubmitModal(true)}>
              <Send className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          {!isOnline && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning text-sm">
              You are offline. Answers will be queued and synced when you reconnect.
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Navigation - Sidebar */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="lg:hidden mb-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowNav((prev) => !prev)}
                  className="w-full"
                >
                  {showNav ? 'Hide Questions' : 'Show Questions'}
                </Button>
              </div>
              <Card className={cn('sticky top-24', !showNav && 'hidden lg:block')}>
                <CardContent className="p-4">
                  <h3 className="font-medium text-neutral-100 mb-4">Questions</h3>
                  <QuestionNav
                    questions={questions}
                    currentIndex={currentIndex}
                    answers={answers}
                    flagged={flagged}
                    onSelect={goToQuestion}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Question Content */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <Card>
                <CardContent className="p-6">
                  {currentQuestion && (
                    <QuestionDisplay
                      question={currentQuestion}
                      questionNumber={currentIndex + 1}
                      totalQuestions={questions.length}
                      answer={answers[currentQuestion.id] || ''}
                      onAnswerChange={(value) =>
                        handleAnswerChange(currentQuestion.id, value)
                      }
                      isFlagged={flagged.has(currentQuestion.id)}
                      onToggleFlag={() => toggleFlag(currentQuestion.id)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-4">
                <Button
                  variant="secondary"
                  onClick={() => goToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => goToQuestion(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Modal */}
      <SubmitReviewModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmit}
        isSubmitting={submitExam.isPending}
        questions={questions}
        answers={answers}
        flagged={flagged}
      />
    </div>
  )
}
