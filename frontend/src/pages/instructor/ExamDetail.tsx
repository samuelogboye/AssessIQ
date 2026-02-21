import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  ClipboardCheck,
  Trash2,
  Copy,
  Archive,
  CheckSquare,
  Eye,
  Plus,
} from 'lucide-react'
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Textarea,
  Modal,
  Skeleton,
} from '@/components/ui'
import {
  useExamDetail,
  useExamSubmissions,
  useExamStatistics,
  useUpdateExam,
  usePublishExam,
  useArchiveExam,
  useDeleteExam,
  useCreateExam,
} from '@/features/instructor'
import { useExamQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion } from '@/features/instructor'
import type { QuestionType } from '@/types'
import { ROUTES } from '@/lib/constants'

const tabs = ['overview', 'questions', 'submissions', 'statistics', 'settings'] as const

type TabKey = (typeof tabs)[number]

type QuestionDraft = {
  id?: number
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

function QuestionModal({
  isOpen,
  onClose,
  initial,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  initial?: QuestionDraft
  onSave: (question: QuestionDraft) => void
}) {
  const [questionText, setQuestionText] = useState(initial?.question_text ?? '')
  const [questionType, setQuestionType] = useState<QuestionType>(initial?.question_type ?? 'multiple_choice')
  const [marks, setMarks] = useState(initial?.marks ?? 1)
  const [options, setOptions] = useState<{ key: string; text: string }[]>(
    initial?.options ?? [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
    ]
  )
  const [correctAnswer, setCorrectAnswer] = useState(initial?.correct_answer ?? '')
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(', '))
  const [keywordWeight, setKeywordWeight] = useState(initial?.keyword_weight ?? 0.7)
  const [rubric, setRubric] = useState(initial?.grading_rubric ?? '')
  const [useAi, setUseAi] = useState(initial?.use_ai_grading ?? false)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial?.id ? 'Edit Question' : 'Add Question'}>
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
            <Input type="number" min={1} value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
          </div>
        </div>

        {questionType === 'multiple_choice' && (
          <div className="space-y-3">
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
              <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value.toUpperCase())} />
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
          <Button
            onClick={() =>
              onSave({
                id: initial?.id,
                question_text: questionText,
                question_type: questionType,
                marks: Number(marks),
                options: questionType === 'multiple_choice' ? options : undefined,
                correct_answer:
                  questionType === 'multiple_choice' || questionType === 'true_false'
                    ? correctAnswer
                    : undefined,
                keywords:
                  questionType === 'short_answer'
                    ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
                    : undefined,
                keyword_weight: questionType === 'short_answer' ? Number(keywordWeight) : undefined,
                grading_rubric: questionType === 'essay' ? rubric : undefined,
                use_ai_grading: questionType === 'essay' ? useAi : undefined,
              })
            }
          >
            Save Question
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>()
  const examId = Number(id)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [showPreview, setShowPreview] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionDraft | undefined>()

  const { data: exam, isLoading } = useExamDetail(examId)
  const { data: submissions } = useExamSubmissions(examId)
  const { data: statistics } = useExamStatistics(examId)
  const { data: questionsData } = useExamQuestions(examId)

  const updateExam = useUpdateExam()
  const publishExam = usePublishExam()
  const archiveExam = useArchiveExam()
  const deleteExam = useDeleteExam()
  const createExam = useCreateExam()
  const createQuestion = useCreateQuestion()
  const updateQuestion = useUpdateQuestion()
  const deleteQuestion = useDeleteQuestion()

  const questions = questionsData?.results ?? []
  const totalMarks = useMemo(() => questions.reduce((sum, q) => sum + q.marks, 0), [questions])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [passingMarks, setPassingMarks] = useState(50)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [allowReview, setAllowReview] = useState(true)

  if (isLoading || !exam) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this exam? This cannot be undone.')) return
    await deleteExam.mutateAsync(examId)
    navigate(ROUTES.INSTRUCTOR_EXAMS)
  }

  const handleDuplicate = async () => {
    await createExam.mutateAsync({
      title: `${exam.title} (Copy)`,
      description: exam.description,
      course_id: exam.course.id,
      duration_minutes: exam.duration_minutes,
      total_marks: exam.total_marks,
      passing_marks: exam.passing_marks,
      max_attempts: exam.max_attempts,
      shuffle_questions: exam.shuffle_questions,
      allow_review: exam.allow_review,
      start_time: exam.start_time ?? undefined,
      end_time: exam.end_time ?? undefined,
    })
  }

  const handleSaveSettings = async () => {
    await updateExam.mutateAsync({
      id: examId,
      data: {
        title: title || exam.title,
        description: description || exam.description,
        duration_minutes: durationMinutes || exam.duration_minutes,
        passing_marks: passingMarks || exam.passing_marks,
        max_attempts: maxAttempts,
        shuffle_questions: shuffleQuestions,
        allow_review: allowReview,
        total_marks: totalMarks,
      },
    })
  }

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.INSTRUCTOR_EXAMS}
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Exams
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
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
            <span className="text-sm text-neutral-500">{exam.course.code}</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">{exam.title}</h1>
          <p className="text-neutral-400">{exam.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="secondary" onClick={() => publishExam.mutate(examId)}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Publish
          </Button>
          <Button variant="secondary" onClick={() => archiveExam.mutate(examId)}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button variant="secondary" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <Card>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary-700/50 text-center">
              <p className="text-2xl font-bold text-neutral-100">{exam.question_count}</p>
              <p className="text-sm text-neutral-400">Questions</p>
            </div>
            <div className="p-4 rounded-lg bg-primary-700/50 text-center">
              <p className="text-2xl font-bold text-neutral-100">{statistics?.total_submissions ?? 0}</p>
              <p className="text-sm text-neutral-400">Submissions</p>
            </div>
            <div className="p-4 rounded-lg bg-primary-700/50 text-center">
              <p className="text-2xl font-bold text-neutral-100">{statistics?.average_score ?? 0}%</p>
              <p className="text-sm text-neutral-400">Average Score</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'questions' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-100">Questions</h3>
              <Button onClick={() => {
                setEditingQuestion(undefined)
                setShowQuestionModal(true)
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
                {questions.map((q) => (
                  <div key={q.id} className="p-4 rounded-lg bg-primary-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-neutral-100 font-medium">Q{q.question_number}: {q.question_text}</p>
                        <p className="text-xs text-neutral-500">{q.question_type} • {q.marks} marks</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingQuestion({
                              id: q.id,
                              question_text: q.question_text,
                              question_type: q.question_type,
                              marks: q.marks,
                              options: q.options ?? undefined,
                              correct_answer: q.correct_answer ?? undefined,
                              keywords: q.keywords ?? undefined,
                              keyword_weight: q.keyword_weight ?? undefined,
                              grading_rubric: q.grading_rubric ?? undefined,
                              use_ai_grading: q.use_ai_grading,
                            })
                            setShowQuestionModal(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteQuestion.mutate(q.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'submissions' && (
        <Card>
          <CardContent className="p-6">
            {submissions?.results?.length ? (
              <div className="space-y-3">
                {submissions.results.map((s) => (
                  <div key={s.id} className="p-4 rounded-lg bg-primary-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-neutral-100 font-medium">{s.exam_title}</p>
                        <p className="text-xs text-neutral-500">{s.course_code}</p>
                      </div>
                      <Badge variant={s.status === 'graded' ? 'success' : 'warning'}>{s.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-primary-700/50 text-center text-neutral-400">
                No submissions yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span className="text-neutral-200">Score Distribution</span>
              </div>
              <div className="space-y-2 text-sm text-neutral-400">
                {statistics?.score_distribution?.map((bucket) => (
                  <div key={bucket.range} className="flex items-center justify-between">
                    <span>{bucket.range}</span>
                    <span>{bucket.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="h-4 w-4 text-accent" />
                <span className="text-neutral-200">Question Difficulty</span>
              </div>
              <div className="space-y-2 text-sm text-neutral-400">
                {statistics?.question_statistics?.map((q) => (
                  <div key={q.question_id} className="flex items-center justify-between">
                    <span>Q{q.question_number}</span>
                    <span>{Math.round(q.average_score)} / {q.max_marks}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm text-neutral-400">Title</label>
              <Input defaultValue={exam.title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-neutral-400">Description</label>
              <Textarea defaultValue={exam.description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-neutral-400">Duration (minutes)</label>
                <Input
                  type="number"
                  defaultValue={exam.duration_minutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm text-neutral-400">Passing Marks</label>
                <Input
                  type="number"
                  defaultValue={exam.passing_marks}
                  onChange={(e) => setPassingMarks(Number(e.target.value))}
                />
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
              Allow review
            </label>
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} isLoading={updateExam.isPending}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Preview as Student">
        <div className="space-y-4">
          <div className="text-sm text-neutral-400">{exam.title} • {exam.course.name}</div>
          {questions.length === 0 ? (
            <div className="p-4 rounded-lg bg-primary-700/50 text-center text-neutral-400">No questions</div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="p-4 rounded-lg bg-primary-700/50">
                  <p className="text-neutral-100 font-medium">Q{q.question_number}: {q.question_text}</p>
                  <p className="text-xs text-neutral-500">{q.question_type} • {q.marks} marks</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <QuestionModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        initial={editingQuestion}
        onSave={async (question) => {
          if (!question.id) {
            await createQuestion.mutateAsync({
              exam_id: examId,
              question_text: question.question_text,
              question_type: question.question_type,
              marks: question.marks,
              options: question.options,
              correct_answer: question.correct_answer,
              keywords: question.keywords,
              keyword_weight: question.keyword_weight,
              grading_rubric: question.grading_rubric,
              use_ai_grading: question.use_ai_grading,
            })
          } else {
            await updateQuestion.mutateAsync({
              id: question.id,
              data: {
                question_text: question.question_text,
                question_type: question.question_type,
                marks: question.marks,
                options: question.options,
                correct_answer: question.correct_answer,
                keywords: question.keywords,
                keyword_weight: question.keyword_weight,
                grading_rubric: question.grading_rubric,
                use_ai_grading: question.use_ai_grading,
              },
            })
          }
          setShowQuestionModal(false)
        }}
      />
    </div>
  )
}
