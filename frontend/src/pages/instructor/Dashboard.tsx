import { Link } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  Users,
  ArrowRight,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { ROUTES } from '@/lib/constants'

// Placeholder stats - will be replaced with real data in Sprint 4
const stats = [
  { label: 'Total Courses', value: 4, icon: BookOpen, color: 'text-info' },
  { label: 'Active Exams', value: 8, icon: FileText, color: 'text-success' },
  { label: 'Pending Grading', value: 15, icon: ClipboardCheck, color: 'text-warning' },
  { label: 'Total Students', value: 142, icon: Users, color: 'text-accent' },
]

// Placeholder recent activity
const recentActivity = [
  { id: 1, type: 'submission', message: 'John Doe submitted Midterm Exam', time: '5 min ago' },
  { id: 2, type: 'graded', message: 'Quiz 2 grading completed', time: '1 hour ago' },
  { id: 3, type: 'submission', message: '3 new submissions for CS101 Final', time: '2 hours ago' },
  { id: 4, type: 'published', message: 'MATH201 Quiz 3 published', time: '3 hours ago' },
]

// Placeholder pending grading
const pendingGrading = [
  { id: 1, exam: 'Midterm Exam', course: 'CS101', count: 8, oldest: '2 days ago' },
  { id: 2, exam: 'Essay Assignment', course: 'ENG102', count: 5, oldest: '1 day ago' },
  { id: 3, exam: 'Quiz 3', course: 'MATH201', count: 2, oldest: '3 hours ago' },
]

export default function InstructorDashboard() {
  const { user } = useAuth()

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
            <Link to={ROUTES.INSTRUCTOR_CREATE_EXAM}>
              <Plus className="mr-2 h-4 w-4" />
              New Exam
            </Link>
          </Button>
        </div>
      </div>

      {/* Pending Grading Alert */}
      {pendingGrading.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-neutral-100">
                  {pendingGrading.reduce((acc, p) => acc + p.count, 0)} submissions awaiting grading
                </p>
                <p className="text-sm text-neutral-400">
                  Oldest submission from {pendingGrading[0].oldest}
                </p>
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
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-neutral-100">{stat.value}</p>
              <p className="text-sm text-neutral-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
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
            {pendingGrading.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg bg-primary-700/50 hover:bg-primary-700 transition-colors"
              >
                <div>
                  <p className="font-medium text-neutral-100">{item.exam}</p>
                  <p className="text-sm text-neutral-400">{item.course}</p>
                </div>
                <div className="text-right">
                  <Badge variant="warning">{item.count} pending</Badge>
                  <p className="text-xs text-neutral-400 mt-1">{item.oldest}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-200">{activity.message}</p>
                  <p className="text-xs text-neutral-500">{activity.time}</p>
                </div>
              </div>
            ))}
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
              <Users className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
