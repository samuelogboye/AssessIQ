import type { SubmissionListItem } from './submission'
import type { Question } from './question'
import type { User } from './auth'

export type GradingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed'
export type GradingMethod = 'auto' | 'mock' | 'openai' | 'claude' | 'gemini' | 'manual'

export interface GradingTask {
  id: number
  submission: SubmissionListItem
  submission_answer: number | null
  grading_method: GradingMethod
  status: GradingTaskStatus
  started_at: string | null
  completed_at: string | null
  celery_task_id: string | null
  result: Record<string, unknown> | null
  error_message: string | null
  retry_count: number
  max_retries: number
  duration: number | null
  created_at: string
  updated_at: string
}

export interface PendingSubmission {
  id: number
  student: User
  exam_title: string
  course_name: string
  attempt_number: number
  status: 'submitted' | 'graded' | 'in_progress'
  started_at: string
  submitted_at: string | null
  graded_at: string | null
  total_score: number | null
  percentage: number | null
  is_passed: boolean | null
  is_late: boolean
  flagged_for_review: boolean
}

export interface GradingTaskStatistics {
  total: number
  pending: number
  in_progress: number
  completed: number
  failed: number
  by_method: Record<string, number>
}

export type GradingScope = 'global' | 'exam' | 'question'

export interface GradingConfigurationListItem {
  id: number
  scope: GradingScope
  exam_title: string | null
  question_text: string | null
  grading_service: string
  is_active: boolean
  created_at: string
}

export interface GradingConfiguration {
  id: number
  scope: GradingScope
  exam: number | null
  exam_title?: string | null
  question: number | null
  question_text?: string | null
  grading_service: string
  service_config: Record<string, unknown>
  auto_grade_threshold: number
  require_manual_review: boolean
  grading_timeout: number
  max_retries: number
  system_prompt: string
  grading_prompt_template: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GradingServiceInfo {
  name: string
  display_name: string
  description: string
  requires_api_key: boolean
  supported_models: string[]
  default_model: string
  configuration_options: Record<string, unknown>
}

export interface BulkGradeResponse {
  message: string
  task_id: string
  submission_count: number
}

export interface GradingAnswer {
  id: number
  submission: number
  question: Question
  answer_text: string | null
  score: number | null
  feedback: string | null
  graded_by: string | null
  is_correct: boolean | null
  requires_manual_review: boolean
}
