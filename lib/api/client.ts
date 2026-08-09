/**
 * ============================================================================
 * Projects-model browser API client
 * ============================================================================
 *
 * Thin `fetch`-based client for the `/api/*` projects-model contract.
 * Unlike `lib/shared/api-client.ts` (older shared helpers),
 * this client unwraps the `{ data, meta }` success envelope from
 * `types/api.ts` so callers work directly with domain types from
 * `types/domain.ts`.
 *
 * Rules:
 * - No React components or hooks in this module (see `lib/auth/AuthProvider.tsx`
 *   for the React binding).
 * - Uses `credentials: 'include'` so browser cookie sessions are sent.
 * - Optional Bearer token supported for scripts / non-browser callers.
 */

import type {
  AddStudentCourseRequest,
  AddStudentInterestRequest,
  AddStudentSkillRequest,
  ApiErrorBody,
  ApiErrorCode,
  ApiFieldError,
  ApplicantListItem,
  ApplicationWithProject,
  CreateApplicationRequest,
  CreateProjectRequest,
  CreateSelectionDecisionRequest,
  CreateStudentRequest,
  MeData,
  ProjectDetail,
  RunMatchesRequest,
  StudentDetail,
  TopMatchItem,
  UpdateProjectRequest,
  UpdateStudentRequest,
} from '@/types/api'
import type {
  Application,
  ApplicationStatus,
  AuditEvent,
  Course,
  Interest,
  Match,
  Notification,
  Project,
  ProjectStatus,
  ProjectType,
  SelectionDecision,
  Skill,
  Student,
  StudentCourse,
} from '@/types/domain'

/** Thrown for any non-2xx response from the projects-model API. */
export class ApiClientError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details?: ApiFieldError[]

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: ApiFieldError[]
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export type ApiClientOptions = {
  /** Default: '' (same origin) or e.g. http://localhost:3000 */
  baseUrl?: string
  /** Optional Supabase access_token for non-browser clients (Postman, scripts). */
  accessToken?: string | null
  fetchImpl?: typeof fetch
}

export interface ApplicantsResult {
  items: ApplicantListItem[]
  count: number
  /** Present when the caller may see ranked shortlists (company/teacher/admin). */
  topN?: number
}

export interface TopCandidatesResult {
  items: TopMatchItem[]
  count: number
  projectId: string
  limit: number
}

export interface NotificationsResult {
  items: Notification[]
  count: number
  unreadCount: number
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function toQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    usp.set(key, String(value))
  }
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}

async function requestEnvelope<T, M extends object = Record<string, never>>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  accessToken: string | null | undefined,
  path: string,
  init: RequestInit = {}
): Promise<{ data: T; meta: M }> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetchImpl(joinUrl(baseUrl, path), {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  })

  if (response.status === 204) {
    return { data: undefined as T, meta: {} as M }
  }

  const text = await response.text()
  const payload = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    const errBody = payload as ApiErrorBody | null
    throw new ApiClientError(
      response.status,
      errBody?.error?.code ?? 'INTERNAL_ERROR',
      errBody?.error?.message ?? `HTTP ${response.status}`,
      errBody?.error?.details
    )
  }

  const envelope = (payload ?? { data: undefined, meta: {} }) as {
    data: T
    meta: M
  }
  return envelope
}

/**
 * Creates a projects-model API client.
 *
 * @example
 * const client = createApiClient()
 * const me = await client.me()
 */
export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? ''
  const fetchImpl = options.fetchImpl ?? fetch
  const accessToken = options.accessToken

  async function req<T, M extends object = Record<string, never>>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const { data } = await requestEnvelope<T, M>(
      fetchImpl,
      baseUrl,
      accessToken,
      path,
      init
    )
    return data
  }

  function reqEnvelope<T, M extends object = Record<string, never>>(
    path: string,
    init?: RequestInit
  ): Promise<{ data: T; meta: M }> {
    return requestEnvelope<T, M>(fetchImpl, baseUrl, accessToken, path, init)
  }

  return {
    // --- me ---
    me: () => req<MeData>('/api/me'),

    // --- catalog ---
    listCourses: (query?: { search?: string }) =>
      req<Course[]>(`/api/courses${toQueryString({ search: query?.search })}`),
    getCourse: (id: string) => req<Course>(`/api/courses/${id}`),
    listSkills: () => req<Skill[]>('/api/skills'),
    listInterests: () => req<Interest[]>('/api/interests'),

    // --- students ---
    listStudents: () => req<Student[]>('/api/students'),
    getStudent: (id: string) => req<StudentDetail>(`/api/students/${id}`),
    createStudent: (body: CreateStudentRequest) =>
      req<StudentDetail>('/api/students', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateStudent: (id: string, body: UpdateStudentRequest) =>
      req<StudentDetail>(`/api/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    addStudentCourse: (studentId: string, body: AddStudentCourseRequest) =>
      req<StudentCourse>(`/api/students/${studentId}/courses`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    removeStudentCourse: (studentId: string, courseId: string) =>
      req<{ removed: boolean }>(
        `/api/students/${studentId}/courses/${courseId}`,
        { method: 'DELETE' }
      ),
    addStudentSkill: (studentId: string, body: AddStudentSkillRequest) =>
      req<{ studentId: string; skillId: string }>(
        `/api/students/${studentId}/skills`,
        { method: 'POST', body: JSON.stringify(body) }
      ),
    removeStudentSkill: (studentId: string, skillId: string) =>
      req<{ removed: boolean }>(
        `/api/students/${studentId}/skills/${skillId}`,
        { method: 'DELETE' }
      ),
    addStudentInterest: (studentId: string, body: AddStudentInterestRequest) =>
      req<{ studentId: string; interestId: string }>(
        `/api/students/${studentId}/interests`,
        { method: 'POST', body: JSON.stringify(body) }
      ),
    removeStudentInterest: (studentId: string, interestId: string) =>
      req<{ removed: boolean }>(
        `/api/students/${studentId}/interests/${interestId}`,
        { method: 'DELETE' }
      ),

    // --- projects ---
    listProjects: (query?: {
      projectType?: ProjectType
      status?: ProjectStatus
      q?: string
    }) =>
      req<Project[]>(
        `/api/projects${toQueryString({
          projectType: query?.projectType,
          status: query?.status,
          q: query?.q,
        })}`
      ),
    getProject: (id: string) => req<ProjectDetail>(`/api/projects/${id}`),
    createProject: (body: CreateProjectRequest) =>
      req<ProjectDetail>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateProject: (id: string, body: UpdateProjectRequest) =>
      req<ProjectDetail>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    deleteProject: (id: string) =>
      req<void>(`/api/projects/${id}`, { method: 'DELETE' }),

    // --- project applicants / matches / selections ---
    listApplicants: async (projectId: string): Promise<ApplicantsResult> => {
      const { data, meta } = await reqEnvelope<
        ApplicantListItem[],
        { count: number; topN?: number }
      >(`/api/projects/${projectId}/applicants`)
      return { items: data, count: meta.count, topN: meta.topN }
    },
    listTopCandidates: async (
      projectId: string,
      limit?: number
    ): Promise<TopCandidatesResult> => {
      const { data, meta } = await reqEnvelope<
        TopMatchItem[],
        { count: number; projectId: string; limit: number }
      >(`/api/projects/${projectId}/top-candidates${toQueryString({ limit })}`)
      return { items: data, count: meta.count, projectId: meta.projectId, limit: meta.limit }
    },
    listProjectMatches: (projectId: string) =>
      req<Match[]>(`/api/projects/${projectId}/matches`),
    runProjectMatches: (projectId: string, body?: RunMatchesRequest) =>
      req<Match[]>(`/api/projects/${projectId}/matches`, {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      }),
    createSelection: (
      projectId: string,
      body: CreateSelectionDecisionRequest
    ) =>
      req<SelectionDecision>(`/api/projects/${projectId}/selections`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    listSelections: (projectId: string) =>
      req<SelectionDecision[]>(`/api/projects/${projectId}/selections`),

    // --- applications ---
    createApplication: (body: CreateApplicationRequest) =>
      req<Application>('/api/applications', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getApplication: (id: string) => req<Application>(`/api/applications/${id}`),
    listMyApplications: () =>
      req<ApplicationWithProject[]>('/api/applications/me'),
    withdrawApplication: (id: string) =>
      req<Application>(`/api/applications/${id}/withdraw`, {
        method: 'POST',
      }),
    updateApplicationStatus: (id: string, status: ApplicationStatus) =>
      req<Application>(`/api/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    shortlistApplication: (id: string) =>
      req<Application>(`/api/applications/${id}/shortlist`, {
        method: 'POST',
      }),
    unshortlistApplication: (id: string) =>
      req<Application>(`/api/applications/${id}/shortlist`, {
        method: 'DELETE',
      }),
    getApplicationDecision: (id: string) =>
      req<SelectionDecision>(`/api/applications/${id}/decision`),

    // --- matching ---
    /** Run matching for a single student (existing API: POST /api/matches/run/:studentId). */
    runMatches: (studentId: string, body?: RunMatchesRequest) =>
      req<Match[]>(`/api/matches/run/${studentId}`, {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      }),
    getMatchesForStudent: (studentId: string, limit?: number) =>
      req<Match[]>(`/api/matches/${studentId}${toQueryString({ limit })}`),
    /** Convenience alias of `getMatchesForStudent` for the signed-in student's own id. */
    getMyMatches: (studentId: string, limit?: number) =>
      req<Match[]>(`/api/matches/${studentId}${toQueryString({ limit })}`),

    // --- notifications ---
    listNotifications: async (opts?: {
      unread?: boolean
      limit?: number
    }): Promise<NotificationsResult> => {
      const { data, meta } = await reqEnvelope<
        Notification[],
        { count: number; unreadCount: number }
      >(
        `/api/notifications${toQueryString({
          unread: opts?.unread ? 'true' : undefined,
          limit: opts?.limit,
        })}`
      )
      return { items: data, count: meta.count, unreadCount: meta.unreadCount }
    },
    markNotificationRead: (id: string) =>
      req<Notification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    markAllNotificationsRead: () =>
      req<{ updated: number }>('/api/notifications/mark-all-read', {
        method: 'POST',
      }),

    // --- audit (teacher/admin) ---
    listAuditEvents: (limit?: number) =>
      req<AuditEvent[]>(`/api/audit${toQueryString({ limit })}`),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

/** Browser singleton — same-origin, cookie-based session. */
export const api: ApiClient = createApiClient()
