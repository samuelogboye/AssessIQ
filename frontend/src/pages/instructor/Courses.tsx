import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Search, Filter, Pencil, Trash2, Power } from 'lucide-react'
import { Card, CardContent, Badge, Button, Input, Modal, Textarea, Skeleton } from '@/components/ui'
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useToggleCourseActive,
} from '@/features/instructor'

type StatusFilter = 'all' | 'active' | 'inactive'

function CourseFormModal({
  isOpen,
  onClose,
  initialValues,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  initialValues?: {
    code: string
    name: string
    description?: string
    is_active: boolean
  }
  onSubmit: (values: {
    code: string
    name: string
    description?: string
    is_active: boolean
  }) => void
  isSubmitting?: boolean
}) {
  const [code, setCode] = useState(initialValues?.code ?? '')
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true)

  const handleSubmit = () => {
    if (!code || !name) return
    onSubmit({ code, name, description, is_active: isActive })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialValues ? 'Edit Course' : 'Create Course'}>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-neutral-400">Course Code</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS101" />
        </div>
        <div>
          <label className="text-sm text-neutral-400">Course Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Introduction to CS" />
        </div>
        <div>
          <label className="text-sm text-neutral-400">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-primary-600 bg-primary-800 text-accent focus:ring-accent"
          />
          Active
        </label>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!code || !name}>
            {initialValues ? 'Save Changes' : 'Create Course'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function InstructorCourses() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editCourse, setEditCourse] = useState<{
    id: number
    code: string
    name: string
    description?: string
    is_active: boolean
  } | null>(null)

  const { data, isLoading } = useCourses({
    search: search || undefined,
    is_active: status === 'all' ? undefined : status === 'active',
  })
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()
  const toggleCourse = useToggleCourseActive()

  const results = useMemo(() => data?.results ?? [], [data?.results])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return
    await deleteCourse.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Courses</h1>
          <p className="text-neutral-400">Manage your courses and their exams</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                className="pl-10"
                placeholder="Search by code or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="pl-10 pr-4 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent appearance-none min-w-[180px]"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-2">
          {isLoading ? (
            <div className="divide-y divide-primary-700">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-neutral-400">
                  <tr className="border-b border-primary-700">
                    <th className="text-left px-4 py-3">Code</th>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Exams</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((course) => (
                    <tr key={course.id} className="border-b border-primary-700">
                      <td className="px-4 py-3 text-neutral-200">
                        <Link
                          to={`/instructor/courses/${course.id}`}
                          className="hover:text-accent"
                        >
                          {course.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-neutral-200">{course.name}</td>
                      <td className="px-4 py-3 text-neutral-400">{course.exam_count}</td>
                      <td className="px-4 py-3">
                        <Badge variant={course.is_active ? 'success' : 'default'}>
                          {course.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditCourse({
                                id: course.id,
                                code: course.code,
                                name: course.name,
                                description: course.description,
                                is_active: course.is_active,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCourse.mutate(course.id)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(course.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-300 mb-2">No courses found</h3>
              <p className="text-neutral-400">Create your first course to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CourseFormModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (values) => {
          await createCourse.mutateAsync(values)
          setShowCreate(false)
        }}
        isSubmitting={createCourse.isPending}
      />

      {editCourse && (
        <CourseFormModal
          isOpen={!!editCourse}
          onClose={() => setEditCourse(null)}
          initialValues={editCourse}
          onSubmit={async (values) => {
            await updateCourse.mutateAsync({ id: editCourse.id, data: values })
            setEditCourse(null)
          }}
          isSubmitting={updateCourse.isPending}
        />
      )}
    </div>
  )
}
