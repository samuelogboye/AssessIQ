import type { User } from './auth'
import type { StudentQuestion } from './question'

export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded'

export interface Submission {
  id: number
  student: User
  exam: {
    id: number
    title: string
    course: {
      id: number
      code: string
      name: string
    }
    duration_minutes: number
    total_marks: number
    passing_marks: number
    questions?: StudentQuestion[]
  }
  attempt_number: number
  status: SubmissionStatus
  total_score: number | null
  percentage: number | null
  started_at: string
  submitted_at: string | null
  graded_at: string | null
  time_taken_seconds: number | null
  is_passed: boolean | null
  created_at: string
  updated_at: string
  // Questions included for in-progress submissions
  questions?: StudentQuestion[]
  // Answers included for review
  answers?: SubmissionAnswer[]
}

export interface SubmissionListItem {
  id: number
  exam_title: string
  exam_id: number
  course_name: string
  course_code: string
  attempt_number: number
  status: SubmissionStatus
  total_score: number | null
  percentage: number | null
  total_marks: number
  passing_marks: number
  started_at: string
  submitted_at: string | null
  graded_at: string | null
  is_passed: boolean | null
}

export interface SubmissionAnswer {
  id: number
  submission_id: number
  question: StudentQuestion
  answer_text: string | null
  score: number | null
  feedback: string | null
  graded_by: string | null
  is_correct: boolean | null
  created_at: string
  updated_at: string
}

// For the exam taking interface
export interface ExamSession {
  submission_id: number
  exam: {
    id: number
    title: string
    duration_minutes: number
    total_marks: number
    question_count: number
  }
  questions: StudentQuestion[]
  answers: Record<number, string> // question_id -> answer_text
  started_at: string
  time_remaining_seconds: number
}

export interface SubmissionReview {
  id: number
  exam: {
    id: number
    title: string
    course_name: string
    total_marks: number
    passing_marks: number
    allow_review: boolean
  }
  status: SubmissionStatus
  total_score: number | null
  percentage: number | null
  is_passed: boolean | null
  started_at: string
  submitted_at: string | null
  time_taken_seconds: number | null
  answers: SubmissionReviewAnswer[]
}

export interface SubmissionReviewAnswer {
  id: number
  question: {
    id: number
    question_number: number
    question_text: string
    question_type: string
    marks: number
    options: { key: string; text: string }[] | null
    correct_answer: string | null // Only shown if allow_review is true
  }
  answer_text: string | null
  score: number | null
  feedback: string | null
  is_correct: boolean | null
}

export interface CreateSubmissionRequest {
  exam_id: number
}

export interface CreateSubmissionResponse {
  id: number
  exam_id: number
  questions: StudentQuestion[]
  started_at: string
  duration_minutes: number
}

export interface SaveAnswerRequest {
  question_id: number
  answer_text: string
}

export interface SaveAnswerResponse {
  success: boolean
  answer_id: number
  saved_at: string
}

export interface SubmitAnswersRequest {
  answers: {
    question_id: number
    answer_text: string
  }[]
}

export interface SubmitAnswersResponse {
  success: boolean
  submission_id: number
  status: SubmissionStatus
  submitted_at: string
  total_score?: number
  percentage?: number
  is_passed?: boolean
}
