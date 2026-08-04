/**
 * Teacher oversight API journey (projects model):
 * login → list projects → applicants → top-candidates → matches → audit → notifications
 * Teachers do not create projects in MVP.
 *
 *   npm run smoke:teacher
 */

import {
  api,
  assertOk,
  getBaseUrl,
  logOk,
  signInWithPassword,
} from './lib/smoke-helpers.mjs'

const email = process.env.SMOKE_TEACHER_EMAIL ?? 'teacher.demo@oamk.fi'
const password = process.env.SMOKE_PASSWORD ?? 'LocalDemoOnly!1'
const campusPortalId = '90000000-0000-4000-8000-000000000001'

async function main() {
  const baseUrl = getBaseUrl()
  console.log(`Teacher flow @ ${baseUrl} as ${email}`)

  const health = await api(baseUrl, '/api/health')
  assertOk('GET /api/health', health, [200])
  logOk('health')

  const token = await signInWithPassword(email, password)
  logOk('sign-in')

  const me = await api(baseUrl, '/api/me', { token })
  assertOk('GET /api/me', me)
  const role = me.json?.data?.profile?.role
  if (role !== 'teacher' && role !== 'admin') {
    throw new Error(`Expected teacher role, got ${role}`)
  }
  logOk('me', `role=${role}`)

  const projects = await api(baseUrl, '/api/projects', { token })
  assertOk('GET /api/projects', projects)
  logOk('list projects', `count=${projects.json?.meta?.count}`)

  const applicants = await api(
    baseUrl,
    `/api/projects/${campusPortalId}/applicants`,
    { token }
  )
  assertOk('GET .../applicants', applicants)
  logOk('applicants', `count=${applicants.json?.meta?.count}`)

  const top = await api(
    baseUrl,
    `/api/projects/${campusPortalId}/top-candidates`,
    { token }
  )
  assertOk('GET .../top-candidates', top)
  logOk('top candidates', `count=${top.json?.meta?.count ?? top.json?.data?.length}`)

  const matches = await api(
    baseUrl,
    `/api/projects/${campusPortalId}/matches`,
    { token }
  )
  assertOk('GET .../matches', matches)
  logOk('project matches', `count=${matches.json?.meta?.count ?? matches.json?.data?.length}`)

  const selections = await api(
    baseUrl,
    `/api/projects/${campusPortalId}/selections`,
    { token }
  )
  assertOk('GET .../selections', selections)
  logOk('selections', `count=${selections.json?.meta?.count ?? selections.json?.data?.length}`)

  const audit = await api(baseUrl, '/api/audit?limit=20', { token })
  assertOk('GET /api/audit', audit)
  logOk('audit', `count=${audit.json?.meta?.count ?? audit.json?.data?.length}`)

  const notes = await api(baseUrl, '/api/notifications', { token })
  assertOk('GET /api/notifications', notes)
  logOk(
    'notifications',
    `unread=${notes.json?.meta?.unreadCount ?? 0}`
  )

  console.log('Teacher flow passed.')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
