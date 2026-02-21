import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import InstructorExams from '../Exams'

const mockUseExams = vi.fn()
const mockUseCourses = vi.fn()
const mockPublish = vi.fn()
const mockArchive = vi.fn()
const mockDelete = vi.fn()
const mockCreate = vi.fn()
const mockBulk = vi.fn()

vi.mock('@/features/instructor', () => ({
  useExams: () => mockUseExams(),
  useCourses: () => mockUseCourses(),
  useCreateExam: () => ({ mutateAsync: mockCreate, isPending: false }),
  usePublishExam: () => ({ mutateAsync: mockPublish, mutate: mockPublish, isPending: false }),
  useArchiveExam: () => ({ mutateAsync: mockArchive, mutate: mockArchive, isPending: false }),
  useDeleteExam: () => ({ mutate: mockDelete, isPending: false }),
  useBulkCreateQuestions: () => ({ mutateAsync: mockBulk, isPending: false }),
}))

beforeEach(() => {
  mockUseExams.mockReturnValue({
    data: {
      results: [
        {
          id: 10,
          title: 'Midterm',
          course: { id: 1, code: 'CS101', name: 'Intro CS', description: '', exam_count: 2, is_active: true, instructor_name: '' },
          status: 'draft',
          question_count: 5,
        },
      ],
    },
    isLoading: false,
  })
  mockUseCourses.mockReturnValue({
    data: {
      results: [
        { id: 1, code: 'CS101', name: 'Intro CS', description: '', is_active: true, exam_count: 2, instructor_name: '' },
      ],
    },
  })
  mockPublish.mockReset()
})

describe('InstructorExams', () => {
  it('renders exams table', () => {
    render(
      <MemoryRouter>
        <InstructorExams />
      </MemoryRouter>
    )

    expect(screen.getByText('Midterm')).toBeInTheDocument()
    expect(screen.getByText('CS101')).toBeInTheDocument()
  })

  it('publishes selected exams via bulk action', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <InstructorExams />
      </MemoryRouter>
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    await user.click(screen.getByRole('button', { name: /publish/i }))

    expect(mockPublish).toHaveBeenCalled()
  })
})
