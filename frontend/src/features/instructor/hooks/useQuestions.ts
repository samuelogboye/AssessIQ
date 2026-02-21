import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { questionsApi, getErrorMessage } from '@/api'
import type { QuestionsListParams } from '@/api'
import type {
  QuestionCreateRequest,
  QuestionUpdateRequest,
  BulkCreateQuestionsRequest,
} from '@/types'
import { examKeys } from './useExams'

export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (params?: QuestionsListParams) => [...questionKeys.lists(), params] as const,
  details: () => [...questionKeys.all, 'detail'] as const,
  detail: (id: number) => [...questionKeys.details(), id] as const,
}

export function useQuestions(params?: QuestionsListParams) {
  return useQuery({
    queryKey: questionKeys.list(params),
    queryFn: () => questionsApi.list(params),
  })
}

export function useExamQuestions(examId: number) {
  return useQuery({
    queryKey: questionKeys.list({ exam: examId }),
    queryFn: () => questionsApi.list({ exam: examId }),
    enabled: !!examId,
  })
}

export function useQuestionDetail(id: number) {
  return useQuery({
    queryKey: questionKeys.detail(id),
    queryFn: () => questionsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: QuestionCreateRequest) => questionsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: examKeys.detail(variables.exam_id) })
      toast.success('Question created successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useBulkCreateQuestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkCreateQuestionsRequest) => questionsApi.bulkCreate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: examKeys.detail(variables.exam_id) })
      toast.success('Questions created successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuestionUpdateRequest }) =>
      questionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() })
      toast.success('Question updated successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => questionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() })
      toast.success('Question deleted successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useReorderQuestions(examId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (questionIds: number[]) => questionsApi.reorder(examId, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: examKeys.detail(examId) })
      toast.success('Questions reordered')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
