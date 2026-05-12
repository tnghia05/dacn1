export const API_BASE_URL = 'https://backend36.dev/api/v1'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  noAuth?: boolean
}

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

function getToken(): string | null {
  return localStorage.getItem('access_token')
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

function parseErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Có lỗi xảy ra'
  const d = data as Record<string, unknown>
  if (typeof d.message === 'string') return d.message
  if (Array.isArray(d.message)) return d.message.join('; ')
  if (d.error && typeof d.error === 'object') {
    const e = d.error as Record<string, unknown>
    if (typeof e.message === 'string') return e.message
    if (e.details && typeof e.details === 'object') {
      const det = (e.details as Record<string, unknown>).message
      if (Array.isArray(det)) return det.join('; ')
    }
  }
  return 'Có lỗi xảy ra'
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, noAuth = false } = options

  const authHeaders: Record<string, string> = {}
  if (!noAuth) {
    const token = getToken()
    if (token) authHeaders['Authorization'] = `Bearer ${token}`
  }

  const csrfHeaders: Record<string, string> = {}
  if (endpoint.includes('/auth/refresh') || endpoint.includes('/auth/logout')) {
    const csrf = getCsrfToken()
    if (csrf) csrfHeaders['x-csrf-token'] = csrf
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...csrfHeaders,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let data: unknown
    try { data = await response.json() } catch { data = null }
    throw new ApiError(parseErrorMessage(data), response.status, data)
  }

  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}

export async function apiUpload(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!response.ok) throw new ApiError('Upload failed', response.status)
}

/** Must match backend R2PresignDto.folder */
export type R2UploadFolder = 'post' | 'product' | 'avatar' | 'video' | 'misc'

export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  folder: R2UploadFolder = 'misc',
) {
  return apiRequest<{ uploadUrl: string; publicUrl: string }>('/uploads/r2/presign', {
    method: 'POST',
    body: { fileName, contentType, folder },
  })
}
