import { BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

export default function InstructorAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Analytics</h1>
        <p className="text-neutral-400">View insights and performance metrics</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-300 mb-2">Coming in Sprint 5</h3>
          <p className="text-neutral-400">
            Analytics dashboard and reporting will be implemented in Sprint 5.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
