import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

export default function StudentExams() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Available Exams</h1>
        <p className="text-neutral-400">Browse and take your assigned exams</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-300 mb-2">Coming in Sprint 3</h3>
          <p className="text-neutral-400">
            The exam listing and exam-taking interface will be implemented in the next sprint.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
