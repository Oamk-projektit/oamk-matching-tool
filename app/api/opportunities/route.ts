import { apiError } from '@/lib/api/response'

const MESSAGE =
  'Legacy /api/opportunities API is gone — use /api/projects instead'

/** @deprecated Replaced by `/api/projects`. Always returns 410 Gone. */
export async function GET() {
  return apiError('GONE', MESSAGE, 410)
}

/** @deprecated Replaced by `/api/projects`. Always returns 410 Gone. */
export async function POST() {
  return apiError('GONE', MESSAGE, 410)
}
