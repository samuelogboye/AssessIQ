import type { Course, CourseListItem } from './course'

export type ExamStatus = 'draft' | 'published' | 'archived'

export interface Exam {
  id: number
  title: string
  description: string
  course: Course
  duration_minutes: number
  total_marks: number
  passing_marks: number
  status: ExamStatus
  start_time: string | null
  end_time: string | null
  max_attempts: number
  shuffle_questions: boolean
  allow_review: boolean
  question_count: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface ExamListItem {
  id: number
  title: string
  description: string
  course: CourseListItem
  duration_minutes: number
  total_marks: number
  passing_marks: number
  status: ExamStatus
  start_time: string | null
  end_time: string | null
  question_count: number
  is_available: boolean
}

// Student-specific exam view
export interface StudentExam {
  id: number
  title: string
  description: string
  course: {
    id: number
    code: string
    name: string
  }
  duration_minutes: number
  total_marks: number
  passing_marks: number
  start_time: string | null
  end_time: string | null
  question_count: number
  is_available: boolean
  attempts_remaining: number
  max_attempts: number
  my_submissions_count: number
  best_score: number | null
}

export interface StudentExamDetail extends StudentExam {
  instructions: string
  allow_review: boolean
  shuffle_questions: boolean
}

export interface CanAttemptResponse {
  can_attempt: boolean
  reason?: string
  attempts_remaining: number
}

export interface ExamCreateRequest {
  title: string
  description?: string
  course_id: number
  duration_minutes: number
  total_marks?: number
  passing_marks: number
  start_time?: string
  end_time?: string
  max_attempts?: number
  shuffle_questions?: boolean
  allow_review?: boolean
}

export interface ExamUpdateRequest {
  title?: string
  description?: string
  course_id?: number
  duration_minutes?: number
  total_marks?: number
  passing_marks?: number
  start_time?: string
  end_time?: string
  max_attempts?: number
  shuffle_questions?: boolean
  allow_review?: boolean
}

export interface ExamStatistics {
  total_submissions: number
  graded_submissions: number
  average_score: number
  highest_score: number
  lowest_score: number
  pass_rate: number
  score_distribution: {
    range: string
    count: number
  }[]
  question_statistics: {
    question_id: number
    question_number: number
    average_score: number
    max_marks: number
    correct_percentage: number
  }[]
}
