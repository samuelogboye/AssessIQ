import { apiClient } from './client'
import type { ExamListItem, SubmissionListItem } from '@/types'

export interface InstructorDashboardStats {
  total_courses: number
  active_exams: number
  pending_grading: number
  total_students: number
  recent_submissions: number
}

export interface PendingGradingItem {
  id: number
  exam_id: number
  exam_title: string
  course_code: string
  course_name: string
  pending_count: number
  oldest_submission: string
}

export interface RecentActivityItem {
  id: number
  type: 'submission' | 'graded' | 'published' | 'created'
  message: string
  timestamp: string
  exam_id?: number
  submission_id?: number
}

export const instructorDashboardApi = {
  // Get dashboard stats
  getStats: async (): Promise<InstructorDashboardStats> => {
    const response = await apiClient.get('/assessments/instructor/dashboard/stats/')
    return response.data
  },

  // Get pending grading summary
  getPendingGrading: async (limit: number = 5): Promise<PendingGradingItem[]> => {
    const response = await apiClient.get('/assessments/instructor/dashboard/pending-grading/', {
      params: { limit },
    })
    return response.data
  },

  // Get recent activity
  getRecentActivity: async (limit: number = 10): Promise<RecentActivityItem[]> => {
    const response = await apiClient.get('/assessments/instructor/dashboard/recent-activity/', {
      params: { limit },
    })
    return response.data
  },

  // Get recent exams
  getRecentExams: async (limit: number = 5): Promise<ExamListItem[]> => {
    const response = await apiClient.get('/assessments/exams/', {
      params: { page_size: limit, ordering: '-created_at' },
    })
    return response.data.results
  },
}
