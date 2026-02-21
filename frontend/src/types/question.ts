export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'

export interface QuestionOption {
  key: string
  text: string
}

export interface Question {
  id: number
  exam_id: number
  question_number: number
  question_text: string
  question_type: QuestionType
  marks: number
  options: QuestionOption[] | null
  correct_answer: string | null
  keywords: string[] | null
  use_ai_grading: boolean
  grading_rubric: string | null
  keyword_weight: number
  created_at: string
  updated_at: string
}

// Question for student view (no correct answer)
export interface StudentQuestion {
  id: number
  question_number: number
  question_text: string
  question_type: QuestionType
  marks: number
  options: QuestionOption[] | null
}

export interface QuestionCreateRequest {
  exam_id: number
  question_number?: number
  question_text: string
  question_type: QuestionType
  marks: number
  options?: QuestionOption[]
  correct_answer?: string
  keywords?: string[]
  use_ai_grading?: boolean
  grading_rubric?: string
  keyword_weight?: number
}

export interface QuestionUpdateRequest {
  question_number?: number
  question_text?: string
  question_type?: QuestionType
  marks?: number
  options?: QuestionOption[]
  correct_answer?: string
  keywords?: string[]
  use_ai_grading?: boolean
  grading_rubric?: string
  keyword_weight?: number
}

export interface BulkCreateQuestionsRequest {
  exam_id: number
  questions: Omit<QuestionCreateRequest, 'exam_id'>[]
}
