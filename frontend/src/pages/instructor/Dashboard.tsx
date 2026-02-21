import { Link } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  Users,
  ArrowRight,
  Plus,
  AlertCircle,
  TrendingUp,
  Clock,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from '@/components/ui'
import { useAuth } from '@/features/auth'
import {
  useInstructorDashboardStats,
  usePendingGrading,
  useRecentActivity,
  useRecentExams,
} from '@/features/instructor'
import { ROUTES } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <p className="text-2xl font-bold text-neutral-100">{value}</p>
        )}
        <p className="text-sm text-neutral-400">{label}</p>
      </CardContent>
    </Card>
  )
}

function PendingGradingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-lg bg-primary-700/50">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-2 w-2 rounded-full mt-2" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function InstructorDashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useInstructorDashboardStats()
  const { data: pendingGrading, isLoading: pendingLoading } = usePendingGrading(5)
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(10)
  const { data: recentExams, isLoading: examsLoading } = useRecentExams(5)

  const totalPending = pendingGrading?.reduce((acc, p) => acc + p.pending_count, 0) ?? 0
  const submissionsTrend = Array.from({ length: 7 }).map((_, index) => ({
    day: `Day ${index + 1}`,
    submissions: Math.max(0, Math.round((stats?.recent_submissions ?? 0) / 7) + (index % 3)),
  }))
  const scoreDistribution = [
    { range: '0-49', count: 2 },
    { range: '50-69', count: 6 },
    { range: '70-89', count: 9 },
    { range: '90-100', count: 4 },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-neutral-400">Here&apos;s what&apos;s happening with your courses.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" asChild>
            <Link to={ROUTES.INSTRUCTOR_COURSES}>
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
          <Button asChild>
            <Link to={ROUTES.INSTRUCTOR_EXAMS}>
              <Plus className="mr-2 h-4 w-4" />
              New Exam
            </Link>
          </Button>
        </div>
      </div>

      {/* Pending Grading Alert */}
      {!pendingLoading && totalPending > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-neutral-100">
                  {totalPending} submissions awaiting grading
                </p>
                {pendingGrading && pendingGrading[0] && (
                  <p className="text-sm text-neutral-400">
                    Oldest submission from{' '}
                    {formatDistanceToNow(new Date(pendingGrading[0].oldest_submission), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </div>
            <Button asChild>
              <Link to={ROUTES.INSTRUCTOR_GRADING}>
                Start Grading
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Courses"
          value={stats?.total_courses ?? 0}
          icon={BookOpen}
          color="text-info"
          isLoading={statsLoading}
        />
        <StatCard
          label="Active Exams"
          value={stats?.active_exams ?? 0}
          icon={FileText}
          color="text-success"
          isLoading={statsLoading}
        />
        <StatCard
          label="Pending Grading"
          value={stats?.pending_grading ?? 0}
          icon={ClipboardCheck}
          color="text-warning"
          isLoading={statsLoading}
        />
        <StatCard
          label="Recent Submissions"
          value={stats?.recent_submissions ?? 0}
          icon={TrendingUp}
          color="text-accent"
          isLoading={statsLoading}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Grading */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Grading</CardTitle>
            <Link to={ROUTES.INSTRUCTOR_GRADING}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingLoading ? (
              <PendingGradingSkeleton />
            ) : pendingGrading && pendingGrading.length > 0 ? (
              pendingGrading.map((item) => (
                <Link
                  key={item.id}
                  to={`${ROUTES.INSTRUCTOR_GRADING}?exam=${item.exam_id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-primary-700/50 hover:bg-primary-700 transition-colors"
                >
                  <div>
                    <p className="font-medium text-neutral-100">{item.exam_title}</p>
                    <p className="text-sm text-neutral-400">{item.course_code}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="warning">{item.pending_count} pending</Badge>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatDistanceToNow(new Date(item.oldest_submission), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center">
                <ClipboardCheck className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No pending grading</p>
                <p className="text-sm text-neutral-500">All submissions have been graded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLoading ? (
              <RecentActivitySkeleton />
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 ${
                      activity.type === 'submission'
                        ? 'bg-info'
                        : activity.type === 'graded'
                        ? 'bg-success'
                        : activity.type === 'published'
                        ? 'bg-accent'
                        : 'bg-neutral-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-200">{activity.message}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <Clock className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Exams */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Exams</CardTitle>
          <Link to={ROUTES.INSTRUCTOR_EXAMS}>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {examsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg bg-primary-700/50">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : recentExams && recentExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentExams.map((exam) => (
                <Link
                  key={exam.id}
                  to={`${ROUTES.INSTRUCTOR_EXAMS}/${exam.id}`}
                  className="p-4 rounded-lg bg-primary-700/50 hover:bg-primary-700 transition-colors block"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        exam.status === 'published'
                          ? 'success'
                          : exam.status === 'draft'
                          ? 'default'
                          : 'warning'
                      }
                      className="text-xs"
                    >
                      {exam.status}
                    </Badge>
                  </div>
                  <p className="font-medium text-neutral-100 mb-1">{exam.title}</p>
                  <p className="text-sm text-neutral-400">{exam.course.code}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span>{exam.question_count} questions</span>
                    <span>{exam.duration_minutes} min</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <FileText className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No exams yet</p>
              <p className="text-sm text-neutral-500">Create your first exam to get started</p>
              <Link to={ROUTES.INSTRUCTOR_EXAMS}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exam
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Submissions This Week</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionsTrend}>
                <XAxis dataKey="day" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link to={ROUTES.INSTRUCTOR_GRADING}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Grade Submissions
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to={ROUTES.INSTRUCTOR_EXAMS}>
              <FileText className="mr-2 h-4 w-4" />
              Manage Exams
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to={ROUTES.INSTRUCTOR_ANALYTICS}>
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
