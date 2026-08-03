/**
 * ============================================================================
 * TOMMI / SHARED testing — Student API usage path (#144 backend)
 * ============================================================================
 * Verifies the student journey against live API (no UI):
 * login → me → opportunities → matching → apply → my applications → notifications
 *
 *   npm run smoke:student
 * Requires: npm run dev, .env.local, seed data
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
const password = process.env.SMOKE_PASSWORD ?? 'Passw0rd!'
const campusPortalId = 'c0000000-0000-4000-8000-000000000001'

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
  if (me.json.role !== 'student' && me.json.role !== 'admin') {
    throw new Error(`Expected student role, got ${me.json.role}`)
  }
  logOk('me', `role=${me.json.role} student_id=${me.json.student_id}`)

  let studentId = me.json.student_id
  if (!studentId) {
    const created = await api(baseUrl, '/api/students', {
      token,
      method: 'POST',
      body: {
        name: 'Smoke Student',
        email,
        degree_program: 'Tietotekniikka',
        credits: 100,
        language: 'FI',
        skills: ['React'],
        completed_courses: ['Web-ohjelmointi'],
      },
    })
    assertOk('POST /api/students', created, [201, 409])
    const again = await api(baseUrl, '/api/me', { token })
    assertOk('GET /api/me (retry)', again)
    studentId = again.json.student_id
    if (!studentId) throw new Error('No student_id after create')
  }

  const opps = await api(baseUrl, '/api/opportunities', { token })
  assertOk('GET /api/opportunities', opps)
  if (!opps.json?.data?.length) {
    throw new Error('No opportunities — run seed.sql')
  }
  logOk('list opportunities', `count=${opps.json.meta.count}`)

  const run = await api(baseUrl, `/api/matches/run/${studentId}`, {
    token,
    method: 'POST',
    body: {},
  })
  assertOk('POST /api/matches/run/:id', run)
  logOk('run matching', `count=${run.json.meta.count}`)

  const matches = await api(
    baseUrl,
    `/api/matches/${studentId}?limit=3`,
    { token }
  )
  assertOk('GET /api/matches/:id', matches)
  if (!matches.json?.data?.length) {
    throw new Error('Expected match results')
  }
  logOk(
    'top matches',
    matches.json.data.map((m) => m.score).join(',')
  )

  const apply = await api(baseUrl, '/api/applications', {
    token,
    method: 'POST',
    body: {
      opportunity_id: campusPortalId,
      message: 'Smoke test application',
    },
  })
  // Seed may already contain this pair
  assertOk('POST /api/applications', apply, [201, 409])
  logOk('apply', `status=${apply.status}`)

  const mine = await api(baseUrl, '/api/applications/me', { token })
  assertOk('GET /api/applications/me', mine)
  logOk('my applications', `count=${mine.json.meta.count}`)

  const notes = await api(baseUrl, '/api/notifications', { token })
  assertOk('GET /api/notifications', notes)
  logOk('notifications', `unread=${notes.json.meta.unread_count}`)

  console.log('Student API flow passed (#144 backend).')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
