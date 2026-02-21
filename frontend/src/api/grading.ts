import { apiClient } from './client'
import type { PaginatedResponse } from './courses'
import type {
  GradingTask,
  GradingTaskStatistics,
  GradingConfiguration,
  GradingConfigurationListItem,
  GradingServiceInfo,
  BulkGradeResponse,
} from '@/types'

export interface GradingTasksParams {
  status?: string
  method?: string
  submission?: number
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface GradingConfigParams {
  scope?: string
  service?: string
  is_active?: boolean
  exam?: number
  search?: string
}

export const gradingApi = {
  listTasks: async (params?: GradingTasksParams): Promise<PaginatedResponse<GradingTask>> => {
    const response = await apiClient.get('/grading/tasks/', { params })
    return response.data
  },

  getTaskStats: async (): Promise<GradingTaskStatistics> => {
    const response = await apiClient.get('/grading/tasks/statistics/')
    return response.data
  },

  listConfigs: async (
    params?: GradingConfigParams
  ): Promise<PaginatedResponse<GradingConfigurationListItem>> => {
    const response = await apiClient.get('/grading/configurations/', { params })
    return response.data
  },

  getConfig: async (id: number): Promise<GradingConfiguration> => {
    const response = await apiClient.get(`/grading/configurations/${id}/`)
    return response.data
  },

  createConfig: async (data: Partial<GradingConfiguration>): Promise<GradingConfiguration> => {
    const response = await apiClient.post('/grading/configurations/', data)
    return response.data
  },

  updateConfig: async (id: number, data: Partial<GradingConfiguration>): Promise<GradingConfiguration> => {
    const response = await apiClient.patch(`/grading/configurations/${id}/`, data)
    return response.data
  },

  deleteConfig: async (id: number): Promise<void> => {
    await apiClient.delete(`/grading/configurations/${id}/`)
  },

  getServices: async (): Promise<GradingServiceInfo[]> => {
    const response = await apiClient.get('/grading/configurations/services/')
    return response.data
  },

  bulkGrade: async (submission_ids: number[], force_regrade: boolean = false): Promise<BulkGradeResponse> => {
    const response = await apiClient.post('/grading/configurations/bulk_grade/', {
      submission_ids,
      force_regrade,
    })
    return response.data
  },
}
