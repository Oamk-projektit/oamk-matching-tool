import { apiError } from '@/lib/api/response'

const MESSAGE =
  'Legacy /api/opportunities matches API is gone — use GET /api/projects/:id/matches'

/** @deprecated Replaced by `/api/projects/:id/matches`. Always returns 410 Gone. */
export async function GET() {
  return apiError('GONE', MESSAGE, 410)
}
