/**
 * Student API journey (projects model):
 * login → me → projects → matching → apply → my applications → notifications
 * Also asserts Top 3 is forbidden for students.
 *
 *   npm run smoke:student
 */

import {
  api,
  assertOk,
  getBaseUrl,
  logOk,
  signInWithPassword,
} from './lib/smoke-helpers.mjs'

const email =
  process.env.SMOKE_STUDENT_EMAIL ?? 'aino.virtanen@students.oamk.fi'
const password = process.env.SMOKE_PASSWORD ?? 'LocalDemoOnly!1'
const campusPortalId = '90000000-0000-4000-8000-000000000001'

async function main() {
  const baseUrl = getBaseUrl()
  console.log(`Student flow @ ${baseUrl} as ${email}`)

  const health = await api(baseUrl, '/api/health')
  assertOk('GET /api/health', health, [200])
  logOk('health')

  const token = await signInWithPassword(email, password)
  logOk('sign-in')

  const me = await api(baseUrl, '/api/me', { token })
  assertOk('GET /api/me', me)
  const role = me.json?.data?.profile?.role
  if (role !== 'student' && role !== 'admin') {
    throw new Error(`Expected student role, got ${role}`)
  }
  let studentId = me.json?.data?.studentId
  logOk('me', `role=${role} studentId=${studentId}`)

  if (!studentId) {
    const created = await api(baseUrl, '/api/students', {
      token,
      method: 'POST',
      body: {
        degreeProgramme: 'Tietotekniikka',
        department: 'ICT',
        studyCredits: 100,
        preferredProjectTypes: ['company_project'],
      },
    })
    assertOk('POST /api/students', created, [201, 409])
    const again = await api(baseUrl, '/api/me', { token })
    assertOk('GET /api/me (retry)', again)
    studentId = again.json?.data?.studentId
    if (!studentId) throw new Error('No studentId after create')
  }

  const projects = await api(baseUrl, '/api/projects?status=published', {
    token,
  })
  assertOk('GET /api/projects', projects)
  if (!projects.json?.data?.length) {
    throw new Error('No published projects — run supabase db reset / seed')
  }
  logOk('list projects', `count=${projects.json.meta?.count}`)

  const topForbidden = await api(
    baseUrl,
    `/api/projects/${campusPortalId}/top-candidates`,
    { token }
  )
  if (topForbidden.status !== 403) {
    throw new Error(
      `Student must not see Top 3 (expected 403, got ${topForbidden.status})`
    )
  }
  logOk('Top 3 forbidden for student')

  const run = await api(baseUrl, `/api/matches/run`, {
    token,
    method: 'POST',
    body: { locale: 'fi' },
  })
  assertOk('POST /api/matches/run', run)
  logOk('run matching', `count=${run.json?.meta?.count ?? run.json?.data?.length}`)

  const matches = await api(baseUrl, `/api/matches/me?limit=3`, {
    token,
  })
  assertOk('GET /api/matches/me', matches)
  if (!matches.json?.data?.length) {
    throw new Error('Expected match results')
  }
  const first = matches.json.data[0]
  if (first && ('rank' in first || 'peerRank' in first)) {
    throw new Error('Student match payload must not include rank')
  }
  logOk(
    'own matches',
    matches.json.data.map((m) => m.totalScore ?? m.score).join(',')
  )

  const apply = await api(baseUrl, '/api/applications', {
    token,
    method: 'POST',
    body: {
      projectId: campusPortalId,
      message: 'Smoke test application',
    },
  })
  assertOk('POST /api/applications', apply, [201, 409])
  logOk('apply')

  const mine = await api(baseUrl, '/api/applications/me', { token })
  assertOk('GET /api/applications/me', mine)
  logOk('my applications', `count=${mine.json?.meta?.count ?? mine.json?.data?.length}`)

  const notes = await api(baseUrl, '/api/notifications', { token })
  assertOk('GET /api/notifications', notes)
  logOk(
    'notifications',
    `unread=${notes.json?.meta?.unreadCount ?? notes.json?.meta?.unread_count ?? 0}`
  )

  console.log('Student flow passed.')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
