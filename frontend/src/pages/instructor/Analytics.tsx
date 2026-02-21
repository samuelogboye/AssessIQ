import { useMemo, useState } from 'react'
import { BarChart3, TrendingUp, ClipboardCheck, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { useInstructorDashboardStats, useExams, useExamStatistics } from '@/features/instructor'
import { useGradingTaskStats } from '@/features/grading'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'

type Period = '7d' | '30d' | 'all'

export default function InstructorAnalytics() {
  const [period, setPeriod] = useState<Period>('7d')
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>()

  const { data: stats } = useInstructorDashboardStats()
  const { data: tasksStats } = useGradingTaskStats()
  const { data: examsData } = useExams({})
  const { data: examStats } = useExamStatistics(selectedExamId ?? 0)

  const submissionTrend = useMemo(
    () =>
      Array.from({ length: period === '7d' ? 7 : period === '30d' ? 30 : 12 }).map((_, idx) => ({
        label: period === 'all' ? `M${idx + 1}` : `D${idx + 1}`,
        submissions: Math.max(1, Math.round((stats?.recent_submissions ?? 10) / 7) + (idx % 4)),
      })),
    [period, stats?.recent_submissions]
  )

  const scoreDistribution = examStats?.score_distribution ?? [
    { range: '0-49', count: 2 },
    { range: '50-69', count: 6 },
    { range: '70-89', count: 9 },
    { range: '90-100', count: 4 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Analytics</h1>
          <p className="text-neutral-400">Insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as Period[]).map((p) => (
            <Button key={p} variant={period === p ? 'primary' : 'secondary'} onClick={() => setPeriod(p)}>
              {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'All time'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-100">{stats?.active_exams ?? 0}</p>
            <p className="text-sm text-neutral-400">Active Exams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ClipboardCheck className="h-5 w-5 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-100">{stats?.recent_submissions ?? 0}</p>
            <p className="text-sm text-neutral-400">Recent Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-100">{examStats?.average_score ?? 0}%</p>
            <p className="text-sm text-neutral-400">Avg Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-100">{tasksStats?.completed ?? 0}</p>
            <p className="text-sm text-neutral-400">Grading Tasks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Exam Insights</CardTitle>
          <select
            value={selectedExamId ?? ''}
            onChange={(e) => setSelectedExamId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
          >
            <option value="">Select exam</option>
            {examsData?.results?.map((exam) => (
              <option key={exam.id} value={exam.id}>{exam.title}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionTrend}>
                <XAxis dataKey="label" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {examStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Badge variant="default">Total Submissions</Badge>
              <p className="text-2xl font-bold text-neutral-100 mt-2">{examStats.total_submissions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Badge variant="success">Pass Rate</Badge>
              <p className="text-2xl font-bold text-neutral-100 mt-2">{examStats.pass_rate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Badge variant="warning">Highest</Badge>
              <p className="text-2xl font-bold text-neutral-100 mt-2">{examStats.highest_score}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Badge variant="error">Lowest</Badge>
              <p className="text-2xl font-bold text-neutral-100 mt-2">{examStats.lowest_score}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
