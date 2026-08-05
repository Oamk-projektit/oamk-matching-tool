/**
 * One-shot production env sync for Vercel from the linked Supabase project.
 * Does not print secret values. Does not run seed.
 *
 * Usage:
 *   node scripts/sync-vercel-env.mjs
 *
 * Requires: logged-in `vercel` CLI, linked supabase project ref in
 * supabase/.temp/project-ref (or SUPABASE_PROJECT_REF).
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: true,
    ...opts,
  })
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || '').trim()
    throw new Error(`${cmd} ${args.join(' ')} failed: ${err}`)
  }
  return r.stdout
}

function parseEnvOutput(text) {
  const map = Object.create(null)
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    map[m[1]] = m[2].replace(/^"|"$/g, '')
  }
  return map
}

function getProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF?.trim()) {
    return process.env.SUPABASE_PROJECT_REF.trim()
  }
  const p = resolve('supabase/.temp/project-ref')
  if (!existsSync(p)) {
    throw new Error('Missing supabase/.temp/project-ref — run supabase link first')
  }
  return readFileSync(p, 'utf8').trim()
}

function upsertVercelEnv(name, value, targets = ['production', 'preview', 'development']) {
  for (const target of targets) {
    // Remove existing to allow overwrite (ignore failure if missing).
    spawnSync('npx', ['vercel', 'env', 'rm', name, target, '-y'], {
      encoding: 'utf8',
      shell: true,
    })
    const add = spawnSync(
      'npx',
      ['vercel', 'env', 'add', name, target],
      {
        encoding: 'utf8',
        shell: true,
        input: `${value}\n`,
      }
    )
    if (add.status !== 0) {
      throw new Error(
        `Failed to set ${name} (${target}): ${(add.stderr || add.stdout || '').trim()}`
      )
    }
    console.log(`OK  ${name} → ${target}`)
  }
}

const ref = getProjectRef()
const url = `https://${ref}.supabase.co`
const keys = parseEnvOutput(
  run('npx', ['supabase', 'projects', 'api-keys', '--project-ref', ref, '-o', 'env'])
)

const anon = keys.SUPABASE_ANON_KEY || keys.SUPABASE_PUBLISHABLE_KEY
const service = keys.SUPABASE_SERVICE_ROLE_KEY
if (!anon || !service) {
  throw new Error('Could not resolve anon/service role keys from Supabase')
}

console.log(`Project ref: ${ref}`)
console.log(`URL host: ${new URL(url).host}`)
console.log(`ANON_LEN=${anon.length} SERVICE_LEN=${service.length}`)

upsertVercelEnv('NEXT_PUBLIC_SUPABASE_URL', url)
upsertVercelEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', anon)
upsertVercelEnv('SUPABASE_SERVICE_ROLE_KEY', service)

const appUrl = process.env.APP_URL?.trim()
if (appUrl) {
  upsertVercelEnv('APP_URL', appUrl)
  console.log(`APP_URL set to ${appUrl}`)
} else {
  console.log('APP_URL skipped — set after first deploy (production domain known)')
}

console.log('Done. Redeploy so the new env vars take effect.')
