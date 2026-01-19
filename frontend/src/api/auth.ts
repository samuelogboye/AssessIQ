import { apiClient, tokenStorage } from './client'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutRequest,
  ChangePasswordRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  VerifyEmailRequest,
  UpdateProfileRequest,
  User,
  MessageResponse,
} from '@/types'

// Auth API endpoints
export const authApi = {
  // Login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', data)
    const { access, refresh } = response.data
    tokenStorage.setTokens(access, refresh)
    return response.data
  },

  // Register
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register/', data)
    return response.data
  },

  // Logout
  logout: async (): Promise<void> => {
    const refresh = tokenStorage.getRefreshToken()
    if (refresh) {
      try {
        await apiClient.post<MessageResponse>('/auth/logout/', { refresh })
      } catch {
        // Ignore logout errors, clear tokens anyway
      }
    }
    tokenStorage.clearTokens()
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile/')
    return response.data
  },

  // Update profile
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/profile/', data)
    return response.data
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/change-password/', data)
    return response.data
  },

  // Request password reset
  requestPasswordReset: async (data: PasswordResetRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/password-reset/', data)
    return response.data
  },

  // Confirm password reset
  confirmPasswordReset: async (data: PasswordResetConfirmRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/password-reset/confirm/', data)
    return response.data
  },

  // Verify email
  verifyEmail: async (data: VerifyEmailRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/verify-email/', data)
    return response.data
  },

  // Resend verification email
  resendVerification: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/resend-verification/')
    return response.data
  },

  // Check if user is authenticated (has valid token)
  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken()
  },
}
