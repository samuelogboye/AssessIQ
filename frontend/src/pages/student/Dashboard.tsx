import { Link } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  ChevronRight,
  BookOpen,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, Badge, Skeleton } from '@/components/ui'
import { useAuth } from '@/features/auth'
import {
  useStudentDashboardStats,
  useUpcomingExams,
  useRecentSubmissions,
} from '@/features/student'
import { ROUTES } from '@/lib/constants'
import { formatDistanceToNow, format } from 'date-fns'

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-400">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-neutral-100 mt-1">{value}</p>
            )}
            {description && (
              <p className="text-xs text-neutral-500 mt-1">{description}</p>
            )}
          </div>
          <div className="p-3 bg-primary-700 rounded-lg">
            <Icon className="h-5 w-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingExamCard({
  exam,
}: {
  exam: {
    id: number
    title: string
    course: { name: string; code: string }
    duration_minutes: number
    start_time: string | null
    is_available: boolean
  }
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-primary-700/50 rounded-lg hover:bg-primary-700 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs">
            {exam.course.code}
          </Badge>
          {exam.is_available && (
            <Badge variant="success" className="text-xs">
              Available Now
            </Badge>
          )}
        </div>
        <h4 className="font-medium text-neutral-100 truncate">{exam.title}</h4>
        <div className="flex items-center gap-3 mt-1 text-sm text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {exam.duration_minutes} min
          </span>
          {exam.start_time && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(exam.start_time), 'MMM d, h:mm a')}
            </span>
          )}
        </div>
      </div>
      <Link
        to={`/student/exams/${exam.id}`}
        className="ml-4 p-2 text-neutral-400 hover:text-accent transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  )
}

function RecentResultRow({
  submission,
}: {
  submission: {
    id: number
    exam_title: string
    course_code: string
    status: string
    total_score: number | null
    percentage: number | null
    total_marks: number
    is_passed: boolean | null
    submitted_at: string | null
  }
}) {
  const getStatusBadge = () => {
    switch (submission.status) {
      case 'graded':
        return submission.is_passed ? (
          <Badge variant="success">Passed</Badge>
        ) : (
          <Badge variant="error">Failed</Badge>
        )
      case 'submitted':
        return <Badge variant="warning">Pending</Badge>
      default:
        return <Badge variant="secondary">In Progress</Badge>
    }
  }

  return (
    <Link
      to={`/student/submissions/${submission.id}/review`}
      className="flex items-center justify-between p-3 hover:bg-primary-700/50 rounded-lg transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{submission.course_code}</span>
        </div>
        <p className="font-medium text-neutral-200 truncate">{submission.exam_title}</p>
        {submission.submitted_at && (
          <p className="text-xs text-neutral-500">
            {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {submission.status === 'graded' && submission.percentage !== null && (
          <span className="text-lg font-semibold text-neutral-100">
            {Math.round(submission.percentage)}%
          </span>
        )}
        {getStatusBadge()}
      </div>
    </Link>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useStudentDashboardStats()
  const { data: upcomingExams, isLoading: examsLoading } = useUpcomingExams(5)
  const { data: recentSubmissions, isLoading: submissionsLoading } = useRecentSubmissions(5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">
          Welcome back, {user?.first_name || 'Student'}
        </h1>
        <p className="text-neutral-400">Here's an overview of your academic progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Upcoming Exams"
          value={stats?.upcoming_exams_count ?? 0}
          icon={Calendar}
          description="Available to take"
          isLoading={statsLoading}
        />
        <StatCard
          title="Completed Exams"
          value={stats?.completed_exams_count ?? 0}
          icon={CheckCircle2}
          description="Total submissions"
          isLoading={statsLoading}
        />
        <StatCard
          title="Average Score"
          value={stats?.average_score ? `${Math.round(stats.average_score)}%` : 'N/A'}
          icon={TrendingUp}
          description="Across all exams"
          isLoading={statsLoading}
        />
        <StatCard
          title="Pending Results"
          value={stats?.pending_results_count ?? 0}
          icon={Clock}
          description="Awaiting grading"
          isLoading={statsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-neutral-100">Upcoming Exams</h3>
            </div>
            <Link
              to={ROUTES.STUDENT_EXAMS}
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {examsLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : upcomingExams && upcomingExams.length > 0 ? (
              upcomingExams.map((exam) => (
                <UpcomingExamCard key={exam.id} exam={exam} />
              ))
            ) : (
              <div className="py-8 text-center">
                <BookOpen className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No upcoming exams</p>
                <p className="text-sm text-neutral-500">Check back later for new assessments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-neutral-100">Recent Results</h3>
            </div>
            <Link
              to={ROUTES.STUDENT_SUBMISSIONS}
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {submissionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentSubmissions && recentSubmissions.length > 0 ? (
              <div className="divide-y divide-primary-600">
                {recentSubmissions.map((submission) => (
                  <RecentResultRow key={submission.id} submission={submission} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <AlertCircle className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No results yet</p>
                <p className="text-sm text-neutral-500">Complete an exam to see your results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-neutral-100 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.STUDENT_EXAMS}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-primary-900 font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              <FileText className="h-4 w-4" />
              Browse Exams
            </Link>
            <Link
              to={ROUTES.STUDENT_SUBMISSIONS}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-neutral-100 font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              View All Results
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
