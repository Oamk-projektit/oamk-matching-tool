import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const password = process.env.TEST_SEED_PASSWORD
const enabled = Boolean(url && key && password && process.env.TEST_SEED_ALLOW === 'true')

const projectAi = '74000000-0000-4000-8000-000000000001'
const projectMobile = '74000000-0000-4000-8000-000000000004'
const student1 = '73000000-0000-4000-8000-000000000001'
const student2 = '73000000-0000-4000-8000-000000000002'

async function clientFor(email: string) {
  if (!url || !key || !password) throw new Error('Integration test environment is incomplete')
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

describe.skipIf(!enabled)('Supabase integration and RLS', () => {
  it('keeps canonical roles and test profiles idempotent', async () => {
    const client = await clientFor('student1@oamk-matching.test')
    const { data, error } = await client.from('profiles').select('role, email').eq('email', 'student1@oamk-matching.test').single()
    expect(error).toBeNull()
    expect(data).toMatchObject({ role: 'student', email: 'student1@oamk-matching.test' })
  })

  it('allows a student to see own matches but not peer match rows', async () => {
    const client = await clientFor('student1@oamk-matching.test')
    const own = await client.from('matches').select('student_id, total_score, explanation').eq('project_id', projectAi)
    expect(own.error).toBeNull()
    expect(own.data).toEqual(expect.arrayContaining([expect.objectContaining({ student_id: student1, total_score: 96 })]))
    expect(own.data).not.toEqual(expect.arrayContaining([expect.objectContaining({ student_id: student2 })]))
  })

  it('isolates company matches from another company', async () => {
    const client = await clientFor('company1@oamk-matching.test')
    const own = await client.from('matches').select('project_id').eq('project_id', projectAi)
    const other = await client.from('matches').select('project_id').eq('project_id', projectMobile)
    expect(own.error).toBeNull()
    expect(own.data).toHaveLength(3)
    expect(other.error).toBeNull()
    expect(other.data).toHaveLength(0)
  })
})

if (!enabled) {
  console.warn('Supabase integration tests skipped: configure TEST_SEED_ALLOW, TEST_SEED_PASSWORD and Supabase env.')
}
