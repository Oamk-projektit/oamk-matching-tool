/**
 * ============================================================================
 * TOMMI / SHARED testing — Teacher API usage path (#145 backend)
 * ============================================================================
 * Verifies teacher journey against live API (no UI):
 * login → opportunities → applicants → matches → status update → notifications
 *
 *   npm run smoke:teacher
 * Requires: npm run dev, .env.local, seed data
 */

import {
  api,
  assertOk,
  getBaseUrl,
  logOk,
  signInWithPassword,
} from './lib/smoke-helpers.mjs'

const email = process.env.SMOKE_TEACHER_EMAIL ?? 'teacher.demo@oamk.fi'
const password = process.env.SMOKE_PASSWORD ?? 'Passw0rd!'
const campusPortalId = 'c0000000-0000-4000-8000-000000000001'

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
  if (me.json.role !== 'teacher' && me.json.role !== 'admin') {
    throw new Error(`Expected teacher role, got ${me.json.role}`)
  }
  logOk('me', `role=${me.json.role}`)

  const opps = await api(baseUrl, '/api/opportunities?type=project', {
    token,
  })
  assertOk('GET /api/opportunities', opps)
  logOk('list opportunities', `count=${opps.json.meta.count}`)

  const created = await api(baseUrl, '/api/opportunities', {
    token,
    method: 'POST',
    body: {
      name: `Smoke project ${Date.now()}`,
      description: 'Created by teacher flow smoke',
      type: 'project',
      required_skills: ['React'],
      required_courses: ['Web-ohjelmointi'],
      minimum_credits: 40,
      required_language: 'FI',
      student_slots: 1,
    },
  })
  assertOk('POST /api/opportunities', created, [201])
  const newId = created.json.id
  logOk('create opportunity', newId)

  const applicants = await api(
    baseUrl,
    `/api/opportunities/${campusPortalId}/applicants`,
    { token }
  )
  assertOk('GET .../applicants', applicants)
  logOk('applicants', `count=${applicants.json.meta.count}`)

  const matches = await api(
    baseUrl,
    `/api/opportunities/${campusPortalId}/matches`,
    { token }
  )
  assertOk('GET .../matches', matches)
  logOk('opportunity matches', `count=${matches.json.meta.count}`)

  if (applicants.json.data?.length) {
    const applicationId = applicants.json.data[0].application.id
    const patched = await api(baseUrl, `/api/applications/${applicationId}`, {
      token,
      method: 'PATCH',
      body: { status: 'accepted' },
    })
    assertOk('PATCH /api/applications/:id', patched)
    logOk('accept applicant', applicationId)
  } else {
    console.log('SKIP status update (no applicants on campus portal)')
  }

  const notes = await api(baseUrl, '/api/notifications', { token })
  assertOk('GET /api/notifications', notes)
  logOk('notifications', `unread=${notes.json.meta.unread_count}`)

  const deleted = await api(baseUrl, `/api/opportunities/${newId}`, {
    token,
    method: 'DELETE',
  })
  assertOk('DELETE /api/opportunities/:id', deleted, [204])
  logOk('cleanup opportunity')

  console.log('Teacher API flow passed (#145 backend).')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
