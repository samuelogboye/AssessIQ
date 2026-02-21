import { apiClient } from './client'
import type { PaginatedResponse } from './courses'
import type {
  Exam,
  ExamListItem,
  StudentExam,
  StudentExamDetail,
  CanAttemptResponse,
  ExamCreateRequest,
  ExamUpdateRequest,
  ExamStatistics,
} from '@/types'
import type { SubmissionListItem } from '@/types'

export interface ExamsListParams {
  search?: string
  course?: number
  status?: 'draft' | 'published' | 'archived'
  page?: number
  page_size?: number
}

export interface StudentExamsListParams {
  search?: string
  course?: number
  available_only?: boolean
  page?: number
  page_size?: number
}

// Instructor exam endpoints
export const examsApi = {
  // Get all exams (instructor)
  list: async (params?: ExamsListParams): Promise<PaginatedResponse<ExamListItem>> => {
    const response = await apiClient.get('/assessments/exams/', { params })
    return response.data
  },

  // Get single exam detail (instructor)
  get: async (id: number): Promise<Exam> => {
    const response = await apiClient.get(`/assessments/exams/${id}/`)
    return response.data
  },

  // Create exam (instructor)
  create: async (data: ExamCreateRequest): Promise<Exam> => {
    const response = await apiClient.post('/assessments/exams/', data)
    return response.data
  },

  // Update exam (instructor)
  update: async (id: number, data: ExamUpdateRequest): Promise<Exam> => {
    const response = await apiClient.patch(`/assessments/exams/${id}/`, data)
    return response.data
  },

  // Delete exam (instructor)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/assessments/exams/${id}/`)
  },

  // Publish exam (instructor)
  publish: async (id: number): Promise<Exam> => {
    const response = await apiClient.post(`/assessments/exams/${id}/publish/`)
    return response.data
  },

  // Archive exam (instructor)
  archive: async (id: number): Promise<Exam> => {
    const response = await apiClient.post(`/assessments/exams/${id}/archive/`)
    return response.data
  },

  // Get exam submissions (instructor)
  getSubmissions: async (id: number): Promise<PaginatedResponse<SubmissionListItem>> => {
    const response = await apiClient.get(`/assessments/exams/${id}/submissions/`)
    return response.data
  },

  // Get exam statistics (instructor)
  getStatistics: async (id: number): Promise<ExamStatistics> => {
    const response = await apiClient.get(`/assessments/exams/${id}/statistics/`)
    return response.data
  },
}

// Student exam endpoints
export const studentExamsApi = {
  // Get available exams for student
  list: async (params?: StudentExamsListParams): Promise<PaginatedResponse<StudentExam>> => {
    const response = await apiClient.get('/assessments/student-exams/', { params })
    return response.data
  },

  // Get exam detail for student
  get: async (id: number): Promise<StudentExamDetail> => {
    const response = await apiClient.get(`/assessments/student-exams/${id}/`)
    return response.data
  },

  // Check if student can attempt exam
  canAttempt: async (id: number): Promise<CanAttemptResponse> => {
    const response = await apiClient.get(`/assessments/student-exams/${id}/can_attempt/`)
    return response.data
  },

  // Get student's submissions for an exam
  getMySubmissions: async (id: number): Promise<SubmissionListItem[]> => {
    const response = await apiClient.get(`/assessments/student-exams/${id}/my_submissions/`)
    return response.data
  },
}
