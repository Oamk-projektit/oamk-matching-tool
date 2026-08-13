/**
 * Live security / authorization probes across roles.
 * Uses demo seed accounts. Does not print tokens or secrets.
 *
 *   node --env-file=.env.local scripts/security-probe.mjs
 */

import {
  api,
  getBaseUrl,
  requireEnv,
  signInWithPassword,
} from './lib/smoke-helpers.mjs'

const password = process.env.SMOKE_PASSWORD ?? 'LocalDemoOnly!1'
const campusPortalId = '90000000-0000-4000-8000-000000000001'
const polarByteProjectId = '90000000-0000-4000-8000-000000000004'
const otherStudentId = '10000000-0000-4000-8000-000000000002' // mikko (seed)

const results = []

function record(id, status, detail = '') {
  results.push({ id, status, detail })
  const mark = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'INFO'
  console.log(`${mark}  ${id}${detail ? ` — ${detail}` : ''}`)
}

async function signIn(email) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await signInWithPassword(email, password)
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise((r) => setTimeout(r, 1500 * attempt))
    }
  }
}

async function probeSignupEscalation() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const email = `sec-probe-admin-${Date.now()}@example.com`
  const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: 'ProbeEscalation!1',
      data: { role: 'admin', display_name: 'Probe Admin' },
    }),
  })
  const body = await res.json()
  if (!res.ok) {
    record(
      'signup-metadata-admin',
      'INFO',
      `signup blocked/failed HTTP ${res.status}: ${body?.msg || body?.error_code || 'unknown'}`
    )
    return
  }
  const token = body.access_token
  if (!token) {
    record(
      'signup-metadata-admin',
      'INFO',
      'signup created user but no session (email confirm?) — cannot verify role via API'
    )
    return
  }
  const baseUrl = getBaseUrl()
  const me = await api(baseUrl, '/api/me', { token })
  const role = me.json?.data?.profile?.role
  if (role === 'admin' || role === 'teacher') {
    record(
      'signup-metadata-admin',
      'FAIL',
      `privilege escalation: new user got role=${role} from signup metadata`
    )
  } else {
    record(
      'signup-metadata-admin',
      'PASS',
      `role clamped/defaulted to ${role}`
    )
  }
}

async function probeRoleSelfUpdate(studentToken) {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // Resolve own profile id via /api/me
  const baseUrl = getBaseUrl()
  const me = await api(baseUrl, '/api/me', { token: studentToken })
  const profileId = me.json?.data?.profile?.id
  if (!profileId) {
    record('profiles-role-self-update', 'INFO', 'no profile id')
    return
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${profileId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ role: 'admin' }),
    }
  )
  const text = await res.text()
  let rows = []
  try {
    rows = text ? JSON.parse(text) : []
  } catch {
    rows = []
  }
  const elevated =
    res.ok && Array.isArray(rows) && rows.some((r) => r.role === 'admin')
  if (elevated) {
    record(
      'profiles-role-self-update',
      'FAIL',
      'RLS allowed student to PATCH profiles.role → admin'
    )
    // Best-effort restore
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${profileId}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'student' }),
    })
  } else {
    record(
      'profiles-role-self-update',
      'PASS',
      `update rejected or role unchanged (HTTP ${res.status})`
    )
  }
}

async function main() {
  const baseUrl = getBaseUrl()
  console.log(`Security probes @ ${baseUrl}`)

  const health = await api(baseUrl, '/api/health')
  if (health.status !== 200) {
    throw new Error(`Health not OK: ${health.status}`)
  }
  record('health', 'PASS', 'database connected')

  // --- Student journey negatives ---
  const studentToken = await signIn(
    process.env.SMOKE_STUDENT_EMAIL ?? 't3jato02@students.oamk.fi'
  )
  record('student-signin', 'PASS')

  const me = await api(baseUrl, '/api/me', { token: studentToken })
  const studentRole = me.json?.data?.profile?.role
  record('student-me', studentRole === 'student' ? 'PASS' : 'FAIL', `role=${studentRole}`)

  const top = await api(baseUrl, `/api/projects/${campusPortalId}/top-candidates`, {
    token: studentToken,
  })
  record(
    'student-top3-forbidden',
    top.status === 403 ? 'PASS' : 'FAIL',
    `HTTP ${top.status}`
  )

  const audit = await api(baseUrl, '/api/audit', { token: studentToken })
  record(
    'student-audit-forbidden',
    audit.status === 403 ? 'PASS' : 'FAIL',
    `HTTP ${audit.status}`
  )

  const peerMatches = await api(baseUrl, `/api/matches/${otherStudentId}`, {
    token: studentToken,
  })
  record(
    'student-peer-matches-forbidden',
    [403, 404].includes(peerMatches.status) ? 'PASS' : 'FAIL',
    `HTTP ${peerMatches.status}`
  )

  const peerRun = await api(baseUrl, `/api/matches/run/${otherStudentId}`, {
    token: studentToken,
    method: 'POST',
    body: {},
  })
  record(
    'student-peer-match-run-forbidden',
    [403, 404].includes(peerRun.status) ? 'PASS' : 'FAIL',
    `HTTP ${peerRun.status}`
  )

  await probeRoleSelfUpdate(studentToken)

  // --- Company isolation ---
  const companyToken = await signIn('contact@nordicsoft.example')
  record('company-signin', 'PASS')

  const foreignPut = await api(baseUrl, `/api/projects/${polarByteProjectId}`, {
    token: companyToken,
    method: 'PUT',
    body: { title: 'Should not update' },
  })
  record(
    'company-foreign-project-write',
    [403, 404].includes(foreignPut.status) ? 'PASS' : 'FAIL',
    `HTTP ${foreignPut.status}`
  )

  const foreignApplicants = await api(
    baseUrl,
    `/api/projects/${polarByteProjectId}/applicants`,
    { token: companyToken }
  )
  record(
    'company-foreign-applicants',
    [403, 404].includes(foreignApplicants.status) ? 'PASS' : 'FAIL',
    `HTTP ${foreignApplicants.status}`
  )

  const foreignTop = await api(
    baseUrl,
    `/api/projects/${polarByteProjectId}/top-candidates`,
    { token: companyToken }
  )
  record(
    'company-foreign-top3',
    [403, 404].includes(foreignTop.status) ? 'PASS' : 'FAIL',
    `HTTP ${foreignTop.status}`
  )

  const companyAudit = await api(baseUrl, '/api/audit', { token: companyToken })
  record(
    'company-audit-forbidden',
    companyAudit.status === 403 ? 'PASS' : 'FAIL',
    `HTTP ${companyAudit.status}`
  )

  // --- Teacher allowed / cannot create ---
  const teacherToken = await signIn('teacher.demo@oamk.fi')
  record('teacher-signin', 'PASS')

  const teacherAudit = await api(baseUrl, '/api/audit?limit=5', {
    token: teacherToken,
  })
  record(
    'teacher-audit-allowed',
    teacherAudit.status === 200 ? 'PASS' : 'FAIL',
    `HTTP ${teacherAudit.status}`
  )

  const teacherCreate = await api(baseUrl, '/api/projects', {
    token: teacherToken,
    method: 'POST',
    body: {
      title: 'Teacher should not create',
      description: 'probe',
      projectType: 'company_project',
      status: 'draft',
    },
  })
  record(
    'teacher-cannot-create-project',
    [403, 400].includes(teacherCreate.status) ? 'PASS' : 'FAIL',
    `HTTP ${teacherCreate.status}`
  )

  // --- Admin ---
  const adminToken = await signIn('admin.demo@oamk.fi')
  record('admin-signin', 'PASS')
  const adminMe = await api(baseUrl, '/api/me', { token: adminToken })
  record(
    'admin-me',
    adminMe.json?.data?.profile?.role === 'admin' ? 'PASS' : 'FAIL',
    `role=${adminMe.json?.data?.profile?.role}`
  )
  const adminAudit = await api(baseUrl, '/api/audit?limit=5', {
    token: adminToken,
  })
  record(
    'admin-audit-allowed',
    adminAudit.status === 200 ? 'PASS' : 'FAIL',
    `HTTP ${adminAudit.status}`
  )

  // --- Signup escalation (destructive: creates disposable user) ---
  await probeSignupEscalation()

  // --- Unauthenticated ---
  const unauth = await api(baseUrl, '/api/me')
  record(
    'unauth-api-401',
    unauth.status === 401 ? 'PASS' : 'FAIL',
    `HTTP ${unauth.status}`
  )

  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const info = results.filter((r) => r.status === 'INFO').length
  console.log(`\nSummary: ${passed} PASS, ${failed} FAIL, ${info} INFO`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
