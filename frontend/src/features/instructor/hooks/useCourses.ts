import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { coursesApi, getErrorMessage } from '@/api'
import type { CoursesListParams } from '@/api'
import type { CourseCreateRequest, CourseUpdateRequest } from '@/types'

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: CoursesListParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: number) => [...courseKeys.details(), id] as const,
  exams: (id: number) => [...courseKeys.detail(id), 'exams'] as const,
}

export function useCourses(params?: CoursesListParams) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => coursesApi.list(params),
  })
}

export function useCourseDetail(id: number) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => coursesApi.get(id),
    enabled: !!id,
  })
}

export function useCourseExams(id: number) {
  return useQuery({
    queryKey: courseKeys.exams(id),
    queryFn: () => coursesApi.getExams(id),
    enabled: !!id,
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CourseCreateRequest) => coursesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      toast.success('Course created successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CourseUpdateRequest }) =>
      coursesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) })
      toast.success('Course updated successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      toast.success('Course deleted successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useToggleCourseActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => coursesApi.toggleActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) })
      toast.success('Course status updated')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
