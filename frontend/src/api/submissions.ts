import { apiClient } from './client'
import type { PaginatedResponse } from './courses'
import type {
  Submission,
  SubmissionListItem,
  SubmissionReview,
  CreateSubmissionRequest,
  CreateSubmissionResponse,
  SaveAnswerRequest,
  SaveAnswerResponse,
  SubmitAnswersRequest,
  SubmitAnswersResponse,
  GradingAnswer,
  PendingSubmission,
} from '@/types'

export interface SubmissionsListParams {
  exam?: number
  status?: 'in_progress' | 'submitted' | 'graded'
  course?: number
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export const submissionsApi = {
  // Get all submissions for current user
  list: async (params?: SubmissionsListParams): Promise<PaginatedResponse<SubmissionListItem>> => {
    const response = await apiClient.get('/submissions/submissions/', { params })
    return response.data
  },

  // Get single submission detail
  get: async (id: number): Promise<Submission> => {
    const response = await apiClient.get(`/submissions/submissions/${id}/`)
    return response.data
  },

  // Create new submission (start exam)
  create: async (data: CreateSubmissionRequest): Promise<CreateSubmissionResponse> => {
    const response = await apiClient.post('/submissions/submissions/', data)
    return response.data
  },

  // Save a single answer (auto-save)
  saveAnswer: async (submissionId: number, data: SaveAnswerRequest): Promise<SaveAnswerResponse> => {
    const response = await apiClient.post(
      `/submissions/submissions/${submissionId}/save_answer/`,
      data
    )
    return response.data
  },

  // Submit all answers (finish exam)
  submitAnswers: async (
    submissionId: number,
    data: SubmitAnswersRequest
  ): Promise<SubmitAnswersResponse> => {
    const response = await apiClient.post(
      `/submissions/submissions/${submissionId}/submit_answers/`,
      data
    )
    return response.data
  },

  // Get submission review (after grading)
  getReview: async (id: number): Promise<SubmissionReview> => {
    const response = await apiClient.get(`/submissions/submissions/${id}/review/`)
    return response.data
  },

  // Get current answers for a submission (for resuming in-progress exam)
  getAnswers: async (id: number): Promise<{ question_id: number; answer_text: string }[]> => {
    const response = await apiClient.get(`/submissions/submissions/${id}/answers/`)
    return response.data
  },

  // Get pending grading submissions (instructor)
  pendingGrading: async (): Promise<PendingSubmission[]> => {
    const response = await apiClient.get('/submissions/submissions/pending_grading/')
    return response.data
  },

  // Get answers for a submission (instructor grading)
  getSubmissionAnswers: async (submissionId: number): Promise<GradingAnswer[]> => {
    const response = await apiClient.get('/submissions/answers/', {
      params: { submission: submissionId },
    })
    return response.data
  },

  // Grade a single answer
  gradeAnswer: async (answerId: number, data: { score: number; feedback?: string }) => {
    const response = await apiClient.post(`/submissions/answers/${answerId}/grade/`, data)
    return response.data
  },

  // Bulk grade answers for a submission
  bulkGrade: async (
    submissionId: number,
    grades: { answer_id: number; score: number; feedback?: string }[]
  ) => {
    const response = await apiClient.post(`/submissions/submissions/${submissionId}/bulk_grade/`, {
      grades,
    })
    return response.data
  },

  // Auto-grade submission
  autoGrade: async (submissionId: number) => {
    const response = await apiClient.post(`/submissions/submissions/${submissionId}/auto_grade/`)
    return response.data
  },
}

// Student dashboard stats
export interface StudentDashboardStats {
  upcoming_exams_count: number
  completed_exams_count: number
  average_score: number | null
  pending_results_count: number
}

export const studentDashboardApi = {
  // Get dashboard stats
  getStats: async (): Promise<StudentDashboardStats> => {
    const response = await apiClient.get('/submissions/dashboard/stats/')
    return response.data
  },

  // Get upcoming exams for dashboard
  getUpcomingExams: async (limit: number = 5): Promise<StudentExam[]> => {
    const response = await apiClient.get('/assessments/student-exams/', {
      params: { available_only: true, page_size: limit },
    })
    return response.data.results
  },

  // Get recent submissions for dashboard
  getRecentSubmissions: async (limit: number = 5): Promise<SubmissionListItem[]> => {
    const response = await apiClient.get('/submissions/submissions/', {
      params: { page_size: limit, ordering: '-submitted_at' },
    })
    return response.data.results
  },
}

// Import StudentExam type for the dashboard API
import type { StudentExam } from '@/types'
