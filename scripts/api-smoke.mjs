/**
 * Basic health + auth smoke against the projects-model API.
 *
 *   npm run smoke
 * Requires: npm run dev, .env.local, seed applied
 */

import {
  api,
  assertOk,
  getBaseUrl,
  logOk,
  signInWithPassword,
} from './lib/smoke-helpers.mjs'

const email = process.env.SMOKE_EMAIL ?? 't3jato02@students.oamk.fi'
const password = process.env.SMOKE_PASSWORD ?? 'LocalDemoOnly!1'

async function main() {
  const baseUrl = getBaseUrl()
  console.log(`Smoke base: ${baseUrl}`)

  const health = await api(baseUrl, '/api/health')
  assertOk('GET /api/health', health, [200])
  if (health.json?.data?.status !== 'ok') {
    throw new Error('health status not ok')
  }
  logOk('GET /api/health')

  const token = await signInWithPassword(email, password)
  logOk(`auth as ${email}`)

  const me = await api(baseUrl, '/api/me', { token })
  assertOk('GET /api/me', me)
  logOk(
    'GET /api/me',
    `${me.json?.data?.profile?.role} studentId=${me.json?.data?.studentId ?? ''}`
  )

  const projects = await api(baseUrl, '/api/projects?status=published', {
    token,
  })
  assertOk('GET /api/projects', projects)
  logOk(
    'GET /api/projects',
    `count=${projects.json?.meta?.count ?? projects.json?.data?.length ?? '?'}`
  )

  console.log('Smoke passed. Run npm run smoke:flows for full paths.')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
