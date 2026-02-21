import { apiClient } from './client'
import type {
  Course,
  CourseListItem,
  CourseCreateRequest,
  CourseUpdateRequest,
} from '@/types'

export interface CoursesListParams {
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const coursesApi = {
  // Get list of courses
  list: async (params?: CoursesListParams): Promise<PaginatedResponse<CourseListItem>> => {
    const response = await apiClient.get('/assessments/courses/', { params })
    return response.data
  },

  // Get single course
  get: async (id: number): Promise<Course> => {
    const response = await apiClient.get(`/assessments/courses/${id}/`)
    return response.data
  },

  // Create course (instructor only)
  create: async (data: CourseCreateRequest): Promise<Course> => {
    const response = await apiClient.post('/assessments/courses/', data)
    return response.data
  },

  // Update course (instructor only)
  update: async (id: number, data: CourseUpdateRequest): Promise<Course> => {
    const response = await apiClient.patch(`/assessments/courses/${id}/`, data)
    return response.data
  },

  // Delete course (instructor only)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/assessments/courses/${id}/`)
  },

  // Toggle course active status
  toggleActive: async (id: number): Promise<Course> => {
    const response = await apiClient.post(`/assessments/courses/${id}/toggle_active/`)
    return response.data
  },

  // Get exams for a course
  getExams: async (id: number): Promise<PaginatedResponse<CourseListItem>> => {
    const response = await apiClient.get(`/assessments/courses/${id}/exams/`)
    return response.data
  },
}
