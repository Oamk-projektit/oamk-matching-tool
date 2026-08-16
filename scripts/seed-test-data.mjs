import { createClient } from '@supabase/supabase-js'

const TEST_MARKER = 'oamk-matching-test-data-v1'
const RESET = process.argv.includes('--reset')
const allowed = process.env.TEST_SEED_ALLOW === 'true'
const confirmation = process.env.TEST_SEED_CONFIRM === TEST_MARKER
const nodeEnv = process.env.NODE_ENV ?? 'development'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!allowed || !confirmation || nodeEnv === 'production') {
  throw new Error(
    'Refusing test seed: set TEST_SEED_ALLOW=true and TEST_SEED_CONFIRM=oamk-matching-test-data-v1 outside production.'
  )
}
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}
if (!supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
  throw new Error('Refusing test seed unless Supabase URL points to localhost')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const password = process.env.TEST_SEED_PASSWORD
if (!password || password.length < 12) {
  throw new Error('Set TEST_SEED_PASSWORD to a generated or secret value (at least 12 characters)')
}

const ids = {
  users: {
    student1: '71000000-0000-4000-8000-000000000001',
    student2: '71000000-0000-4000-8000-000000000002',
    student3: '71000000-0000-4000-8000-000000000003',
    teacher1: '71000000-0000-4000-8000-000000000011',
    teacher2: '71000000-0000-4000-8000-000000000012',
    company1: '71000000-0000-4000-8000-000000000021',
    company2: '71000000-0000-4000-8000-000000000022',
  },
  companies: { company1: '72000000-0000-4000-8000-000000000001', company2: '72000000-0000-4000-8000-000000000002' },
  students: { student1: '73000000-0000-4000-8000-000000000001', student2: '73000000-0000-4000-8000-000000000002', student3: '73000000-0000-4000-8000-000000000003' },
  projects: {
    ai: '74000000-0000-4000-8000-000000000001',
    frontend: '74000000-0000-4000-8000-000000000002',
    backend: '74000000-0000-4000-8000-000000000003',
    mobile: '74000000-0000-4000-8000-000000000004',
    analytics: '74000000-0000-4000-8000-000000000005',
  },
}

const users = [
  ['student1', 'student1@oamk-matching.test', 'student', 'Test Student 1'],
  ['student2', 'student2@oamk-matching.test', 'student', 'Test Student 2'],
  ['student3', 'student3@oamk-matching.test', 'student', 'Test Student 3'],
  ['teacher1', 'teacher1@oamk-matching.test', 'teacher', 'Test Teacher 1'],
  ['teacher2', 'teacher2@oamk-matching.test', 'teacher', 'Test Teacher 2'],
  ['company1', 'company1@oamk-matching.test', 'company', 'Test Company 1'],
  ['company2', 'company2@oamk-matching.test', 'company', 'Test Company 2'],
]

async function checked(promise, label) {
  const { data, error } = await promise
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

async function ensureUser(key, email, role, displayName) {
  const listed = await checked(admin.auth.admin.listUsers({ perPage: 1000 }), 'list auth users')
  const existing = listed.users.find((user) => user.email === email)
  let user = existing
  if (!user) {
    const created = await checked(
      admin.auth.admin.createUser({
        id: ids.users[key],
        email,
        password,
        email_confirm: true,
        user_metadata: { role, display_name: displayName, preferred_language: 'en' },
      }),
      `create ${email}`
    )
    user = created.user
  } else {
    user = (await checked(admin.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { role, display_name: displayName, preferred_language: 'en' } }), `update ${email}`)).user
  }
  await checked(admin.from('profiles').upsert({ id: user.id, role, display_name: displayName, email, preferred_language: 'en' }), `profile ${email}`)
  return user.id
}

async function upsertRows(table, rows, onConflict = 'id') {
  if (rows.length) await checked(admin.from(table).upsert(rows, { onConflict }), `upsert ${table}`)
}

async function resetRows() {
  const projectIds = Object.values(ids.projects)
  const companyIds = Object.values(ids.companies)
  const studentIds = Object.values(ids.students)
  for (const [table, column, values] of [
    ['matches', 'project_id', projectIds],
    ['applications', 'project_id', projectIds],
    ['project_weights', 'project_id', projectIds],
    ['project_interests', 'project_id', projectIds],
    ['project_recommended_skills', 'project_id', projectIds],
    ['project_required_skills', 'project_id', projectIds],
    ['project_recommended_courses', 'project_id', projectIds],
    ['project_required_courses', 'project_id', projectIds],
    ['projects', 'id', projectIds],
    ['company_users', 'company_id', companyIds],
    ['companies', 'id', companyIds],
    ['student_interests', 'student_id', studentIds],
    ['student_skills', 'student_id', studentIds],
    ['student_courses', 'student_id', studentIds],
    ['students', 'id', studentIds],
  ]) {
    await checked(admin.from(table).delete().in(column, values), `reset ${table}`)
  }
}

async function main() {
  if (RESET) await resetRows()

  const userIds = {}
  for (const user of users) userIds[user[0]] = await ensureUser(...user)

  await upsertRows('companies', [
    { id: ids.companies.company1, name: 'Test Company 1', business_id: 'TEST-001', description: TEST_MARKER, website: 'https://company1.oamk-matching.test' },
    { id: ids.companies.company2, name: 'Test Company 2', business_id: 'TEST-002', description: TEST_MARKER, website: 'https://company2.oamk-matching.test' },
  ])
  await upsertRows('company_users', [
    { company_id: ids.companies.company1, profile_id: userIds.company1, company_role: 'owner' },
    { company_id: ids.companies.company2, profile_id: userIds.company2, company_role: 'owner' },
  ], 'company_id,profile_id')

  const courseRows = [
    ['TTTEST01', 'AI and Machine Learning'], ['TTTEST02', 'Frontend Development'], ['TTTEST03', 'Backend APIs'], ['TTTEST04', 'Mobile Development'], ['TTTEST05', 'Data Analytics'],
  ].map(([code, name], index) => ({ id: `75000000-0000-4000-8000-00000000000${index + 1}`, code, name_fi: name, name_en: name, credits: 5, department: 'ICT', active: true }))
  const skillRows = ['Python', 'Machine Learning', 'React', 'TypeScript', 'PostgreSQL', 'REST APIs', 'React Native', 'Data Analytics'].map((name, index) => ({ id: `76000000-0000-4000-8000-00000000000${index + 1}`, name_fi: name, name_en: name, normalized_name: `test-${name.toLowerCase().replaceAll(' ', '-')}` }))
  const interestRows = ['AI', 'Frontend', 'Backend', 'Mobile', 'Analytics'].map((name, index) => ({ id: `77000000-0000-4000-8000-00000000000${index + 1}`, name_fi: name, name_en: name, normalized_name: `test-${name.toLowerCase()}` }))
  await upsertRows('courses', courseRows)
  await upsertRows('skills', skillRows)
  await upsertRows('interests', interestRows)

  await upsertRows('students', [
    { id: ids.students.student1, profile_id: userIds.student1, degree_programme: 'Software Engineering', department: 'ICT', study_credits: 180, availability_start: '2026-09-01', availability_end: '2027-01-31', preferred_project_types: ['company_project'] },
    { id: ids.students.student2, profile_id: userIds.student2, degree_programme: 'Software Engineering', department: 'ICT', study_credits: 100, availability_start: '2026-10-01', availability_end: '2026-12-15', preferred_project_types: ['company_project', 'internship'] },
    { id: ids.students.student3, profile_id: userIds.student3, degree_programme: 'Business Information Technology', department: 'Business', study_credits: 35, availability_start: '2027-02-01', availability_end: '2027-03-01', preferred_project_types: ['internship'] },
  ])
  const course = Object.fromEntries(courseRows.map((row) => [row.code, row.id]))
  const skill = Object.fromEntries(skillRows.map((row) => [row.name_fi, row.id]))
  const interest = Object.fromEntries(interestRows.map((row) => [row.name_fi, row.id]))
  await upsertRows('student_courses', [course.TTTEST01 && { student_id: ids.students.student1, course_id: course.TTTEST01 }, { student_id: ids.students.student1, course_id: course.TTTEST02 }, { student_id: ids.students.student1, course_id: course.TTTEST03 }, { student_id: ids.students.student2, course_id: course.TTTEST02 }, { student_id: ids.students.student2, course_id: course.TTTEST03 }, { student_id: ids.students.student3, course_id: course.TTTEST05 }].filter(Boolean), 'student_id,course_id')
  await upsertRows('student_skills', [
    ...['Python', 'Machine Learning', 'React', 'TypeScript', 'PostgreSQL', 'REST APIs'].map((name) => ({ student_id: ids.students.student1, skill_id: skill[name] })),
    ...['React', 'TypeScript', 'REST APIs'].map((name) => ({ student_id: ids.students.student2, skill_id: skill[name] })),
    { student_id: ids.students.student3, skill_id: skill['Data Analytics'] },
  ], 'student_id,skill_id')
  await upsertRows('student_interests', [
    { student_id: ids.students.student1, interest_id: interest.AI }, { student_id: ids.students.student1, interest_id: interest.Frontend }, { student_id: ids.students.student1, interest_id: interest.Backend },
    { student_id: ids.students.student2, interest_id: interest.Frontend }, { student_id: ids.students.student2, interest_id: interest.Backend }, { student_id: ids.students.student3, interest_id: interest.Analytics },
  ], 'student_id,interest_id')

  const projectRows = [
    ['ai', ids.companies.company1, 'AI / Python machine learning lab', 'AI and Python project for a predictive learning service.', 'company_project', 'hybrid', 'fi', 80],
    ['frontend', ids.companies.company1, 'Frontend React accessibility renewal', 'React and TypeScript frontend renewal with WCAG focus.', 'company_project', 'remote', 'fi', 60],
    ['backend', ids.companies.company1, 'Backend databases and APIs', 'PostgreSQL data model and REST API implementation.', 'company_project', 'hybrid', 'en', 90],
    ['mobile', ids.companies.company2, 'Mobile development companion app', 'React Native mobile application for students.', 'company_project', 'remote', 'en', 60],
    ['analytics', ids.companies.company2, 'Data analytics dashboard', 'Analytics dashboard and reporting pipeline.', 'internship', 'onsite', 'en', 120],
  ].map(([key, company_id, title, description, project_type, work_mode, required_language, minimum_study_credits]) => ({ id: ids.projects[key], company_id, title, description, project_type, status: 'published', positions: 3, application_start: '2026-08-01', application_deadline: '2027-12-31', project_start: '2027-01-01', project_end: '2027-05-31', work_mode, location: work_mode === 'remote' ? 'Remote' : 'Oulu', remote_allowed: work_mode === 'remote', minimum_study_credits, required_language, department: 'ICT' }))
  await upsertRows('projects', projectRows)
  await upsertRows('project_weights', projectRows.map((project) => ({ project_id: project.id, study_credits: 10, required_courses: 20, recommended_courses: 10, skills: 25, language: 10, availability: 10, interests: 10, degree_programme: 5 })), 'project_id')
  await upsertRows('project_required_courses', [{ project_id: ids.projects.ai, course_id: course.TTTEST01 }, { project_id: ids.projects.frontend, course_id: course.TTTEST02 }, { project_id: ids.projects.backend, course_id: course.TTTEST03 }, { project_id: ids.projects.mobile, course_id: course.TTTEST04 }, { project_id: ids.projects.analytics, course_id: course.TTTEST05 }], 'project_id,course_id')
  await upsertRows('project_required_skills', [
    { project_id: ids.projects.ai, skill_id: skill.Python }, { project_id: ids.projects.ai, skill_id: skill['Machine Learning'] }, { project_id: ids.projects.frontend, skill_id: skill.React }, { project_id: ids.projects.frontend, skill_id: skill.TypeScript }, { project_id: ids.projects.backend, skill_id: skill.PostgreSQL }, { project_id: ids.projects.backend, skill_id: skill['REST APIs'] }, { project_id: ids.projects.mobile, skill_id: skill['React Native'] }, { project_id: ids.projects.analytics, skill_id: skill['Data Analytics'] },
  ], 'project_id,skill_id')
  await upsertRows('project_interests', [{ project_id: ids.projects.ai, interest_id: interest.AI }, { project_id: ids.projects.frontend, interest_id: interest.Frontend }, { project_id: ids.projects.backend, interest_id: interest.Backend }, { project_id: ids.projects.mobile, interest_id: interest.Mobile }, { project_id: ids.projects.analytics, interest_id: interest.Analytics }], 'project_id,interest_id')

  const { error: matchError } = await admin.from('matches').upsert([
    { project_id: ids.projects.ai, student_id: ids.students.student1, total_score: 96, explanation: 'Excellent Python and machine learning overlap.', matched_courses: ['AI and Machine Learning'], matched_skills: ['Python', 'Machine Learning'], missing_required_courses: [], missing_required_skills: [] },
    { project_id: ids.projects.ai, student_id: ids.students.student2, total_score: 55, explanation: 'Some relevant development experience, but AI skills are missing.', matched_courses: [], matched_skills: [], missing_required_courses: ['AI and Machine Learning'], missing_required_skills: ['Python', 'Machine Learning'] },
    { project_id: ids.projects.ai, student_id: ids.students.student3, total_score: 18, explanation: 'Little overlap with the AI project requirements.', matched_courses: [], matched_skills: [], missing_required_courses: ['AI and Machine Learning'], missing_required_skills: ['Python', 'Machine Learning'] },
    { project_id: ids.projects.mobile, student_id: ids.students.student1, total_score: 64, explanation: 'Mobile project match owned by the second company.', matched_courses: [], matched_skills: ['React'], missing_required_courses: ['Mobile Development'], missing_required_skills: ['React Native'] },
  ], { onConflict: 'student_id,project_id' })
  if (matchError) throw new Error(`upsert matches: ${matchError.message}`)

  console.log(`Seeded ${users.length} auth users, 2 companies, 3 students and 5 projects at ${supabaseUrl}`)
  console.log(`Test marker: ${TEST_MARKER}`)
}

main().catch((error) => {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
})
