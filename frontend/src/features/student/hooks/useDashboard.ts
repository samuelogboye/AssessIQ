import { useQuery } from '@tanstack/react-query'
import { studentDashboardApi } from '@/api'

export const dashboardKeys = {
  all: ['student-dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  upcomingExams: (limit: number) => [...dashboardKeys.all, 'upcoming-exams', limit] as const,
  recentSubmissions: (limit: number) => [...dashboardKeys.all, 'recent-submissions', limit] as const,
}

export function useStudentDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => studentDashboardApi.getStats(),
  })
}

export function useUpcomingExams(limit: number = 5) {
  return useQuery({
    queryKey: dashboardKeys.upcomingExams(limit),
    queryFn: () => studentDashboardApi.getUpcomingExams(limit),
  })
}

export function useRecentSubmissions(limit: number = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentSubmissions(limit),
    queryFn: () => studentDashboardApi.getRecentSubmissions(limit),
  })
}
