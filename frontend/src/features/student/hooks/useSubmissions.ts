import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { submissionsApi, type SubmissionsListParams, getErrorMessage } from '@/api'
import type {
  CreateSubmissionRequest,
  SaveAnswerRequest,
  SubmitAnswersRequest,
} from '@/types'

export const submissionKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionKeys.all, 'list'] as const,
  list: (params?: SubmissionsListParams) => [...submissionKeys.lists(), params] as const,
  details: () => [...submissionKeys.all, 'detail'] as const,
  detail: (id: number) => [...submissionKeys.details(), id] as const,
  review: (id: number) => [...submissionKeys.detail(id), 'review'] as const,
  answers: (id: number) => [...submissionKeys.detail(id), 'answers'] as const,
}

export function useSubmissions(params?: SubmissionsListParams) {
  return useQuery({
    queryKey: submissionKeys.list(params),
    queryFn: () => submissionsApi.list(params),
  })
}

export function useSubmissionDetail(id: number) {
  return useQuery({
    queryKey: submissionKeys.detail(id),
    queryFn: () => submissionsApi.get(id),
    enabled: !!id,
  })
}

export function useSubmissionReview(id: number) {
  return useQuery({
    queryKey: submissionKeys.review(id),
    queryFn: () => submissionsApi.getReview(id),
    enabled: !!id,
  })
}

export function useSubmissionAnswers(id: number) {
  return useQuery({
    queryKey: submissionKeys.answers(id),
    queryFn: () => submissionsApi.getAnswers(id),
    enabled: !!id,
  })
}

export function useCreateSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSubmissionRequest) => submissionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useSaveAnswer(submissionId: number) {
  return useMutation({
    mutationFn: (data: SaveAnswerRequest) => submissionsApi.saveAnswer(submissionId, data),
    // Silent save - no toast on success or error for auto-save
  })
}

export function useSubmitExam(submissionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubmitAnswersRequest) => submissionsApi.submitAnswers(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: submissionKeys.detail(submissionId) })
      toast.success('Exam submitted successfully!')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
