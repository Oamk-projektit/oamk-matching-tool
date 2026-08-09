/**
 * Company selection API journey (projects model):
 * login → list own projects → applicants → top-candidates → shortlist → select → notifications
 * Also asserts cannot manage another company's project.
 *
 *   npm run smoke:company
 */

import {
  api,
  assertOk,
  getBaseUrl,
  logOk,
  signInWithPassword,
} from './lib/smoke-helpers.mjs'

const email =
  process.env.SMOKE_COMPANY_EMAIL ?? 'contact@nordicsoft.example'
const password = process.env.SMOKE_PASSWORD ?? 'LocalDemoOnly!1'
const ownProjectId = '90000000-0000-4000-8000-000000000001'
const otherCompanyProjectId = '90000000-0000-4000-8000-000000000004'

async function main() {
  const baseUrl = getBaseUrl()
  console.log(`Company flow @ ${baseUrl} as ${email}`)

  const health = await api(baseUrl, '/api/health')
  assertOk('GET /api/health', health, [200])
  logOk('health')

  const token = await signInWithPassword(email, password)
  logOk('sign-in')

  const me = await api(baseUrl, '/api/me', { token })
  assertOk('GET /api/me', me)
  const role = me.json?.data?.profile?.role
  const companyId = me.json?.data?.companyId
  if (role !== 'company' && role !== 'admin') {
    throw new Error(`Expected company role, got ${role}`)
  }
  logOk('me', `role=${role} companyId=${companyId}`)

  const projects = await api(baseUrl, '/api/projects', { token })
  assertOk('GET /api/projects', projects)
  logOk('list projects', `count=${projects.json?.meta?.count}`)

  const foreignEdit = await api(
    baseUrl,
    `/api/projects/${otherCompanyProjectId}`,
    {
      token,
      method: 'PUT',
      body: { title: 'Should not update' },
    }
  )
  if (![403, 404].includes(foreignEdit.status)) {
    throw new Error(
      `Company must not edit foreign project (got ${foreignEdit.status})`
    )
  }
  logOk('foreign project update blocked')

  const applicants = await api(
    baseUrl,
    `/api/projects/${ownProjectId}/applicants`,
    { token }
  )
  assertOk('GET .../applicants', applicants)
  logOk('applicants', `count=${applicants.json?.meta?.count}`)

  const top = await api(
    baseUrl,
    `/api/projects/${ownProjectId}/top-candidates`,
    { token }
  )
  assertOk('GET .../top-candidates', top)
  logOk('Top 3', `count=${top.json?.data?.length}`)

  const items = applicants.json?.data ?? []
  if (items.length === 0) {
    console.log('SKIP shortlist/selection (no applicants on campus portal)')
  } else {
    // Prefer an applicant that is not already selected/withdrawn to avoid
    // re-run flakes (409 CONFLICT on shortlist of selected apps).
    const pick =
      items.find((item) => {
        const status = item.application?.status
        return status !== 'selected' && status !== 'withdrawn'
      }) ?? items[0]
    const applicationId = pick.application?.id
    const studentId = pick.student?.id
    if (!applicationId || !studentId) {
      throw new Error('Applicant payload missing application/student id')
    }

    const shortlist = await api(
      baseUrl,
      `/api/applications/${applicationId}/shortlist`,
      { token, method: 'POST' }
    )
    // 409 = already selected / withdrawn (idempotent re-runs)
    assertOk('POST .../shortlist', shortlist, [200, 201, 409])
    logOk('shortlist', applicationId)

    const selection = await api(
      baseUrl,
      `/api/projects/${ownProjectId}/selections`,
      {
        token,
        method: 'POST',
        body: {
          studentId,
          applicationId,
          decision: 'selected',
          reason: 'Smoke: strong skill fit for campus portal.',
        },
      }
    )
    assertOk('POST .../selections', selection, [200, 201, 409])
    logOk('selection', selection.json?.data?.decision ?? selection.status)

    const decision = await api(
      baseUrl,
      `/api/applications/${applicationId}/decision`,
      { token }
    )
    assertOk('GET .../decision', decision)
    logOk('decision read', decision.json?.data?.decision)
  }

  const notes = await api(baseUrl, '/api/notifications', { token })
  assertOk('GET /api/notifications', notes)
  logOk('notifications', `unread=${notes.json?.meta?.unreadCount ?? 0}`)

  console.log('Company flow passed.')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
