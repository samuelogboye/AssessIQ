import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Play,
  History,
  Trophy,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, Badge, Skeleton, Button, Modal } from '@/components/ui'
import {
  useStudentExamDetail,
  useCanAttemptExam,
  useMyExamSubmissions,
  useCreateSubmission,
} from '@/features/student'
import { ROUTES } from '@/lib/constants'
import { format, formatDistanceToNow } from 'date-fns'

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const examId = Number(id)

  const [showStartModal, setShowStartModal] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  const { data: exam, isLoading: examLoading } = useStudentExamDetail(examId)
  const { data: canAttempt, isLoading: canAttemptLoading } = useCanAttemptExam(examId)
  const { data: mySubmissions, isLoading: submissionsLoading } = useMyExamSubmissions(examId)
  const createSubmission = useCreateSubmission()

  const handleStartExam = async () => {
    if (!acknowledged) return

    try {
      const response = await createSubmission.mutateAsync({ exam_id: examId })
      navigate(`/student/exams/${examId}/take/${response.id}`)
    } catch {
      // Error handled by mutation
    }
  }

  if (examLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-100 mb-2">Exam Not Found</h2>
        <p className="text-neutral-400 mb-4">The exam you're looking for doesn't exist.</p>
        <Link to={ROUTES.STUDENT_EXAMS}>
          <Button>Back to Exams</Button>
        </Link>
      </div>
    )
  }

  const getAvailabilityStatus = () => {
    if (exam.is_available) {
      return { text: 'Available Now', variant: 'success' as const }
    }
    if (exam.start_time && new Date(exam.start_time) > new Date()) {
      return { text: 'Upcoming', variant: 'warning' as const }
    }
    if (exam.end_time && new Date(exam.end_time) < new Date()) {
      return { text: 'Ended', variant: 'secondary' as const }
    }
    return { text: 'Unavailable', variant: 'secondary' as const }
  }

  const status = getAvailabilityStatus()

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to={ROUTES.STUDENT_EXAMS}
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Exams
      </Link>

      {/* Exam Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary">{exam.course.code}</Badge>
            <Badge variant={status.variant}>{status.text}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">{exam.title}</h1>
          <p className="text-neutral-400 mt-1">{exam.course.name}</p>
        </div>

        {/* Start Button */}
        {exam.is_available && canAttempt?.can_attempt && (
          <Button size="lg" onClick={() => setShowStartModal(true)}>
            <Play className="h-5 w-5 mr-2" />
            Start Exam
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-neutral-100">Exam Information</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary-700/50 rounded-lg text-center">
                  <Clock className="h-5 w-5 text-accent mx-auto mb-2" />
                  <p className="text-xl font-bold text-neutral-100">
                    {exam.duration_minutes}
                  </p>
                  <p className="text-sm text-neutral-400">Minutes</p>
                </div>
                <div className="p-4 bg-primary-700/50 rounded-lg text-center">
                  <FileText className="h-5 w-5 text-accent mx-auto mb-2" />
                  <p className="text-xl font-bold text-neutral-100">
                    {exam.question_count}
                  </p>
                  <p className="text-sm text-neutral-400">Questions</p>
                </div>
                <div className="p-4 bg-primary-700/50 rounded-lg text-center">
                  <CheckCircle className="h-5 w-5 text-accent mx-auto mb-2" />
                  <p className="text-xl font-bold text-neutral-100">{exam.total_marks}</p>
                  <p className="text-sm text-neutral-400">Total Marks</p>
                </div>
                <div className="p-4 bg-primary-700/50 rounded-lg text-center">
                  <Trophy className="h-5 w-5 text-accent mx-auto mb-2" />
                  <p className="text-xl font-bold text-neutral-100">{exam.passing_marks}</p>
                  <p className="text-sm text-neutral-400">Passing Marks</p>
                </div>
              </div>

              {/* Schedule */}
              {(exam.start_time || exam.end_time) && (
                <div className="p-4 bg-primary-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-accent" />
                    <span className="font-medium text-neutral-100">Schedule</span>
                  </div>
                  <div className="text-sm text-neutral-400">
                    {exam.start_time && (
                      <p>
                        Starts: {format(new Date(exam.start_time), 'MMMM d, yyyy h:mm a')}
                        {new Date(exam.start_time) > new Date() && (
                          <span className="text-accent ml-2">
                            ({formatDistanceToNow(new Date(exam.start_time), { addSuffix: true })})
                          </span>
                        )}
                      </p>
                    )}
                    {exam.end_time && (
                      <p>
                        Ends: {format(new Date(exam.end_time), 'MMMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {exam.instructions && (
                <div>
                  <h4 className="font-medium text-neutral-100 mb-2">Instructions</h4>
                  <div className="text-sm text-neutral-400 prose prose-invert max-w-none">
                    {exam.instructions}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cannot Attempt Warning */}
          {!canAttemptLoading && canAttempt && !canAttempt.can_attempt && (
            <Card className="border-warning/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-neutral-100">Cannot Start Exam</h4>
                    <p className="text-sm text-neutral-400">{canAttempt.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Attempts */}
        <div className="space-y-6">
          {/* Attempts Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-neutral-100">Your Attempts</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-primary-700/50 rounded-lg mb-4">
                <p className="text-3xl font-bold text-neutral-100">
                  {canAttempt?.attempts_remaining === -1
                    ? '∞'
                    : canAttempt?.attempts_remaining ?? 0}
                </p>
                <p className="text-sm text-neutral-400">Attempts Remaining</p>
              </div>

              {submissionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : mySubmissions && mySubmissions.length > 0 ? (
                <div className="space-y-2">
                  {mySubmissions.map((submission) => (
                    <Link
                      key={submission.id}
                      to={`/student/submissions/${submission.id}/review`}
                      className="block p-3 bg-primary-700/50 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-100">
                            Attempt #{submission.attempt_number}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {submission.submitted_at
                              ? format(new Date(submission.submitted_at), 'MMM d, h:mm a')
                              : 'In Progress'}
                          </p>
                        </div>
                        <div className="text-right">
                          {submission.status === 'graded' ? (
                            <>
                              <p className="text-lg font-bold text-neutral-100">
                                {submission.percentage !== null
                                  ? `${Math.round(submission.percentage)}%`
                                  : '-'}
                              </p>
                              <Badge
                                variant={submission.is_passed ? 'success' : 'error'}
                                className="text-xs"
                              >
                                {submission.is_passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </>
                          ) : (
                            <Badge
                              variant={
                                submission.status === 'submitted' ? 'warning' : 'secondary'
                              }
                            >
                              {submission.status === 'submitted' ? 'Pending' : 'In Progress'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-500 text-sm py-4">
                  No attempts yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Exam Modal */}
      <Modal
        isOpen={showStartModal}
        onClose={() => {
          setShowStartModal(false)
          setAcknowledged(false)
        }}
        title="Start Exam"
      >
        <div className="space-y-4">
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-neutral-100 mb-1">Important</p>
                <ul className="text-neutral-400 space-y-1">
                  <li>• You have {exam.duration_minutes} minutes to complete this exam</li>
                  <li>• The timer will start once you begin</li>
                  <li>• Your answers are auto-saved as you progress</li>
                  <li>• You cannot pause the exam once started</li>
                  <li>• Make sure you have a stable internet connection</li>
                </ul>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-primary-600 bg-primary-800 text-accent focus:ring-accent"
            />
            <span className="text-sm text-neutral-300">
              I understand the instructions and am ready to start the exam
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowStartModal(false)
                setAcknowledged(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartExam}
              disabled={!acknowledged || createSubmission.isPending || !canAttempt?.can_attempt}
              isLoading={createSubmission.isPending}
            >
              Start Exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
