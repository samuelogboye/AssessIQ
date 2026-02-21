import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InstructorExamDetail from '../ExamDetail'

const mockUseExamDetail = vi.fn()
const mockUseExamSubmissions = vi.fn()
const mockUseExamStatistics = vi.fn()
const mockUseExamQuestions = vi.fn()

vi.mock('@/features/instructor', () => ({
  useExamDetail: () => mockUseExamDetail(),
  useExamSubmissions: () => mockUseExamSubmissions(),
  useExamStatistics: () => mockUseExamStatistics(),
  useExamQuestions: () => mockUseExamQuestions(),
  useUpdateExam: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePublishExam: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveExam: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteExam: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateExam: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateQuestion: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateQuestion: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteQuestion: () => ({ mutate: vi.fn(), isPending: false }),
}))

beforeEach(() => {
  mockUseExamDetail.mockReturnValue({
    data: {
      id: 1,
      title: 'Final Exam',
      description: 'Comprehensive',
      course: { id: 1, code: 'CS101', name: 'Intro CS', description: '', is_active: true, instructor_name: '' },
      duration_minutes: 60,
      total_marks: 100,
      passing_marks: 50,
      status: 'draft',
      start_time: null,
      end_time: null,
      max_attempts: 1,
      shuffle_questions: false,
      allow_review: true,
      question_count: 2,
      is_available: false,
      created_at: '',
      updated_at: '',
    },
    isLoading: false,
  })
  mockUseExamSubmissions.mockReturnValue({ data: { results: [] } })
  mockUseExamStatistics.mockReturnValue({ data: { total_submissions: 0, average_score: 0 } })
  mockUseExamQuestions.mockReturnValue({ data: { results: [] } })
})

describe('InstructorExamDetail', () => {
  it('renders exam header', () => {
    render(
      <MemoryRouter initialEntries={['/instructor/exams/1']}>
        <Routes>
          <Route path="/instructor/exams/:id" element={<InstructorExamDetail />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Final Exam')).toBeInTheDocument()
    expect(screen.getByText('Comprehensive')).toBeInTheDocument()
  })
})
