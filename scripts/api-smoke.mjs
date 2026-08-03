/**
 * ============================================================================
 * TOMMI — Basic health smoke (issue #140)
 * ============================================================================
 *
 * Usage (dev server running, .env.local present):
 *   npm run smoke
 *
 * For full paths use:
 *   npm run smoke:student
 *   npm run smoke:teacher
 *   npm run smoke:flows
 */

import {
  api,
  assertOk,
  getBaseUrl,
  logOk,
  signInWithPassword,
} from './lib/smoke-helpers.mjs'

const email = process.env.SMOKE_EMAIL ?? 'aino.virtanen@students.oamk.fi'
const password = process.env.SMOKE_PASSWORD ?? 'Passw0rd!'

async function main() {
  const baseUrl = getBaseUrl()
  console.log(`Smoke base: ${baseUrl}`)

  const health = await api(baseUrl, '/api/health')
  assertOk('GET /api/health', health, [200])
  if (health.json?.status !== 'ok') {
    throw new Error('health status not ok')
  }
  logOk('GET /api/health')

  const token = await signInWithPassword(email, password)
  logOk(`auth as ${email}`)

  const me = await api(baseUrl, '/api/me', { token })
  assertOk('GET /api/me', me)
  logOk('GET /api/me', `${me.json.role} ${me.json.student_id ?? ''}`)

  const opps = await api(baseUrl, '/api/opportunities', { token })
  assertOk('GET /api/opportunities', opps)
  logOk('GET /api/opportunities', `count=${opps.json?.meta?.count ?? '?'}`)

  console.log('Smoke passed. Run npm run smoke:flows for full paths.')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
