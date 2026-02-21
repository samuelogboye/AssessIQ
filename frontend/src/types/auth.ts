export type UserRole = 'student' | 'instructor' | 'admin'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: UserRole
  is_verified: boolean
  is_active: boolean
  date_joined: string
  last_login: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface RegisterRequest {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  role: 'student' | 'instructor'
}

export interface RegisterResponse extends User {}

export interface RefreshTokenRequest {
  refresh: string
}

export interface RefreshTokenResponse {
  access: string
}

export interface LogoutRequest {
  refresh: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  uidb64: string
  token: string
  new_password: string
  new_password_confirm: string
}

export interface VerifyEmailRequest {
  uidb64: string
  token: string
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
}

export interface ApiError {
  detail?: string | string[]
  error?: string
  [key: string]: unknown
}

export interface MessageResponse {
  message: string
}
