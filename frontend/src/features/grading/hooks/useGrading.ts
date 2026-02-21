import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { gradingApi, submissionsApi, getErrorMessage } from '@/api'
import type { GradingConfigParams, GradingTasksParams } from '@/api'

export const gradingKeys = {
  all: ['grading'] as const,
  tasks: () => [...gradingKeys.all, 'tasks'] as const,
  taskList: (params?: GradingTasksParams) => [...gradingKeys.tasks(), params] as const,
  taskStats: () => [...gradingKeys.tasks(), 'stats'] as const,
  configs: () => [...gradingKeys.all, 'configs'] as const,
  configList: (params?: GradingConfigParams) => [...gradingKeys.configs(), params] as const,
  services: () => [...gradingKeys.all, 'services'] as const,
  pending: () => [...gradingKeys.all, 'pending'] as const,
  answers: (submissionId: number) => [...gradingKeys.all, 'answers', submissionId] as const,
}

export function useGradingTasks(params?: GradingTasksParams) {
  return useQuery({
    queryKey: gradingKeys.taskList(params),
    queryFn: () => gradingApi.listTasks(params),
  })
}

export function useGradingTaskStats() {
  return useQuery({
    queryKey: gradingKeys.taskStats(),
    queryFn: () => gradingApi.getTaskStats(),
  })
}

export function useGradingConfigs(params?: GradingConfigParams) {
  return useQuery({
    queryKey: gradingKeys.configList(params),
    queryFn: () => gradingApi.listConfigs(params),
  })
}

export function useGradingServices() {
  return useQuery({
    queryKey: gradingKeys.services(),
    queryFn: () => gradingApi.getServices(),
  })
}

export function useCreateGradingConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gradingApi.createConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingKeys.configs() })
      toast.success('Configuration created')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateGradingConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => gradingApi.updateConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingKeys.configs() })
      toast.success('Configuration updated')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteGradingConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => gradingApi.deleteConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingKeys.configs() })
      toast.success('Configuration deleted')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useBulkGradeSubmissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionIds, forceRegrade }: { submissionIds: number[]; forceRegrade?: boolean }) =>
      gradingApi.bulkGrade(submissionIds, forceRegrade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingKeys.tasks() })
      toast.success('Bulk grading started')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function usePendingGradingSubmissions() {
  return useQuery({
    queryKey: gradingKeys.pending(),
    queryFn: () => submissionsApi.pendingGrading(),
  })
}

export function useSubmissionAnswersForGrading(submissionId: number) {
  return useQuery({
    queryKey: gradingKeys.answers(submissionId),
    queryFn: () => submissionsApi.getSubmissionAnswers(submissionId),
    enabled: !!submissionId,
  })
}

export function useGradeAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ answerId, score, feedback }: { answerId: number; score: number; feedback?: string }) =>
      submissionsApi.gradeAnswer(answerId, { score, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingKeys.answers(0) })
      toast.success('Answer graded')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useBulkGradeAnswers() {
  return useMutation({
    mutationFn: ({ submissionId, grades }: { submissionId: number; grades: { answer_id: number; score: number; feedback?: string }[] }) =>
      submissionsApi.bulkGrade(submissionId, grades),
    onSuccess: () => toast.success('Grades saved'),
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useAutoGradeSubmission() {
  return useMutation({
    mutationFn: (submissionId: number) => submissionsApi.autoGrade(submissionId),
    onSuccess: () => toast.success('Auto-grading started'),
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
