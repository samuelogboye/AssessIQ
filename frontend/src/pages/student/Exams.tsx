import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Clock,
  FileText,
  CheckCircle,
  Calendar,
  BookOpen,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, Badge, Skeleton, Input, Button } from '@/components/ui'
import { useStudentExams, useCourses } from '@/features/student'
import { format } from 'date-fns'
import type { StudentExam } from '@/types'

type AvailabilityFilter = 'all' | 'available' | 'upcoming' | 'past'
type SortOption = 'date' | 'title'

function ExamCard({ exam }: { exam: StudentExam }) {
  const getAvailabilityBadge = () => {
    if (exam.is_available) {
      return <Badge variant="success">Available Now</Badge>
    }
    if (exam.start_time && new Date(exam.start_time) > new Date()) {
      return <Badge variant="warning">Upcoming</Badge>
    }
    if (exam.end_time && new Date(exam.end_time) < new Date()) {
      return <Badge variant="secondary">Ended</Badge>
    }
    return null
  }

  return (
    <Card className="hover:border-primary-500 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <Badge variant="secondary" className="text-xs">
              {exam.course.code}
            </Badge>
            {getAvailabilityBadge()}
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-semibold text-neutral-100 mb-2">{exam.title}</h3>
          <p className="text-sm text-neutral-400 line-clamp-2 mb-4 flex-grow">
            {exam.course.name}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-neutral-400">
              <Clock className="h-4 w-4" />
              <span>{exam.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <FileText className="h-4 w-4" />
              <span>{exam.question_count} questions</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <CheckCircle className="h-4 w-4" />
              <span>{exam.total_marks} marks</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <Calendar className="h-4 w-4" />
              <span>
                {exam.attempts_remaining === -1
                  ? 'Unlimited'
                  : `${exam.attempts_remaining} left`}
              </span>
            </div>
          </div>

          {/* Schedule */}
          {exam.start_time && (
            <div className="text-xs text-neutral-500 mb-4">
              {exam.end_time ? (
                <>
                  {format(new Date(exam.start_time), 'MMM d, h:mm a')} -{' '}
                  {format(new Date(exam.end_time), 'MMM d, h:mm a')}
                </>
              ) : (
                <>Starts: {format(new Date(exam.start_time), 'MMM d, h:mm a')}</>
              )}
            </div>
          )}

          {/* Best Score */}
          {exam.best_score !== null && (
            <div className="text-sm text-neutral-400 mb-4">
              Best score:{' '}
              <span className="font-semibold text-accent">
                {Math.round(exam.best_score)}%
              </span>
            </div>
          )}

          {/* Action Button */}
          <Link
            to={`/student/exams/${exam.id}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-700 text-neutral-100 font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            {exam.is_available ? 'Start' : 'View Details'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function ExamCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export default function StudentExams() {
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<number | undefined>()
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('date')

  const { data: examsData, isLoading: examsLoading } = useStudentExams({
    search: searchQuery || undefined,
    course: courseFilter,
    available_only: availabilityFilter === 'available' ? true : undefined,
  })

  const { data: coursesData } = useCourses()

  const filteredExams = useMemo(() => {
    const base = examsData?.results?.filter((exam) => {
      if (availabilityFilter === 'available') return exam.is_available
      if (availabilityFilter === 'upcoming') {
        return exam.start_time && new Date(exam.start_time) > new Date()
      }
      if (availabilityFilter === 'past') {
        return exam.end_time && new Date(exam.end_time) < new Date()
      }
      return true
    }) || []

    return [...base].sort((a, b) => {
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title)
      }
      const aTime = a.start_time ? new Date(a.start_time).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.start_time ? new Date(b.start_time).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
  }, [examsData?.results, availabilityFilter, sortOption])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Available Exams</h1>
        <p className="text-neutral-400">Browse and take your assigned exams</p>
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
                placeholder="Search exams..."
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
                onChange={(e) =>
                  setCourseFilter(e.target.value ? Number(e.target.value) : undefined)
                }
                className="pl-10 pr-4 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent appearance-none min-w-[180px]"
              >
                <option value="">All Courses</option>
                {coursesData?.results?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div className="flex gap-2">
              {(['all', 'available', 'upcoming', 'past'] as AvailabilityFilter[]).map(
                (filter) => (
                  <Button
                    key={filter}
                    variant={availabilityFilter === filter ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setAvailabilityFilter(filter)}
                  >
                    {filter === 'all' && 'All'}
                    {filter === 'available' && 'Available'}
                    {filter === 'upcoming' && 'Upcoming'}
                    {filter === 'past' && 'Past'}
                  </Button>
                )
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="pl-4 pr-8 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent appearance-none min-w-[160px]"
              >
                <option value="date">Sort: Date</option>
                <option value="title">Sort: Title</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams Grid */}
      {examsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ExamCardSkeleton />
          <ExamCardSkeleton />
          <ExamCardSkeleton />
          <ExamCardSkeleton />
          <ExamCardSkeleton />
          <ExamCardSkeleton />
        </div>
      ) : filteredExams && filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            {searchQuery || courseFilter || availabilityFilter !== 'all' ? (
              <>
                <AlertCircle className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-300 mb-2">
                  No exams found
                </h3>
                <p className="text-neutral-400">
                  Try adjusting your search or filters to find exams.
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('')
                    setCourseFilter(undefined)
                    setAvailabilityFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <BookOpen className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-300 mb-2">
                  No exams available
                </h3>
                <p className="text-neutral-400">
                  There are no exams assigned to you at the moment. Check back later!
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination info */}
      {examsData && examsData.count > 0 && (
        <div className="text-center text-sm text-neutral-500">
          Showing {filteredExams?.length ?? 0} of {examsData.count} exams
        </div>
      )}
    </div>
  )
}
