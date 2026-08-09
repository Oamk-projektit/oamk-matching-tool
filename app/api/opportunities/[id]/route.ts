import { apiError } from '@/lib/api/response'

const MESSAGE =
  'Legacy /api/opportunities API is gone — use /api/projects/:id instead'

/** @deprecated Replaced by `/api/projects/:id`. Always returns 410 Gone. */
export async function GET() {
  return apiError('GONE', MESSAGE, 410)
}

/** @deprecated Replaced by `/api/projects/:id`. Always returns 410 Gone. */
export async function PUT() {
  return apiError('GONE', MESSAGE, 410)
}

/** @deprecated Replaced by `/api/projects/:id`. Always returns 410 Gone. */
export async function DELETE() {
  return apiError('GONE', MESSAGE, 410)
}
