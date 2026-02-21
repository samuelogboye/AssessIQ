import { useQuery } from '@tanstack/react-query'
import { instructorDashboardApi } from '@/api'

export const instructorDashboardKeys = {
  all: ['instructor-dashboard'] as const,
  stats: () => [...instructorDashboardKeys.all, 'stats'] as const,
  pendingGrading: (limit: number) => [...instructorDashboardKeys.all, 'pending-grading', limit] as const,
  recentActivity: (limit: number) => [...instructorDashboardKeys.all, 'recent-activity', limit] as const,
  recentExams: (limit: number) => [...instructorDashboardKeys.all, 'recent-exams', limit] as const,
}

export function useInstructorDashboardStats() {
  return useQuery({
    queryKey: instructorDashboardKeys.stats(),
    queryFn: () => instructorDashboardApi.getStats(),
  })
}

export function usePendingGrading(limit: number = 5) {
  return useQuery({
    queryKey: instructorDashboardKeys.pendingGrading(limit),
    queryFn: () => instructorDashboardApi.getPendingGrading(limit),
  })
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: instructorDashboardKeys.recentActivity(limit),
    queryFn: () => instructorDashboardApi.getRecentActivity(limit),
  })
}

export function useRecentExams(limit: number = 5) {
  return useQuery({
    queryKey: instructorDashboardKeys.recentExams(limit),
    queryFn: () => instructorDashboardApi.getRecentExams(limit),
  })
}
