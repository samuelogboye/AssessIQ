import { Link } from 'react-router-dom'
import { FileText, ClipboardCheck, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from '@/components/ui'
import { useAuth } from '@/features/auth'
import { ROUTES } from '@/lib/constants'

// Placeholder stats - will be replaced with real data in Sprint 3
const stats = [
  { label: 'Upcoming Exams', value: 3, icon: Clock, color: 'text-info' },
  { label: 'Completed Exams', value: 12, icon: ClipboardCheck, color: 'text-success' },
  { label: 'Average Score', value: '78%', icon: TrendingUp, color: 'text-accent' },
  { label: 'Pending Results', value: 2, icon: FileText, color: 'text-warning' },
]

// Placeholder upcoming exams
const upcomingExams = [
  { id: 1, title: 'Midterm Exam', course: 'CS101', date: '2024-02-15', duration: '2 hours' },
  { id: 2, title: 'Quiz 3', course: 'MATH201', date: '2024-02-18', duration: '45 min' },
  { id: 3, title: 'Final Project', course: 'ENG102', date: '2024-02-20', duration: '3 hours' },
]

// Placeholder recent results
const recentResults = [
  { id: 1, title: 'Quiz 2', course: 'CS101', score: 85, passed: true, date: '2024-02-10' },
  { id: 2, title: 'Midterm', course: 'MATH201', score: 72, passed: true, date: '2024-02-08' },
  { id: 3, title: 'Essay', course: 'ENG102', score: 45, passed: false, date: '2024-02-05' },
]

export default function StudentDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-neutral-400">Here&apos;s an overview of your academic progress.</p>
      </div>

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
        {/* Upcoming Exams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Exams</CardTitle>
            <Link to={ROUTES.STUDENT_EXAMS}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-4 rounded-lg bg-primary-700/50 hover:bg-primary-700 transition-colors"
              >
                <div>
                  <p className="font-medium text-neutral-100">{exam.title}</p>
                  <p className="text-sm text-neutral-400">
                    {exam.course} &middot; {exam.duration}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-300">{exam.date}</p>
                  <Button size="sm" variant="secondary" className="mt-2">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Results</CardTitle>
            <Link to={ROUTES.STUDENT_SUBMISSIONS}>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-4 rounded-lg bg-primary-700/50"
              >
                <div>
                  <p className="font-medium text-neutral-100">{result.title}</p>
                  <p className="text-sm text-neutral-400">{result.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-neutral-100">{result.score}%</p>
                  <Badge variant={result.passed ? 'success' : 'error'}>
                    {result.passed ? 'Passed' : 'Failed'}
                  </Badge>
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
            <Link to={ROUTES.STUDENT_EXAMS}>
              <FileText className="mr-2 h-4 w-4" />
              Browse Exams
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to={ROUTES.STUDENT_SUBMISSIONS}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              View All Results
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
