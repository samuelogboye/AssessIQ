import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, Settings, BarChart3, Trash2, Power } from 'lucide-react'
import { Card, CardContent, Badge, Button, Input, Textarea, Skeleton } from '@/components/ui'
import {
  useCourseDetail,
  useCourseExams,
  useUpdateCourse,
  useDeleteCourse,
  useToggleCourseActive,
} from '@/features/instructor'
import { ROUTES } from '@/lib/constants'

type TabKey = 'exams' | 'analytics' | 'settings'

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabKey>('exams')
  const { data: course, isLoading } = useCourseDetail(courseId)
  const { data: examsData, isLoading: examsLoading } = useCourseExams(courseId)
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()
  const toggleCourse = useToggleCourseActive()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  if (isLoading || !course) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const exams = examsData?.results ?? []

  const handleDelete = async () => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return
    await deleteCourse.mutateAsync(courseId)
    navigate(ROUTES.INSTRUCTOR_COURSES)
  }

  const handleSave = async () => {
    await updateCourse.mutateAsync({
      id: courseId,
      data: {
        code: code || course.code,
        name: name || course.name,
        description: description || course.description,
      },
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.INSTRUCTOR_COURSES}
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={course.is_active ? 'success' : 'default'}>
              {course.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-sm text-neutral-500">{course.code}</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">{course.name}</h1>
          <p className="text-neutral-400">{course.description}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => toggleCourse.mutate(courseId)}>
            <Power className="h-4 w-4 mr-2" />
            {course.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'exams', label: 'Exams', icon: FileText },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 },
          { key: 'settings', label: 'Settings', icon: Settings },
        ] as const).map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'exams' && (
        <Card>
          <CardContent className="p-6">
            {examsLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : exams.length > 0 ? (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <Link
                    key={exam.id}
                    to={`/instructor/exams/${exam.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-primary-700/50 hover:bg-primary-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-neutral-100">{exam.title}</p>
                      <p className="text-sm text-neutral-400">{exam.question_count} questions</p>
                    </div>
                    <Badge
                      variant={
                        exam.status === 'published'
                          ? 'success'
                          : exam.status === 'draft'
                          ? 'default'
                          : 'warning'
                      }
                    >
                      {exam.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <BookOpen className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">No exams for this course yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary-700/50 text-center">
              <p className="text-2xl font-bold text-neutral-100">{exams.length}</p>
              <p className="text-sm text-neutral-400">Total Exams</p>
            </div>
            <div className="p-4 rounded-lg bg-primary-700/50 text-center">
              <p className="text-2xl font-bold text-neutral-100">
                {exams.filter((e) => e.status === 'published').length}
              </p>
              <p className="text-sm text-neutral-400">Published</p>
            </div>
            <div className="p-4 rounded-lg bg-primary-700/50 text-center">
              <p className="text-2xl font-bold text-neutral-100">
                {exams.reduce((acc, e) => acc + e.question_count, 0)}
              </p>
              <p className="text-sm text-neutral-400">Total Questions</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm text-neutral-400">Course Code</label>
              <Input defaultValue={course.code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-neutral-400">Course Name</label>
              <Input defaultValue={course.name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-neutral-400">Description</label>
              <Textarea
                defaultValue={course.description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={updateCourse.isPending}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
