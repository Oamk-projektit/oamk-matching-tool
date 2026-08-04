import { handleRouteError, requireAuth } from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { listSkills } from '@/lib/courses/service'

export async function GET() {
  try {
    const ctx = await requireAuth()
    const data = await listSkills(ctx.supabase)
    return jsonData(data, { count: data.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
