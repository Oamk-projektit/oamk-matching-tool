/**
 * ============================================================================
 * SHARED CONTRACT — Tommi + Venla
 * ============================================================================
 *
 * Thin HTTP client for the canonical `/api/*` contract (issue #104, #143).
 * Tommi maintains path helpers; Venla calls these from frontend services
 * instead of hard-coding URLs in components.
 *
 * Rules:
 * - No React components or hooks in this module.
 * - Prefer `credentials: 'include'` for browser cookie sessions.
 * - Optional Bearer token for Postman / scripts.
 */

import type {
  ApplicantListItem,
  ApplicationResponse,
  ApplicationWithOpportunity,
  CreateApplicationRequest,
  CreateOpportunityRequest,
  CreateStudentRequest,
  HealthResponse,
  ListResponse,
  MatchResultResponse,
  MeResponse,
  OpportunityResponse,
  RunMatchesRequest,
  StudentResponse,
  UpdateApplicationStatusRequest,
  UpdateOpportunityRequest,
  UpdateStudentRequest,
  ApiErrorBody,
  Notification,
} from '@/types/legacy'

export class SharedApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message)
    this.name = 'SharedApiError'
    this.status = status
    this.body = body
  }
}

export type SharedApiClientOptions = {
  /** Default: '' (same origin) or e.g. http://localhost:3000 */
  baseUrl?: string
  /** Optional Supabase access_token for non-browser clients */
  accessToken?: string | null
  fetchImpl?: typeof fetch
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export function createSharedApiClient(options: SharedApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? ''
  const fetchImpl = options.fetchImpl ?? fetch

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(init.headers)
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (options.accessToken) {
      headers.set('Authorization', `Bearer ${options.accessToken}`)
    }

    const response = await fetchImpl(joinUrl(baseUrl, path), {
      ...init,
      headers,
      credentials: init.credentials ?? 'include',
    })

    if (response.status === 204) {
      return undefined as T
    }

    const text = await response.text()
    const payload = text ? (JSON.parse(text) as unknown) : null

    if (!response.ok) {
      const errBody = payload as ApiErrorBody | null
      throw new SharedApiError(
        response.status,
        errBody?.error?.message ?? `HTTP ${response.status}`,
        errBody
      )
    }

    return payload as T
  }

  return {
    health: () => request<HealthResponse>('/api/health'),
    me: () => request<MeResponse>('/api/me'),

    // --- students ---
    listStudents: () =>
      request<ListResponse<StudentResponse>>('/api/students'),
    getStudent: (id: string) =>
      request<StudentResponse>(`/api/students/${id}`),
    createStudent: (body: CreateStudentRequest) =>
      request<StudentResponse>('/api/students', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateStudent: (id: string, body: UpdateStudentRequest) =>
      request<StudentResponse>(`/api/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    // --- opportunities ---
    listOpportunities: (query?: { type?: string; q?: string }) => {
      const params = new URLSearchParams()
      if (query?.type) params.set('type', query.type)
      if (query?.q) params.set('q', query.q)
      const qs = params.toString()
      return request<ListResponse<OpportunityResponse>>(
        `/api/opportunities${qs ? `?${qs}` : ''}`
      )
    },
    getOpportunity: (id: string) =>
      request<OpportunityResponse>(`/api/opportunities/${id}`),
    createOpportunity: (body: CreateOpportunityRequest) =>
      request<OpportunityResponse>('/api/opportunities', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateOpportunity: (id: string, body: UpdateOpportunityRequest) =>
      request<OpportunityResponse>(`/api/opportunities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    deleteOpportunity: (id: string) =>
      request<void>(`/api/opportunities/${id}`, { method: 'DELETE' }),
    listApplicants: (opportunityId: string) =>
      request<ListResponse<ApplicantListItem>>(
        `/api/opportunities/${opportunityId}/applicants`
      ),
    listOpportunityMatches: (opportunityId: string) =>
      request<ListResponse<MatchResultResponse>>(
        `/api/opportunities/${opportunityId}/matches`
      ),

    // --- applications ---
    createApplication: (body: CreateApplicationRequest) =>
      request<ApplicationResponse>('/api/applications', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    myApplications: () =>
      request<ListResponse<ApplicationWithOpportunity>>(
        '/api/applications/me'
      ),
    updateApplicationStatus: (
      id: string,
      body: UpdateApplicationStatusRequest
    ) =>
      request<ApplicationResponse>(`/api/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    // --- matching ---
    runMatching: (studentId: string, body: RunMatchesRequest = {}) =>
      request<ListResponse<MatchResultResponse>>(
        `/api/matches/run/${studentId}`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      ),
    getMatches: (studentId: string, limit = 10) =>
      request<ListResponse<MatchResultResponse>>(
        `/api/matches/${studentId}?limit=${limit}`
      ),

    // --- notifications ---
    listNotifications: (opts?: { unread?: boolean; limit?: number }) => {
      const params = new URLSearchParams()
      if (opts?.unread) params.set('unread', 'true')
      if (opts?.limit) params.set('limit', String(opts.limit))
      const qs = params.toString()
      return request<
        ListResponse<Notification> & { meta: { unread_count?: number } }
      >(`/api/notifications${qs ? `?${qs}` : ''}`)
    },
    markNotificationRead: (id: string) =>
      request<Notification>(`/api/notifications/${id}`, { method: 'PATCH' }),
    markAllNotificationsRead: () =>
      request<{ updated: number }>('/api/notifications/read-all', {
        method: 'POST',
      }),
  }
}

export type SharedApiClient = ReturnType<typeof createSharedApiClient>
