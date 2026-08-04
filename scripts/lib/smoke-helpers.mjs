/**
 * ============================================================================
 * TOMMI — Shared helpers for API flow smokes (#144 / #145 / #148)
 * ============================================================================
 * No UI. Used by scripts under scripts/*.mjs
 */

export function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env ${name}`)
  }
  return value
}

export function getBaseUrl() {
  return process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
}

export async function signInWithPassword(email, password) {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const res = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }
  )
  const body = await res.json()
  if (!res.ok) {
    throw new Error(`Auth failed for ${email}: ${res.status} ${JSON.stringify(body)}`)
  }
  if (!body.access_token) {
    throw new Error(`No access_token for ${email} (is seed applied?)`)
  }
  return body.access_token
}

export async function api(baseUrl, path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { status: res.status, ok: res.ok, json }
}

export function assertOk(step, result, allowed = [200, 201]) {
  if (!allowed.includes(result.status)) {
    throw new Error(
      `${step} failed: HTTP ${result.status} ${JSON.stringify(result.json)}`
    )
  }
}

export function logOk(step, extra = '') {
  console.log(`OK  ${step}${extra ? ` ${extra}` : ''}`)
}
