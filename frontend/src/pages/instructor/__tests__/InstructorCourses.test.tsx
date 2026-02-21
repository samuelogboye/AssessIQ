import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import InstructorCourses from '../Courses'

const mockUseCourses = vi.fn()
const mockCreateCourse = vi.fn()
const mockUpdateCourse = vi.fn()
const mockDeleteCourse = vi.fn()
const mockToggleCourse = vi.fn()

vi.mock('@/features/instructor', () => ({
  useCourses: () => mockUseCourses(),
  useCreateCourse: () => ({ mutateAsync: mockCreateCourse, isPending: false }),
  useUpdateCourse: () => ({ mutateAsync: mockUpdateCourse, isPending: false }),
  useDeleteCourse: () => ({ mutateAsync: mockDeleteCourse, isPending: false }),
  useToggleCourseActive: () => ({ mutate: mockToggleCourse, isPending: false }),
}))

beforeEach(() => {
  mockUseCourses.mockReturnValue({
    data: {
      results: [
        {
          id: 1,
          code: 'CS101',
          name: 'Intro CS',
          description: 'Basics',
          is_active: true,
          exam_count: 2,
        },
      ],
    },
    isLoading: false,
  })
  mockCreateCourse.mockReset()
  mockUpdateCourse.mockReset()
})

describe('InstructorCourses', () => {
  it('renders course list', () => {
    render(
      <MemoryRouter>
        <InstructorCourses />
      </MemoryRouter>
    )

    expect(screen.getByText('CS101')).toBeInTheDocument()
    expect(screen.getByText('Intro CS')).toBeInTheDocument()
  })

  it('creates a course from modal', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <InstructorCourses />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /create course/i }))
    await user.type(screen.getByPlaceholderText('CS101'), 'CS202')
    await user.type(screen.getByPlaceholderText('Introduction to CS'), 'Advanced CS')
    await user.click(screen.getByRole('button', { name: /create course/i }))

    expect(mockCreateCourse).toHaveBeenCalledWith({
      code: 'CS202',
      name: 'Advanced CS',
      description: '',
      is_active: true,
    })
  })
})
