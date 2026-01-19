import { ClipboardCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

export default function StudentSubmissions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">My Results</h1>
        <p className="text-neutral-400">View your exam submissions and grades</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-300 mb-2">Coming in Sprint 3</h3>
          <p className="text-neutral-400">
            The submission history and results review will be implemented in the next sprint.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
