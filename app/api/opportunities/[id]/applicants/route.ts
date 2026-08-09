import { apiError } from '@/lib/api/response'

const MESSAGE =
  'Legacy /api/opportunities applicants API is gone — use GET /api/projects/:id/applicants'

/** @deprecated Replaced by `/api/projects/:id/applicants`. Always returns 410 Gone. */
export async function GET() {
  return apiError('GONE', MESSAGE, 410)
}
