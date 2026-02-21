import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import InstructorAnalytics from '../Analytics'

vi.mock('@/features/instructor', () => ({
  useInstructorDashboardStats: () => ({ data: { active_exams: 3, recent_submissions: 12 } }),
  useExams: () => ({ data: { results: [] } }),
  useExamStatistics: () => ({ data: { average_score: 75, total_submissions: 10, pass_rate: 70, highest_score: 95, lowest_score: 40, score_distribution: [] } }),
}))

vi.mock('@/features/grading', () => ({
  useGradingTaskStats: () => ({ data: { completed: 5 } }),
}))

describe('InstructorAnalytics', () => {
  it('renders analytics metrics', () => {
    render(<InstructorAnalytics />)
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Active Exams')).toBeInTheDocument()
    expect(screen.getByText('Recent Submissions')).toBeInTheDocument()
  })
})
