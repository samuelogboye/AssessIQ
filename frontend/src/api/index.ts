export { apiClient, tokenStorage, getErrorMessage } from './client'
export { authApi } from './auth'
export { coursesApi } from './courses'
export { examsApi, studentExamsApi } from './exams'
export { questionsApi } from './questions'
export { submissionsApi, studentDashboardApi } from './submissions'
export { instructorDashboardApi } from './instructor'
export type { PaginatedResponse, CoursesListParams } from './courses'
export type { ExamsListParams, StudentExamsListParams } from './exams'
export type { QuestionsListParams } from './questions'
export type { SubmissionsListParams, StudentDashboardStats } from './submissions'
export type {
  InstructorDashboardStats,
  PendingGradingItem,
  RecentActivityItem,
} from './instructor'
