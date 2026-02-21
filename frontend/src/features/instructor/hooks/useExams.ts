import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { examsApi, getErrorMessage } from '@/api'
import type { ExamsListParams } from '@/api'
import type { ExamCreateRequest, ExamUpdateRequest } from '@/types'

export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  list: (params?: ExamsListParams) => [...examKeys.lists(), params] as const,
  details: () => [...examKeys.all, 'detail'] as const,
  detail: (id: number) => [...examKeys.details(), id] as const,
  submissions: (id: number) => [...examKeys.detail(id), 'submissions'] as const,
  statistics: (id: number) => [...examKeys.detail(id), 'statistics'] as const,
}

export function useExams(params?: ExamsListParams) {
  return useQuery({
    queryKey: examKeys.list(params),
    queryFn: () => examsApi.list(params),
  })
}

export function useExamDetail(id: number) {
  return useQuery({
    queryKey: examKeys.detail(id),
    queryFn: () => examsApi.get(id),
    enabled: !!id,
  })
}

export function useExamSubmissions(id: number) {
  return useQuery({
    queryKey: examKeys.submissions(id),
    queryFn: () => examsApi.getSubmissions(id),
    enabled: !!id,
  })
}

export function useExamStatistics(id: number) {
  return useQuery({
    queryKey: examKeys.statistics(id),
    queryFn: () => examsApi.getStatistics(id),
    enabled: !!id,
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExamCreateRequest) => examsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() })
      toast.success('Exam created successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExamUpdateRequest }) =>
      examsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() })
      queryClient.invalidateQueries({ queryKey: examKeys.detail(variables.id) })
      toast.success('Exam updated successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => examsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() })
      toast.success('Exam deleted successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function usePublishExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => examsApi.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() })
      queryClient.invalidateQueries({ queryKey: examKeys.detail(id) })
      toast.success('Exam published successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useArchiveExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => examsApi.archive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() })
      queryClient.invalidateQueries({ queryKey: examKeys.detail(id) })
      toast.success('Exam archived successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
