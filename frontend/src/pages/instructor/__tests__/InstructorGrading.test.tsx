import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InstructorGrading from '../Grading'

const mockPending = vi.fn()
const mockAnswers = vi.fn()
const mockGradingTasks = vi.fn()
const mockGradingStats = vi.fn()
const mockGradingConfigs = vi.fn()
const mockGradingServices = vi.fn()

vi.mock('@/features/grading', () => ({
  usePendingGradingSubmissions: () => mockPending(),
  useSubmissionAnswersForGrading: () => mockAnswers(),
  useBulkGradeSubmissions: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkGradeAnswers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAutoGradeSubmission: () => ({ mutate: vi.fn(), isPending: false }),
  useGradingTasks: () => mockGradingTasks(),
  useGradingTaskStats: () => mockGradingStats(),
  useGradingConfigs: () => mockGradingConfigs(),
  useGradingServices: () => mockGradingServices(),
  useCreateGradingConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGradingConfig: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteGradingConfig: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/instructor', () => ({
  useCourses: () => ({ data: { results: [] } }),
  useExams: () => ({ data: { results: [] } }),
  useExamQuestions: () => ({ data: { results: [] } }),
}))

beforeEach(() => {
  mockPending.mockReturnValue({
    data: [
      {
        id: 1,
        student: { id: 1, email: 'student@example.com', first_name: 'Stu', last_name: 'Dent', role: 'student' },
        exam_title: 'Midterm',
        course_name: 'Intro CS',
        attempt_number: 1,
        status: 'submitted',
        started_at: '',
        submitted_at: new Date().toISOString(),
        graded_at: null,
        total_score: null,
        percentage: null,
        is_passed: null,
        is_late: false,
        flagged_for_review: false,
      },
    ],
    isLoading: false,
  })
  mockAnswers.mockReturnValue({ data: [], isLoading: false })
  mockGradingTasks.mockReturnValue({ data: { results: [] }, isLoading: false, refetch: vi.fn() })
  mockGradingStats.mockReturnValue({ data: { total: 0, pending: 0, in_progress: 0, completed: 0, failed: 0, by_method: {} } })
  mockGradingConfigs.mockReturnValue({ data: { results: [] } })
  mockGradingServices.mockReturnValue({ data: [] })
})

describe('InstructorGrading', () => {
  it('renders pending submissions list', () => {
    render(<InstructorGrading />)
    expect(screen.getByText('Midterm')).toBeInTheDocument()
    expect(screen.getByText(/Attempt #1/)).toBeInTheDocument()
  })

  it('switches to tasks tab', async () => {
    const user = userEvent.setup()
    render(<InstructorGrading />)
    await user.click(screen.getByRole('button', { name: /tasks/i }))
    expect(screen.getByText('Grading Tasks')).toBeInTheDocument()
  })
})
