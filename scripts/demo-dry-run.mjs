/**
 * Demo dry-run (#153 / #129): unit tests + API role flows + security probes.
 * Maps to docs/DEMO_CHECKLIST.md "Automated coverage" — not a browser E2E.
 *
 *   npm run demo:dry-run
 *
 * Prerequisites: local Supabase up, `.env.local` present, `npm run dev` on SMOKE_BASE_URL.
 * If nested `/api/projects/:id/*` routes return HTML 404, clear `.next` and restart Next.
 */

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function run(label, command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== ${label} ===`)
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: root,
      shell: true,
      env: process.env,
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${label} exited ${code}`))
    })
  })
}

async function main() {
  const started = new Date().toISOString()
  console.log(`Demo dry-run started ${started}`)
  console.log('Checklist mapping: student≈1–10,17 | company≈11–15 | teacher≈16,18 | security≈13,19')

  await run('npm test', 'npm', ['test'])
  await run('smoke:flows', 'npm', ['run', 'smoke:flows'])
  await run('smoke:security', 'npm', ['run', 'smoke:security'])

  console.log('\n=== DEMO DRY-RUN PASSED ===')
  console.log(`Finished ${new Date().toISOString()}`)
  console.log('Still manual before live talk: browser walkthrough (#120/#121) + spoken talking points.')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
