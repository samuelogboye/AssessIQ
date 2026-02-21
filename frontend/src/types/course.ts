import type { User } from './auth'

export interface Course {
  id: number
  code: string
  name: string
  description: string
  instructor: User
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CourseListItem {
  id: number
  code: string
  name: string
  description: string
  instructor_name: string
  is_active: boolean
  exam_count: number
}

export interface CourseCreateRequest {
  code: string
  name: string
  description?: string
  is_active?: boolean
}

export interface CourseUpdateRequest {
  code?: string
  name?: string
  description?: string
  is_active?: boolean
}
