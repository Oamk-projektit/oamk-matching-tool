/**
 * ============================================================================
 * TOMMI — Run student + teacher API flows (#148 regression)
 * ============================================================================
 *   npm run smoke:flows
 */

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--env-file=.env.local', path.join(root, script)],
      { stdio: 'inherit', cwd: path.join(root, '..') }
    )
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} exited ${code}`))
    })
  })
}

async function main() {
  await run('flow-student.mjs')
  await run('flow-teacher.mjs')
  console.log('All API flows passed.')
}

main().catch((err) => {
  console.error('FAIL:', err.message || err)
  process.exit(1)
})
