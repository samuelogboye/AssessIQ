import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/lib/constants'

// Token storage keys
const ACCESS_TOKEN_KEY = 'assessiq_access_token'
const REFRESH_TOKEN_KEY = 'assessiq_refresh_token'

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management functions
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  setAccessToken: (access: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const notifySessionExpired = () => {
  window.dispatchEvent(new CustomEvent('auth:expired'))
}

// Auth endpoints that should NOT trigger token refresh on 401
const AUTH_ENDPOINTS = [
  '/auth/login/',
  '/auth/register/',
  '/auth/token/',
  '/auth/token/refresh/',
  '/auth/password-reset/',
  '/auth/verify-email/',
]

const isAuthEndpoint = (url: string | undefined): boolean => {
  if (!url) return false
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Don't try to refresh tokens for auth endpoints (login, register, etc.)
    // These 401s are legitimate authentication failures, not expired tokens
    if (isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error)
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return apiClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = tokenStorage.getRefreshToken()

    if (!refreshToken) {
      tokenStorage.clearTokens()
      notifySessionExpired()
      // Don't redirect here - let the ProtectedRoute handle it
      return Promise.reject(error)
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      })

      const { access } = response.data
      tokenStorage.setAccessToken(access)

      processQueue(null, access)

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${access}`
      }

      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError as Error, null)
      tokenStorage.clearTokens()
      notifySessionExpired()
      // Don't redirect here - let the ProtectedRoute handle it
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

// Helper to extract error message from API response
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    // Handle detail field - can be string, array, or object with field errors
    if (data?.detail) {
      if (typeof data.detail === 'string') {
        return data.detail
      }
      if (Array.isArray(data.detail)) {
        return data.detail.join(', ')
      }
      // Handle object with field-specific errors like { email: ["error msg"] }
      if (typeof data.detail === 'object') {
        const fieldErrors = Object.entries(data.detail)
          .map(([key, value]) => {
            const messages = Array.isArray(value) ? value.join(', ') : String(value)
            return `${key}: ${messages}`
          })
        if (fieldErrors.length > 0) {
          return fieldErrors.join('; ')
        }
      }
    }

    // Handle simple error field
    if (data?.error && typeof data.error === 'string') {
      return data.error
    }

    // Handle message field - ensure it's a string
    if (data?.message && typeof data.message === 'string') {
      return data.message
    }

    // Check for field-specific errors at root level (non_field_errors, email, etc.)
    if (data && typeof data === 'object') {
      const fieldErrors = Object.entries(data)
        .filter(([key]) => !['detail', 'error', 'message', 'status_code', 'error'].includes(key))
        .map(([key, value]) => {
          const messages = Array.isArray(value) ? value.join(', ') : String(value)
          return `${key}: ${messages}`
        })
      if (fieldErrors.length > 0) {
        return fieldErrors.join('; ')
      }
    }

    return error.message || 'An error occurred'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}
