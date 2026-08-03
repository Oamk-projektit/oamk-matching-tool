/**
 * ============================================================================
 * TOMMI — API smoke script (issues #140, #143)
 * ============================================================================
 *
 * Usage (dev server running, .env.local present):
 *   node --env-file=.env.local scripts/api-smoke.mjs
 *
 * Optional env:
 *   SMOKE_BASE_URL=http://localhost:3000
 *   SMOKE_EMAIL=aino.virtanen@students.oamk.fi
 *   SMOKE_PASSWORD=Passw0rd!
 */

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const email = process.env.SMOKE_EMAIL ?? 'aino.virtanen@students.oamk.fi'
const password = process.env.SMOKE_PASSWORD ?? 'Passw0rd!'

function fail(message) {
  console.error('FAIL:', message)
  process.exit(1)
}

async function getAccessToken() {
  if (!supabaseUrl || !anonKey) {
    fail('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const res = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }
  )

  const body = await res.json()
  if (!res.ok) {
    fail(`Auth failed (${res.status}): ${JSON.stringify(body)}`)
  }
  if (!body.access_token) {
    fail('No access_token in auth response (is seed applied?)')
  }
  return body.access_token
}

async function api(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { res, json }
}

async function main() {
  console.log(`Smoke base: ${baseUrl}`)

  const health = await api('/api/health')
  if (!health.res.ok || health.json?.status !== 'ok') {
    fail(`/api/health → ${health.res.status}`)
  }
  console.log('OK  GET /api/health')

  const token = await getAccessToken()
  console.log(`OK  auth as ${email}`)

  const me = await api('/api/me', { token })
  if (!me.res.ok) fail(`/api/me → ${me.res.status} ${JSON.stringify(me.json)}`)
  console.log('OK  GET /api/me', me.json.role, me.json.student_id ?? '(no student)')

  const opps = await api('/api/opportunities', { token })
  if (!opps.res.ok) {
    fail(`/api/opportunities → ${opps.res.status}`)
  }
  console.log('OK  GET /api/opportunities', `count=${opps.json?.meta?.count ?? '?'}`)

  if (me.json.student_id) {
    const run = await api(`/api/matches/run/${me.json.student_id}`, {
      token,
      method: 'POST',
      body: {},
    })
    if (!run.res.ok) {
      fail(`/api/matches/run → ${run.res.status} ${JSON.stringify(run.json)}`)
    }
    console.log(
      'OK  POST /api/matches/run',
      `count=${run.json?.meta?.count ?? '?'}`
    )
  } else {
    console.log('SKIP matching (no student profile for this user)')
  }

  const notes = await api('/api/notifications', { token })
  if (!notes.res.ok) {
    fail(`/api/notifications → ${notes.res.status}`)
  }
  console.log(
    'OK  GET /api/notifications',
    `unread=${notes.json?.meta?.unread_count ?? 0}`
  )

  console.log('Smoke passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
