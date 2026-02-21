import { apiClient } from './client'
import type { PaginatedResponse } from './courses'
import type {
  Question,
  QuestionCreateRequest,
  QuestionUpdateRequest,
  BulkCreateQuestionsRequest,
} from '@/types'

export interface QuestionsListParams {
  exam?: number
  question_type?: string
  page?: number
  page_size?: number
}

export const questionsApi = {
  // Get list of questions
  list: async (params?: QuestionsListParams): Promise<PaginatedResponse<Question>> => {
    const response = await apiClient.get('/assessments/questions/', { params })
    return response.data
  },

  // Get single question
  get: async (id: number): Promise<Question> => {
    const response = await apiClient.get(`/assessments/questions/${id}/`)
    return response.data
  },

  // Create question
  create: async (data: QuestionCreateRequest): Promise<Question> => {
    const response = await apiClient.post('/assessments/questions/', data)
    return response.data
  },

  // Bulk create questions
  bulkCreate: async (data: BulkCreateQuestionsRequest): Promise<Question[]> => {
    const response = await apiClient.post('/assessments/questions/bulk_create/', data)
    return response.data
  },

  // Update question
  update: async (id: number, data: QuestionUpdateRequest): Promise<Question> => {
    const response = await apiClient.patch(`/assessments/questions/${id}/`, data)
    return response.data
  },

  // Delete question
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/assessments/questions/${id}/`)
  },

  // Reorder questions
  reorder: async (examId: number, questionIds: number[]): Promise<void> => {
    await apiClient.post(`/assessments/exams/${examId}/reorder_questions/`, {
      question_ids: questionIds,
    })
  },
}
