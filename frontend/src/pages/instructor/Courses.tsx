import { BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

export default function InstructorCourses() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Courses</h1>
        <p className="text-neutral-400">Manage your courses and their exams</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-300 mb-2">Coming in Sprint 4</h3>
          <p className="text-neutral-400">
            Course management features will be implemented in Sprint 4.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
