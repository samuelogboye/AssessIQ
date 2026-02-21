import { useQuery } from '@tanstack/react-query'
import { studentExamsApi, type StudentExamsListParams } from '@/api'

export const studentExamKeys = {
  all: ['student-exams'] as const,
  lists: () => [...studentExamKeys.all, 'list'] as const,
  list: (params?: StudentExamsListParams) => [...studentExamKeys.lists(), params] as const,
  details: () => [...studentExamKeys.all, 'detail'] as const,
  detail: (id: number) => [...studentExamKeys.details(), id] as const,
  canAttempt: (id: number) => [...studentExamKeys.detail(id), 'can-attempt'] as const,
  mySubmissions: (id: number) => [...studentExamKeys.detail(id), 'my-submissions'] as const,
}

export function useStudentExams(params?: StudentExamsListParams) {
  return useQuery({
    queryKey: studentExamKeys.list(params),
    queryFn: () => studentExamsApi.list(params),
  })
}

export function useStudentExamDetail(id: number) {
  return useQuery({
    queryKey: studentExamKeys.detail(id),
    queryFn: () => studentExamsApi.get(id),
    enabled: !!id,
  })
}

export function useCanAttemptExam(id: number) {
  return useQuery({
    queryKey: studentExamKeys.canAttempt(id),
    queryFn: () => studentExamsApi.canAttempt(id),
    enabled: !!id,
  })
}

export function useMyExamSubmissions(examId: number) {
  return useQuery({
    queryKey: studentExamKeys.mySubmissions(examId),
    queryFn: () => studentExamsApi.getMySubmissions(examId),
    enabled: !!examId,
  })
}
