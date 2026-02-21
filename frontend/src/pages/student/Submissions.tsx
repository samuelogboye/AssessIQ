import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  FileText,
} from 'lucide-react'
import { Card, CardContent, Badge, Skeleton, Input, Button } from '@/components/ui'
import { useSubmissions } from '@/features/student'
import { coursesApi } from '@/api'
import { useQuery } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { SubmissionStatus } from '@/types'

type StatusFilter = 'all' | SubmissionStatus

function SubmissionRow({
  submission,
}: {
  submission: {
    id: number
    exam_title: string
    exam_id: number
    course_name: string
    course_code: string
    attempt_number: number
    status: SubmissionStatus
    total_score: number | null
    percentage: number | null
    total_marks: number
    passing_marks: number
    started_at: string
    submitted_at: string | null
    graded_at: string | null
    is_passed: boolean | null
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
        return <Badge variant="warning">Pending Grading</Badge>
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>
      default:
        return null
    }
  }

  const getStatusIcon = () => {
    if (submission.status === 'graded') {
      return submission.is_passed ? (
        <CheckCircle className="h-5 w-5 text-success" />
      ) : (
        <XCircle className="h-5 w-5 text-error" />
      )
    }
    if (submission.status === 'submitted') {
      return <Clock className="h-5 w-5 text-warning" />
    }
    return <FileText className="h-5 w-5 text-neutral-500" />
  }

  return (
    <Link
      to={`/student/submissions/${submission.id}/review`}
      className="flex items-center gap-4 p-4 hover:bg-primary-700/50 rounded-lg transition-colors"
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">{getStatusIcon()}</div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-neutral-500">{submission.course_code}</span>
          <span className="text-xs text-neutral-600">•</span>
          <span className="text-xs text-neutral-500">Attempt #{submission.attempt_number}</span>
        </div>
        <h4 className="font-medium text-neutral-100 truncate">{submission.exam_title}</h4>
        <p className="text-sm text-neutral-500">
          {submission.submitted_at
            ? formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })
            : 'Started ' + formatDistanceToNow(new Date(submission.started_at), { addSuffix: true })}
        </p>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        {submission.status === 'graded' && submission.percentage !== null ? (
          <div>
            <p
              className={cn(
                'text-xl font-bold',
                submission.is_passed ? 'text-success' : 'text-error'
              )}
            >
              {Math.round(submission.percentage)}%
            </p>
            <p className="text-xs text-neutral-500">
              {submission.total_score}/{submission.total_marks}
            </p>
          </div>
        ) : (
          getStatusBadge()
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-neutral-500 flex-shrink-0" />
    </Link>
  )
}

function SubmissionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-5 w-48 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

export default function StudentSubmissions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [courseFilter, setCourseFilter] = useState<number | undefined>()

  const { data: submissionsData, isLoading } = useSubmissions({
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    course: courseFilter,
  })

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list({ is_active: true }),
  })

  // Calculate summary stats
  const stats = submissionsData?.results
    ? {
        total: submissionsData.count,
        graded: submissionsData.results.filter((s) => s.status === 'graded').length,
        passed: submissionsData.results.filter((s) => s.is_passed === true).length,
        avgScore:
          submissionsData.results
            .filter((s) => s.percentage !== null)
            .reduce((sum, s) => sum + (s.percentage ?? 0), 0) /
            submissionsData.results.filter((s) => s.percentage !== null).length || 0,
      }
    : { total: 0, graded: 0, passed: 0, avgScore: 0 }

  const handleExportCSV = () => {
    if (!submissionsData?.results) return

    const headers = ['Exam', 'Course', 'Attempt', 'Status', 'Score', 'Percentage', 'Date']
    const rows = submissionsData.results.map((s) => [
      s.exam_title,
      s.course_code,
      s.attempt_number,
      s.status,
      s.total_score ?? '',
      s.percentage ? `${Math.round(s.percentage)}%` : '',
      s.submitted_at ? format(new Date(s.submitted_at), 'yyyy-MM-dd HH:mm') : '',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">My Results</h1>
          <p className="text-neutral-400">View your exam submissions and grades</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV} disabled={!submissionsData?.results?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-neutral-100">{stats.total}</p>
            <p className="text-sm text-neutral-400">Total Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-neutral-100">{stats.graded}</p>
            <p className="text-sm text-neutral-400">Graded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.passed}</p>
            <p className="text-sm text-neutral-400">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">
              {stats.avgScore ? `${Math.round(stats.avgScore)}%` : 'N/A'}
            </p>
            <p className="text-sm text-neutral-400">Avg. Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                type="text"
                placeholder="Search by exam name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Course Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <select
                value={courseFilter ?? ''}
                onChange={(e) => setCourseFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="pl-10 pr-4 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent appearance-none min-w-[180px]"
              >
                <option value="">All Courses</option>
                {coursesData?.results?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'graded', 'submitted', 'in_progress'] as StatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' && 'All'}
                  {status === 'graded' && 'Graded'}
                  {status === 'submitted' && 'Pending'}
                  {status === 'in_progress' && 'In Progress'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card>
        <CardContent className="p-2">
          {isLoading ? (
            <div className="divide-y divide-primary-700">
              <SubmissionRowSkeleton />
              <SubmissionRowSkeleton />
              <SubmissionRowSkeleton />
              <SubmissionRowSkeleton />
              <SubmissionRowSkeleton />
            </div>
          ) : submissionsData?.results && submissionsData.results.length > 0 ? (
            <div className="divide-y divide-primary-700">
              {submissionsData.results.map((submission) => (
                <SubmissionRow key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              {searchQuery || statusFilter !== 'all' || courseFilter ? (
                <>
                  <AlertCircle className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-300 mb-2">No results found</h3>
                  <p className="text-neutral-400">Try adjusting your search or filters.</p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setCourseFilter(undefined)
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-300 mb-2">No submissions yet</h3>
                  <p className="text-neutral-400">Take an exam to see your results here.</p>
                  <Link to="/student/exams">
                    <Button className="mt-4">Browse Exams</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {submissionsData && submissionsData.count > 0 && (
        <div className="text-center text-sm text-neutral-500">
          Showing {submissionsData.results?.length ?? 0} of {submissionsData.count} submissions
        </div>
      )}
    </div>
  )
}
