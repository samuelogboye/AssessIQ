import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  ArrowUpDown,
} from 'lucide-react'
import { Card, CardContent, Badge, Skeleton, Input, Button } from '@/components/ui'
import { useSubmissions, useCourses } from '@/features/student'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { SubmissionStatus } from '@/types'

type StatusFilter = 'all' | SubmissionStatus
type SortKey = 'exam' | 'course' | 'date' | 'score' | 'status'

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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const navigate = useNavigate()

  const { data: submissionsData, isLoading } = useSubmissions({
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    course: courseFilter,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    page_size: pageSize,
  })

  const { data: coursesData } = useCourses()

  const sortedResults = useMemo(() => {
    const results = submissionsData?.results ? [...submissionsData.results] : []
    const dir = sortDir === 'asc' ? 1 : -1

    return results.sort((a, b) => {
      switch (sortKey) {
        case 'exam':
          return a.exam_title.localeCompare(b.exam_title) * dir
        case 'course':
          return a.course_code.localeCompare(b.course_code) * dir
        case 'score':
          return ((a.percentage ?? -1) - (b.percentage ?? -1)) * dir
        case 'status':
          return a.status.localeCompare(b.status) * dir
        case 'date':
        default: {
          const aDate = a.submitted_at ?? a.started_at
          const bDate = b.submitted_at ?? b.started_at
          return (new Date(aDate).getTime() - new Date(bDate).getTime()) * dir
        }
      }
    })
  }, [submissionsData?.results, sortDir, sortKey])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

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
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>

            {/* Course Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <select
                value={courseFilter ?? ''}
                onChange={(e) => {
                  setCourseFilter(e.target.value ? Number(e.target.value) : undefined)
                  setPage(1)
                }}
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
                  onClick={() => {
                    setStatusFilter(status)
                    setPage(1)
                  }}
                >
                  {status === 'all' && 'All'}
                  {status === 'graded' && 'Graded'}
                  {status === 'submitted' && 'Pending'}
                  {status === 'in_progress' && 'In Progress'}
                </Button>
              ))}
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
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
          ) : sortedResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-neutral-400">
                  <tr className="border-b border-primary-700">
                    <th className="text-left px-4 py-3">
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() => handleSort('exam')}
                      >
                        Exam
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() => handleSort('course')}
                      >
                        Course
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() => handleSort('date')}
                      >
                        Date
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() => handleSort('score')}
                      >
                        Score
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-primary-700 hover:bg-primary-700/50 cursor-pointer"
                      onClick={() => navigate(`/student/submissions/${submission.id}/review`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-100">
                          {submission.exam_title}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Attempt #{submission.attempt_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {submission.course_code}
                      </td>
                      <td className="px-4 py-3 text-neutral-300">
                        {submission.submitted_at
                          ? format(new Date(submission.submitted_at), 'MMM d, yyyy')
                          : format(new Date(submission.started_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        {submission.status === 'graded' && submission.percentage !== null ? (
                          <span
                            className={cn(
                              'font-semibold',
                              submission.is_passed ? 'text-success' : 'text-error'
                            )}
                          >
                            {Math.round(submission.percentage)}%
                          </span>
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {submission.status === 'graded' ? (
                          submission.is_passed ? (
                            <Badge variant="success">Passed</Badge>
                          ) : (
                            <Badge variant="error">Failed</Badge>
                          )
                        ) : submission.status === 'submitted' ? (
                          <Badge variant="warning">Pending</Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              {searchQuery || statusFilter !== 'all' || courseFilter || dateFrom || dateTo ? (
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
                      setDateFrom('')
                      setDateTo('')
                      setPage(1)
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
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <div>
            Showing {sortedResults.length} of {submissionsData.count} submissions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-neutral-400">Page {page}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={submissionsData.next === null}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
