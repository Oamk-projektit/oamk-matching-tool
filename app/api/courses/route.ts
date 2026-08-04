import { handleRouteError, requireAuth } from '@/lib/api/auth'
import { jsonData } from '@/lib/api/response'
import { listCourses } from '@/lib/courses/service'

export async function GET(request: Request) {
  try {
    const ctx = await requireAuth()
    const url = new URL(request.url)
    const search = url.searchParams.get('search') ?? undefined
    const data = await listCourses(ctx.supabase, { search })
    return jsonData(data, { count: data.length })
  } catch (error) {
    return handleRouteError(error)
  }
}
