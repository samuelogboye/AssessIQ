import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Plus,
  Filter,
  Search,
  CheckSquare,
  Archive,
  Eye,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Modal,
  Textarea,
  Skeleton,
} from '@/components/ui'
import {
  useExams,
  useCreateExam,
  usePublishExam,
  useArchiveExam,
  useDeleteExam,
  useBulkCreateQuestions,
} from '@/features/instructor'
import { useCourses } from '@/features/instructor'
import type { ExamStatus, QuestionType } from '@/types'

type StatusFilter = 'all' | ExamStatus
type WizardStep = 1 | 2 | 3 | 4 | 5

type DraftQuestion = {
  tempId: string
  question_text: string
  question_type: QuestionType
  marks: number
  options?: { key: string; text: string }[]
  correct_answer?: string
  keywords?: string[]
  keyword_weight?: number
  grading_rubric?: string
  use_ai_grading?: boolean
}

function QuestionBuilderModal({
  isOpen,
  onClose,
  onSave,
  initialQuestion,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (question: DraftQuestion) => void
  initialQuestion?: DraftQuestion
}) {
  const [questionText, setQuestionText] = useState(initialQuestion?.question_text ?? '')
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialQuestion?.question_type ?? 'multiple_choice'
  )
  const [marks, setMarks] = useState(initialQuestion?.marks ?? 1)
  const [options, setOptions] = useState<{ key: string; text: string }[]>(
    initialQuestion?.options ?? [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
    ]
  )
  const [correctAnswer, setCorrectAnswer] = useState(initialQuestion?.correct_answer ?? '')
  const [keywords, setKeywords] = useState((initialQuestion?.keywords ?? []).join(', '))
  const [keywordWeight, setKeywordWeight] = useState(initialQuestion?.keyword_weight ?? 0.7)
  const [rubric, setRubric] = useState(initialQuestion?.grading_rubric ?? '')
  const [useAi, setUseAi] = useState(initialQuestion?.use_ai_grading ?? false)

  const handleSave = () => {
    if (!questionText || !marks) return
    onSave({
      tempId: initialQuestion?.tempId ?? Math.random().toString(36).slice(2),
      question_text: questionText,
      question_type: questionType,
      marks: Number(marks),
      options:
        questionType === 'multiple_choice'
          ? options.filter((o) => o.text.trim() !== '')
          : undefined,
      correct_answer:
        questionType === 'multiple_choice' || questionType === 'true_false'
          ? correctAnswer
          : undefined,
      keywords:
        questionType === 'short_answer'
          ? keywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
          : undefined,
      keyword_weight: questionType === 'short_answer' ? Number(keywordWeight) : undefined,
      grading_rubric: questionType === 'essay' ? rubric : undefined,
      use_ai_grading: questionType === 'essay' ? useAi : undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Question Builder">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-neutral-400">Question Text</label>
          <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-400">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="essay">Essay</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Marks</label>
            <Input
              type="number"
              min={1}
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
            />
          </div>
        </div>

        {questionType === 'multiple_choice' && (
          <div className="space-y-3">
            <label className="text-sm text-neutral-400">Options</label>
            {options.map((option, index) => (
              <div key={option.key} className="flex items-center gap-2">
                <Input
                  value={option.text}
                  onChange={(e) => {
                    const next = [...options]
                    next[index] = { ...option, text: e.target.value }
                    setOptions(next)
                  }}
                  placeholder={`Option ${option.key}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = options.filter((_, i) => i !== index)
                    setOptions(next)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const nextKey = String.fromCharCode(65 + options.length)
                setOptions([...options, { key: nextKey, text: '' }])
              }}
            >
              Add Option
            </Button>
            <div>
              <label className="text-sm text-neutral-400">Correct Answer</label>
              <Input
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value.toUpperCase())}
                placeholder="A"
              />
            </div>
          </div>
        )}

        {questionType === 'true_false' && (
          <div>
            <label className="text-sm text-neutral-400">Correct Answer</label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
            >
              <option value="">Select</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        )}

        {questionType === 'short_answer' && (
          <div className="space-y-3">
            <label className="text-sm text-neutral-400">Keywords (comma separated)</label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            <div>
              <label className="text-sm text-neutral-400">Keyword Weight</label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={keywordWeight}
                onChange={(e) => setKeywordWeight(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {questionType === 'essay' && (
          <div className="space-y-3">
            <label className="text-sm text-neutral-400">Grading Rubric</label>
            <Textarea value={rubric} onChange={(e) => setRubric(e.target.value)} rows={4} />
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                className="h-4 w-4 rounded border-primary-600 bg-primary-800 text-accent"
              />
              Use AI grading
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Question</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function InstructorExams() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [courseId, setCourseId] = useState<number | undefined>()
  const [selected, setSelected] = useState<number[]>([])
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<DraftQuestion | undefined>()
  const [questions, setQuestions] = useState<DraftQuestion[]>([])

  const { data: examsData, isLoading } = useExams({
    search: search || undefined,
    status: status === 'all' ? undefined : status,
    course: courseId,
  })
  const { data: coursesData } = useCourses({ is_active: true })
  const createExam = useCreateExam()
  const publishExam = usePublishExam()
  const archiveExam = useArchiveExam()
  const deleteExam = useDeleteExam()
  const bulkCreate = useBulkCreateQuestions()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [wizardCourseId, setWizardCourseId] = useState<number | undefined>()
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [passingMarks, setPassingMarks] = useState(50)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [allowReview, setAllowReview] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [availableNow, setAvailableNow] = useState(true)

  const results = useMemo(() => examsData?.results ?? [], [examsData?.results])

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  const resetWizard = () => {
    setWizardStep(1)
    setTitle('')
    setDescription('')
    setWizardCourseId(undefined)
    setDurationMinutes(60)
    setPassingMarks(50)
    setMaxAttempts(1)
    setShuffleQuestions(false)
    setAllowReview(true)
    setStartDate('')
    setStartTime('')
    setEndDate('')
    setEndTime('')
    setAvailableNow(true)
    setQuestions([])
  }

  const handleBulkPublish = async () => {
    await Promise.all(selected.map((id) => publishExam.mutateAsync(id)))
    setSelected([])
  }

  const handleBulkArchive = async () => {
    await Promise.all(selected.map((id) => archiveExam.mutateAsync(id)))
    setSelected([])
  }

  const handleCreateExam = async (publish: boolean) => {
    if (!wizardCourseId || !title || !durationMinutes || !passingMarks) return
    if (publish && questions.length === 0) return

    const startTimeValue = availableNow || !startDate || !startTime ? undefined : `${startDate}T${startTime}:00Z`
    const endTimeValue = availableNow || !endDate || !endTime ? undefined : `${endDate}T${endTime}:00Z`

    const exam = await createExam.mutateAsync({
      title,
      description,
      course_id: wizardCourseId,
      duration_minutes: durationMinutes,
      total_marks: totalMarks,
      passing_marks: passingMarks,
      max_attempts: maxAttempts,
      shuffle_questions: shuffleQuestions,
      allow_review: allowReview,
      start_time: startTimeValue,
      end_time: endTimeValue,
    })

    if (questions.length > 0) {
      await bulkCreate.mutateAsync({
        exam_id: exam.id,
        questions: questions.map((q, index) => ({
          question_number: index + 1,
          question_text: q.question_text,
          question_type: q.question_type,
          marks: q.marks,
          options: q.options,
          correct_answer: q.correct_answer,
          keywords: q.keywords,
          keyword_weight: q.keyword_weight,
          grading_rubric: q.grading_rubric,
          use_ai_grading: q.use_ai_grading,
        })),
      })
    }

    if (publish) {
      await publishExam.mutateAsync(exam.id)
    }
    setShowWizard(false)
    resetWizard()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Exams</h1>
          <p className="text-neutral-400">Create and manage your exams</p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
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
                placeholder="Search by title"
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
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="relative">
              <select
                value={courseId ?? ''}
                onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : undefined)}
                className="pl-4 pr-4 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent appearance-none min-w-[200px]"
              >
                <option value="">All Courses</option>
                {coursesData?.results?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="warning">{selected.length} selected</Badge>
            <Button variant="secondary" onClick={handleBulkPublish} data-testid="bulk-publish">
              <CheckSquare className="h-4 w-4 mr-2" />
              Publish
            </Button>
            <Button variant="secondary" onClick={handleBulkArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          </CardContent>
        </Card>
      )}

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
                    <th className="text-left px-4 py-3">Select</th>
                    <th className="text-left px-4 py-3">Title</th>
                    <th className="text-left px-4 py-3">Course</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Questions</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((exam) => (
                    <tr key={exam.id} className="border-b border-primary-700">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(exam.id)}
                          onChange={(e) => {
                            setSelected((prev) =>
                              e.target.checked
                                ? [...prev, exam.id]
                                : prev.filter((id) => id !== exam.id)
                            )
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-neutral-200">
                        <Link to={`/instructor/exams/${exam.id}`} className="hover:text-accent">
                          {exam.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">{exam.course.code}</td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3 text-neutral-300">{exam.question_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/instructor/exams/${exam.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => publishExam.mutate(exam.id)}>
                            Publish
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => archiveExam.mutate(exam.id)}>
                            Archive
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExam.mutate(exam.id)}
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
              <FileText className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-300 mb-2">No exams found</h3>
              <p className="text-neutral-400">Create your first exam to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Exam Wizard */}
      <Modal
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false)
          resetWizard()
        }}
        title={`Create Exam - Step ${wizardStep} of 5`}
      >
        <div className="space-y-6">
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-400">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
              <div>
                <label className="text-sm text-neutral-400">Course</label>
                <select
                  value={wizardCourseId ?? ''}
                  onChange={(e) => setWizardCourseId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
                >
                  <option value="">Select course</option>
                  {coursesData?.results?.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-400">Duration (minutes)</label>
                  <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm text-neutral-400">Passing Marks</label>
                  <Input type="number" value={passingMarks} onChange={(e) => setPassingMarks(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Max Attempts</label>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-primary-800 border border-primary-600 rounded-lg text-neutral-100"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={-1}>Unlimited</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
                Shuffle questions
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input type="checkbox" checked={allowReview} onChange={(e) => setAllowReview(e.target.checked)} />
                Allow review after submission
              </label>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} />
                Make available immediately
              </label>
              {!availableNow && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-400">Start Date</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400">Start Time</label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400">End Date</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400">End Time</label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
              )}
              <p className="text-xs text-neutral-500">Timezone: UTC</p>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-neutral-100 font-semibold">Questions</h3>
                <Button size="sm" onClick={() => {
                  setEditingQuestion(undefined)
                  setShowQuestionBuilder(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
              {questions.length === 0 ? (
                <div className="p-6 rounded-lg bg-primary-700/50 text-center text-neutral-400">
                  No questions added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <div key={q.tempId} className="p-4 rounded-lg bg-primary-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-neutral-100 font-medium">Q{index + 1}: {q.question_text}</p>
                          <p className="text-xs text-neutral-500">{q.question_type} • {q.marks} marks</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingQuestion(q)
                              setShowQuestionBuilder(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setQuestions((prev) => prev.filter((item) => item.tempId !== q.tempId))
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (index === 0) return
                              const next = [...questions]
                              ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                              setQuestions(next)
                            }}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (index === questions.length - 1) return
                              const next = [...questions]
                              ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                              setQuestions(next)
                            }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-sm text-neutral-400">Total marks: {totalMarks}</div>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-2 text-sm text-neutral-400">
                  <p><span className="text-neutral-200">Title:</span> {title || '-'}</p>
                  <p><span className="text-neutral-200">Course:</span> {coursesData?.results?.find((c) => c.id === wizardCourseId)?.name ?? '-'}</p>
                  <p><span className="text-neutral-200">Duration:</span> {durationMinutes} minutes</p>
                  <p><span className="text-neutral-200">Total Marks:</span> {totalMarks}</p>
                  <p><span className="text-neutral-200">Questions:</span> {questions.length}</p>
                </CardContent>
              </Card>
              {questions.length === 0 && (
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning text-sm">
                  Add at least one question before publishing.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={() => setWizardStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev))}
              disabled={wizardStep === 1}
            >
              Back
            </Button>
            {wizardStep < 5 ? (
              <Button
                onClick={() => setWizardStep((prev) => (prev + 1) as WizardStep)}
                disabled={wizardStep === 1 && (!title || !wizardCourseId)}
              >
                Next
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleCreateExam(false)} isLoading={createExam.isPending}>
                  Save Draft
                </Button>
                <Button onClick={() => handleCreateExam(true)} isLoading={createExam.isPending || publishExam.isPending}>
                  Publish
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <QuestionBuilderModal
        isOpen={showQuestionBuilder}
        onClose={() => setShowQuestionBuilder(false)}
        initialQuestion={editingQuestion}
        onSave={(question) => {
          setQuestions((prev) => {
            const existing = prev.find((q) => q.tempId === question.tempId)
            if (existing) {
              return prev.map((q) => (q.tempId === question.tempId ? question : q))
            }
            return [...prev, question]
          })
          setShowQuestionBuilder(false)
        }}
      />
    </div>
  )
}
