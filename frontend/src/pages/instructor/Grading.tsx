import { useMemo, useState } from 'react'
import {
  ClipboardCheck,
  Filter,
  Search,
  RefreshCcw,
  CheckSquare,
  Bot,
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle,
  Settings,
  ListChecks,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  Skeleton,
  Textarea,
} from '@/components/ui'
import {
  usePendingGradingSubmissions,
  useSubmissionAnswersForGrading,
  useBulkGradeSubmissions,
  useBulkGradeAnswers,
  useAutoGradeSubmission,
  useGradingTasks,
  useGradingTaskStats,
  useGradingConfigs,
  useGradingServices,
  useCreateGradingConfig,
  useUpdateGradingConfig,
  useDeleteGradingConfig,
} from '@/features/grading'
import { useExams, useCourses, useExamQuestions } from '@/features/instructor'
import { formatDistanceToNow } from 'date-fns'
import type { GradingAnswer, GradingConfiguration } from '@/types'

type TabKey = 'queue' | 'tasks' | 'config'

export default function InstructorGrading() {
  const [activeTab, setActiveTab] = useState<TabKey>('queue')
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState<number | undefined>()
  const [examId, setExamId] = useState<number | undefined>()
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<number[]>([])
  const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(null)
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [forceRegrade, setForceRegrade] = useState(false)

  const { data: pending, isLoading: pendingLoading } = usePendingGradingSubmissions()
  const { data: coursesData } = useCourses({ is_active: true })
  const { data: examsData } = useExams({})
  const bulkGrade = useBulkGradeSubmissions()
  const autoGrade = useAutoGradeSubmission()
  const bulkGradeAnswers = useBulkGradeAnswers()

  const { data: answersData, isLoading: answersLoading } = useSubmissionAnswersForGrading(
    activeSubmissionId ?? 0
  )

  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useGradingTasks()
  const { data: taskStats } = useGradingTaskStats()

  const { data: configs } = useGradingConfigs()
  const { data: services } = useGradingServices()
  const createConfig = useCreateGradingConfig()
  const updateConfig = useUpdateGradingConfig()
  const deleteConfig = useDeleteGradingConfig()

  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<GradingConfiguration | null>(null)

  const filteredPending = useMemo(() => {
    const base = pending ?? []
    return base.filter((item) => {
      if (search && !item.exam_title.toLowerCase().includes(search.toLowerCase())) return false
      if (courseId && item.course_name !== coursesData?.results?.find((c) => c.id === courseId)?.name) return false
      if (examId && !item.exam_title.toLowerCase().includes(examsData?.results?.find((e) => e.id === examId)?.title?.toLowerCase() || '')) return false
      return true
    })
  }, [pending, search, courseId, examId, coursesData?.results, examsData?.results])

  const totalPending = filteredPending.length
  const oldest = filteredPending
    .map((s) => s.submitted_at)
    .filter(Boolean)
    .sort()[0]

  const [draftGrades, setDraftGrades] = useState<Record<number, { score: number; feedback: string }>>({})

  const answers = answersData ?? []
  const currentAnswer = answers[currentAnswerIndex]

  const handleSelectSubmission = (id: number) => {
    setActiveSubmissionId(id)
    setCurrentAnswerIndex(0)
    setDraftGrades({})
  }

  const handleSaveGrades = async () => {
    if (!activeSubmissionId) return
    const grades = Object.entries(draftGrades)
      .map(([answerId, grade]) => ({ answer_id: Number(answerId), score: grade.score, feedback: grade.feedback }))
      .filter((g) => !Number.isNaN(g.score))
    if (grades.length === 0) return
    await bulkGradeAnswers.mutateAsync({ submissionId: activeSubmissionId, grades })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Grading</h1>
          <p className="text-neutral-400">Review, grade, and configure grading</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setActiveTab('queue')}>
            <ListChecks className="h-4 w-4 mr-2" />Queue
          </Button>
          <Button variant="secondary" onClick={() => setActiveTab('tasks')}>
            <ClipboardCheck className="h-4 w-4 mr-2" />Tasks
          </Button>
          <Button variant="secondary" onClick={() => setActiveTab('config')}>
            <Settings className="h-4 w-4 mr-2" />Config
          </Button>
        </div>
      </div>

      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-neutral-100">{totalPending}</p>
                <p className="text-sm text-neutral-400">Pending Submissions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-neutral-100">
                  {oldest ? formatDistanceToNow(new Date(oldest), { addSuffix: true }) : '—'}
                </p>
                <p className="text-sm text-neutral-400">Oldest Submission</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-neutral-100">
                  {filteredPending.filter((s) => s.flagged_for_review).length}
                </p>
                <p className="text-sm text-neutral-400">Flagged for Review</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    className="pl-10"
                    placeholder="Search by exam"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <select
                    value={courseId ?? ''}
                    onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : undefined)}
                    className="pl-10 pr-4 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent appearance-none min-w-[200px]"
                  >
                    <option value="">All Courses</option>
                    {coursesData?.results?.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <select
                    value={examId ?? ''}
                    onChange={(e) => setExamId(e.target.value ? Number(e.target.value) : undefined)}
                    className="pl-4 pr-4 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent appearance-none min-w-[220px]"
                  >
                    <option value="">All Exams</option>
                    {examsData?.results?.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedSubmissionIds.length > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Badge variant="warning">{selectedSubmissionIds.length} selected</Badge>
                <Button variant="secondary" onClick={() => setShowBulkModal(true)}>
                  <Bot className="h-4 w-4 mr-2" />
                  Auto-grade Selected
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-2">
                {pendingLoading ? (
                  <div className="divide-y divide-primary-700">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))}
                  </div>
                ) : filteredPending.length > 0 ? (
                  <div className="divide-y divide-primary-700">
                    {filteredPending.map((submission) => (
                      <div
                        key={submission.id}
                        className={`p-4 cursor-pointer hover:bg-primary-700/50 ${
                          activeSubmissionId === submission.id ? 'bg-primary-700/50' : ''
                        }`}
                        onClick={() => handleSelectSubmission(submission.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-neutral-100 font-medium">{submission.exam_title}</p>
                            <p className="text-xs text-neutral-500">
                              {submission.student?.email} • Attempt #{submission.attempt_number}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedSubmissionIds.includes(submission.id)}
                              onChange={(e) => {
                                setSelectedSubmissionIds((prev) =>
                                  e.target.checked
                                    ? [...prev, submission.id]
                                    : prev.filter((id) => id !== submission.id)
                                )
                              }}
                            />
                            <Badge variant="warning">Pending</Badge>
                          </div>
                        </div>
                        {submission.submitted_at && (
                          <p className="text-xs text-neutral-500 mt-2">
                            Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <ClipboardCheck className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No pending submissions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                {!activeSubmissionId ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400">Select a submission to grade</p>
                  </div>
                ) : answersLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : currentAnswer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-500">
                        Question {currentAnswer.question.question_number} of {answers.length}
                      </p>
                      <Badge variant="default">{currentAnswer.question.question_type}</Badge>
                    </div>
                    <div>
                      <p className="text-neutral-100 font-medium">{currentAnswer.question.question_text}</p>
                      <p className="text-xs text-neutral-500">Marks: {currentAnswer.question.marks}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary-700/50">
                      <p className="text-xs text-neutral-500 mb-1">Student Answer</p>
                      <p className="text-neutral-200">{currentAnswer.answer_text || '—'}</p>
                    </div>
                    {currentAnswer.question.correct_answer && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                        <p className="text-xs text-success mb-1">Expected Answer</p>
                        <p className="text-neutral-200">{currentAnswer.question.correct_answer}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-neutral-400">Score</label>
                        <Input
                          type="number"
                          min={0}
                          max={currentAnswer.question.marks}
                          value={
                            draftGrades[currentAnswer.id]?.score ?? currentAnswer.score ?? ''
                          }
                          onChange={(e) =>
                            setDraftGrades((prev) => ({
                              ...prev,
                              [currentAnswer.id]: {
                                score: Number(e.target.value),
                                feedback: prev[currentAnswer.id]?.feedback ?? currentAnswer.feedback ?? '',
                              },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm text-neutral-400">Feedback</label>
                        <Textarea
                          rows={3}
                          value={
                            draftGrades[currentAnswer.id]?.feedback ?? currentAnswer.feedback ?? ''
                          }
                          onChange={(e) =>
                            setDraftGrades((prev) => ({
                              ...prev,
                              [currentAnswer.id]: {
                                score: prev[currentAnswer.id]?.score ?? currentAnswer.score ?? 0,
                                feedback: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => autoGrade.mutate(activeSubmissionId)}>
                        <Bot className="h-4 w-4 mr-2" />Auto-grade All
                      </Button>
                      <Button variant="secondary" onClick={handleSaveGrades}>
                        <Save className="h-4 w-4 mr-2" />Save Progress
                      </Button>
                      <Button onClick={handleSaveGrades}>
                        <CheckSquare className="h-4 w-4 mr-2" />Submit All Grades
                      </Button>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentAnswerIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentAnswerIndex === 0}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />Prev
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setCurrentAnswerIndex((prev) => Math.min(answers.length - 1, prev + 1))
                        }
                        disabled={currentAnswerIndex === answers.length - 1}
                      >
                        Next <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400">No answers to grade</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-100">Grading Tasks</h2>
                <p className="text-sm text-neutral-400">Track automated grading</p>
              </div>
              <Button variant="secondary" onClick={() => refetchTasks()}>
                <RefreshCcw className="h-4 w-4 mr-2" />Refresh
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card><CardContent className="p-3 text-center"><p className="text-lg text-neutral-100">{taskStats?.total ?? 0}</p><p className="text-xs text-neutral-400">Total</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><p className="text-lg text-warning">{taskStats?.pending ?? 0}</p><p className="text-xs text-neutral-400">Pending</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><p className="text-lg text-info">{taskStats?.in_progress ?? 0}</p><p className="text-xs text-neutral-400">In Progress</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><p className="text-lg text-success">{taskStats?.completed ?? 0}</p><p className="text-xs text-neutral-400">Completed</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><p className="text-lg text-error">{taskStats?.failed ?? 0}</p><p className="text-xs text-neutral-400">Failed</p></CardContent></Card>
            </div>

            {tasksLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : tasks?.results?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-neutral-400">
                    <tr className="border-b border-primary-700">
                      <th className="text-left px-4 py-3">Submission</th>
                      <th className="text-left px-4 py-3">Method</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Started</th>
                      <th className="text-left px-4 py-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.results.map((task) => (
                      <tr key={task.id} className="border-b border-primary-700">
                        <td className="px-4 py-3 text-neutral-200">
                          {task.submission.exam_title}
                        </td>
                        <td className="px-4 py-3 text-neutral-300">{task.grading_method}</td>
                        <td className="px-4 py-3">
                          <Badge variant={task.status === 'completed' ? 'success' : task.status === 'failed' ? 'error' : 'warning'}>
                            {task.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-neutral-400">
                          {task.started_at ? formatDistanceToNow(new Date(task.started_at), { addSuffix: true }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-neutral-400">
                          {task.duration ? `${Math.round(task.duration)}s` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400">No grading tasks</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'config' && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-100">Grading Configuration</h2>
                <p className="text-sm text-neutral-400">Manage grading rules and services</p>
              </div>
              <Button onClick={() => { setEditingConfig(null); setShowConfigModal(true) }}>New Config</Button>
            </div>

            {configs?.results?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-neutral-400">
                    <tr className="border-b border-primary-700">
                      <th className="text-left px-4 py-3">Scope</th>
                      <th className="text-left px-4 py-3">Exam</th>
                      <th className="text-left px-4 py-3">Service</th>
                      <th className="text-left px-4 py-3">Active</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.results.map((config) => (
                      <tr key={config.id} className="border-b border-primary-700">
                        <td className="px-4 py-3 text-neutral-300">{config.scope}</td>
                        <td className="px-4 py-3 text-neutral-400">{config.exam_title || '—'}</td>
                        <td className="px-4 py-3 text-neutral-300">{config.grading_service}</td>
                        <td className="px-4 py-3">
                          <Badge variant={config.is_active ? 'success' : 'default'}>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingConfig(config as unknown as GradingConfiguration)
                                setShowConfigModal(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteConfig.mutate(config.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400">No configurations yet</div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Auto-Grade">
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">Start auto-grading for {selectedSubmissionIds.length} submissions.</p>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={forceRegrade}
              onChange={(e) => setForceRegrade(e.target.checked)}
              className="h-4 w-4 rounded border-primary-600 bg-primary-800 text-accent"
            />
            Force regrade
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await bulkGrade.mutateAsync({ submissionIds: selectedSubmissionIds, forceRegrade })
                setShowBulkModal(false)
                setSelectedSubmissionIds([])
              }}
              isLoading={bulkGrade.isPending}
            >
              Start Bulk Grading
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={editingConfig ? 'Edit Configuration' : 'New Configuration'}
      >
        <GradingConfigForm
          services={services ?? []}
          editing={editingConfig}
          onSave={async (payload) => {
            if (editingConfig) {
              await updateConfig.mutateAsync({ id: editingConfig.id, data: payload })
            } else {
              await createConfig.mutateAsync(payload)
            }
            setShowConfigModal(false)
          }}
          isSaving={createConfig.isPending || updateConfig.isPending}
        />
      </Modal>
    </div>
  )
}

function GradingConfigForm({
  services,
  editing,
  onSave,
  isSaving,
}: {
  services: { name: string; display_name: string; supported_models: string[] }[]
  editing: GradingConfiguration | null
  onSave: (payload: Partial<GradingConfiguration>) => void
  isSaving: boolean
}) {
  const [scope, setScope] = useState(editing?.scope ?? 'global')
  const [examId, setExamId] = useState<number | undefined>(editing?.exam ?? undefined)
  const [questionId, setQuestionId] = useState<number | undefined>(editing?.question ?? undefined)
  const [gradingService, setGradingService] = useState(editing?.grading_service ?? 'mock')
  const [model, setModel] = useState((editing?.service_config as any)?.model ?? '')
  const [temperature, setTemperature] = useState((editing?.service_config as any)?.temperature ?? 0.3)
  const [maxTokens, setMaxTokens] = useState((editing?.service_config as any)?.max_tokens ?? 500)
  const [autoThreshold, setAutoThreshold] = useState(editing?.auto_grade_threshold ?? 80)
  const [requireManual, setRequireManual] = useState(editing?.require_manual_review ?? false)
  const [timeout, setTimeoutValue] = useState(editing?.grading_timeout ?? 300)
  const [maxRetries, setMaxRetries] = useState(editing?.max_retries ?? 3)
  const [systemPrompt, setSystemPrompt] = useState(editing?.system_prompt ?? '')
  const [gradingPrompt, setGradingPrompt] = useState(editing?.grading_prompt_template ?? '')
  const [isActive, setIsActive] = useState(editing?.is_active ?? true)

  const selectedService = services.find((s) => s.name === gradingService)
  const { data: examsData } = useExams({})
  const { data: questionsData } = useExamQuestions(examId ?? 0)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-neutral-400">Scope</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
        >
          <option value="global">Global</option>
          <option value="exam">Exam</option>
          <option value="question">Question</option>
        </select>
      </div>
      {(scope === 'exam' || scope === 'question') && (
        <div>
          <label className="text-sm text-neutral-400">Exam</label>
          <select
            value={examId ?? ''}
            onChange={(e) => setExamId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
          >
            <option value="">Select exam</option>
            {examsData?.results?.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>
      )}
      {scope === 'question' && (
        <div>
          <label className="text-sm text-neutral-400">Question</label>
          <select
            value={questionId ?? ''}
            onChange={(e) => setQuestionId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
          >
            <option value="">Select question</option>
            {questionsData?.results?.map((question) => (
              <option key={question.id} value={question.id}>
                Q{question.question_number}: {question.question_text.slice(0, 40)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="text-sm text-neutral-400">Service</label>
        <select
          value={gradingService}
          onChange={(e) => setGradingService(e.target.value)}
          className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
        >
          {services.map((service) => (
            <option key={service.name} value={service.name}>
              {service.display_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-neutral-400">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
        >
          <option value="">Default</option>
          {selectedService?.supported_models?.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-neutral-400">Temperature</label>
          <Input type="number" step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm text-neutral-400">Max Tokens</label>
          <Input type="number" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-neutral-400">Auto-grade Threshold</label>
          <Input type="number" value={autoThreshold} onChange={(e) => setAutoThreshold(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm text-neutral-400">Timeout (s)</label>
          <Input type="number" value={timeout} onChange={(e) => setTimeoutValue(Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="text-sm text-neutral-400">Max Retries</label>
        <Input type="number" value={maxRetries} onChange={(e) => setMaxRetries(Number(e.target.value))} />
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          checked={requireManual}
          onChange={(e) => setRequireManual(e.target.checked)}
          className="h-4 w-4 rounded border-primary-600 bg-primary-800 text-accent"
        />
        Require manual review
      </label>
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-primary-600 bg-primary-800 text-accent"
        />
        Active
      </label>
      <div>
        <label className="text-sm text-neutral-400">System Prompt</label>
        <Textarea rows={3} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-neutral-400">Grading Prompt Template</label>
        <Textarea rows={4} value={gradingPrompt} onChange={(e) => setGradingPrompt(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() =>
            onSave({
              scope,
                exam: scope === 'exam' || scope === 'question' ? examId ?? null : null,
                question: scope === 'question' ? questionId ?? null : null,
              grading_service: gradingService,
              service_config: {
                model: model || undefined,
                temperature,
                max_tokens: maxTokens,
              },
              auto_grade_threshold: autoThreshold,
              require_manual_review: requireManual,
              grading_timeout: timeout,
              max_retries: maxRetries,
              system_prompt: systemPrompt,
              grading_prompt_template: gradingPrompt,
              is_active: isActive,
            })
          }
          isLoading={isSaving}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
