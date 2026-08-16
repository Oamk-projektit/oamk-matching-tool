import { createClient } from '@supabase/supabase-js'

const MANUAL_TEST_CONFIRM = 'OAMK-MANUAL-CLOUD-TEST-USERS-2026'
const TEST_MARKER = 'oamk-manual-cloud-test-users-v1'
const RESET = process.argv.includes('--reset')

const requiredEnv = [
  'MANUAL_TEST_SEED_ALLOW',
  'MANUAL_TEST_SEED_CONFIRM',
  'MANUAL_TEST_ALLOWED_PROJECT_REF',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MANUAL_TEST_USER_PASSWORD',
]

for (const name of requiredEnv) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`)
}

if (process.env.MANUAL_TEST_SEED_ALLOW !== 'true') {
  throw new Error('Refusing Cloud manual-user seed: MANUAL_TEST_SEED_ALLOW must be true')
}
if (process.env.MANUAL_TEST_SEED_CONFIRM !== MANUAL_TEST_CONFIRM) {
  throw new Error(`Refusing Cloud manual-user seed: MANUAL_TEST_SEED_CONFIRM must equal ${MANUAL_TEST_CONFIRM}`)
}
if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing Cloud manual-user seed when NODE_ENV=production; use an explicit QA shell environment')
}

const supabaseUrl = process.env.SUPABASE_URL.trim().replace(/\/$/, '')
const allowedProjectRef = process.env.MANUAL_TEST_ALLOWED_PROJECT_REF.trim()
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
const password = process.env.MANUAL_TEST_USER_PASSWORD

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  throw new Error('Refusing Cloud manual-user seed: SUPABASE_URL must be an https://<project-ref>.supabase.co URL')
}
if (/localhost|127\.0\.0\.1/i.test(supabaseUrl)) {
  throw new Error('Refusing Cloud manual-user seed: localhost URL is not allowed')
}
if (!/^[a-z0-9-]{1,63}$/.test(allowedProjectRef)) {
  throw new Error('Refusing Cloud manual-user seed: MANUAL_TEST_ALLOWED_PROJECT_REF is invalid')
}
if (!password || password.length < 12) {
  throw new Error('MANUAL_TEST_USER_PASSWORD must contain at least 12 characters')
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
if (projectRef !== allowedProjectRef) {
  throw new Error(`Refusing Cloud manual-user seed: URL project ref ${projectRef} does not match MANUAL_TEST_ALLOWED_PROJECT_REF`)
}

console.log('TARGET PROJECT:', projectRef)
console.log('TARGET URL:', supabaseUrl)
console.log('MODE: CLOUD MANUAL TEST USERS')
console.log(RESET ? 'ACTION: RESET EXPLICIT MANUAL TEST DATA' : 'ACTION: UPSERT EXPLICIT MANUAL TEST DATA')

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ids = {
  users: {
    student1: '81000000-0000-4000-8000-000000000001',
    student2: '81000000-0000-4000-8000-000000000002',
    student3: '81000000-0000-4000-8000-000000000003',
    teacher1: '81000000-0000-4000-8000-000000000011',
    teacher2: '81000000-0000-4000-8000-000000000012',
    company1: '81000000-0000-4000-8000-000000000021',
    company2: '81000000-0000-4000-8000-000000000022',
  },
  companies: {
    company1: '82000000-0000-4000-8000-000000000001',
    company2: '82000000-0000-4000-8000-000000000002',
  },
  students: {
    student1: '83000000-0000-4000-8000-000000000001',
    student2: '83000000-0000-4000-8000-000000000002',
    student3: '83000000-0000-4000-8000-000000000003',
  },
  projects: {
    ai: '84000000-0000-4000-8000-000000000001',
    frontend: '84000000-0000-4000-8000-000000000002',
    backend: '84000000-0000-4000-8000-000000000003',
  },
  courses: {
    ai: '85000000-0000-4000-8000-000000000001',
    frontend: '85000000-0000-4000-8000-000000000002',
    backend: '85000000-0000-4000-8000-000000000003',
  },
  skills: {
    python: '86000000-0000-4000-8000-000000000001',
    machineLearning: '86000000-0000-4000-8000-000000000002',
    react: '86000000-0000-4000-8000-000000000003',
    typeScript: '86000000-0000-4000-8000-000000000004',
    reactNative: '86000000-0000-4000-8000-000000000005',
  },
  interests: {
    ai: '87000000-0000-4000-8000-000000000001',
    frontend: '87000000-0000-4000-8000-000000000002',
    mobile: '87000000-0000-4000-8000-000000000003',
  },
}

const users = [
  ['student1', 'student1@oamk-matching.test', 'student', 'Manual QA Student 1'],
  ['student2', 'student2@oamk-matching.test', 'student', 'Manual QA Student 2'],
  ['student3', 'student3@oamk-matching.test', 'student', 'Manual QA Student 3'],
  ['teacher1', 'teacher1@oamk-matching.test', 'teacher', 'Manual QA Teacher 1'],
  ['teacher2', 'teacher2@oamk-matching.test', 'teacher', 'Manual QA Teacher 2'],
  ['company1', 'company1@oamk-matching.test', 'company', 'Manual QA Company 1'],
  ['company2', 'company2@oamk-matching.test', 'company', 'Manual QA Company 2'],
]

async function checked(promise, label) {
  const { data, error } = await promise
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

async function upsertRows(table, rows, onConflict = 'id') {
  if (rows.length) await checked(admin.from(table).upsert(rows, { onConflict }), `upsert ${table}`)
}

async function listAllUsers() {
  const users = []
  for (let page = 1; ; page += 1) {
    const result = await checked(admin.auth.admin.listUsers({ page, perPage: 1000 }), 'list Auth users')
    users.push(...result.users)
    if (result.users.length < 1000) return users
  }
}

async function ensureUser(key, email, role, displayName, existingUsers) {
  let user = existingUsers.find((candidate) => candidate.email?.toLowerCase() === email)
  const metadata = {
    role,
    display_name: displayName,
    preferred_language: 'en',
    is_test_user: true,
    test_purpose: 'manual_qa',
    test_marker: TEST_MARKER,
  }

  if (!user) {
    user = await checked(
      admin.auth.admin.createUser({
        id: ids.users[key],
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      }),
      `create Auth user ${email}`
    )
    user = user.user
  } else {
    if (user.id !== ids.users[key]) {
      throw new Error(
        `Refusing ${email}: existing Auth user id ${user.id} does not match reserved manual-QA id ${ids.users[key]}`
      )
    }
    user = (
      await checked(
        admin.auth.admin.updateUserById(user.id, {
          password,
          email_confirm: true,
          user_metadata: { ...user.user_metadata, ...metadata },
        }),
        `update Auth user ${email}`
      )
    ).user
  }

  await upsertRows('profiles', [{
    id: user.id,
    role,
    display_name: displayName,
    email,
    preferred_language: 'en',
  }])
  return user.id
}

async function reset() {
  const projectIds = Object.values(ids.projects)
  const companyIds = Object.values(ids.companies)
  const studentIds = Object.values(ids.students)
  const profileIds = Object.values(ids.users)

  const deletes = [
    ['selection_decisions', 'project_id', projectIds],
    ['matches', 'project_id', projectIds],
    ['applications', 'project_id', projectIds],
    ['audit_events', 'entity_id', [...projectIds, ...profileIds]],
    ['notifications', 'profile_id', profileIds],
    ['project_weights', 'project_id', projectIds],
    ['project_interests', 'project_id', projectIds],
    ['project_recommended_skills', 'project_id', projectIds],
    ['project_required_skills', 'project_id', projectIds],
    ['project_recommended_courses', 'project_id', projectIds],
    ['project_required_courses', 'project_id', projectIds],
    ['projects', 'id', projectIds],
    ['student_interests', 'student_id', studentIds],
    ['student_skills', 'student_id', studentIds],
    ['student_courses', 'student_id', studentIds],
    ['students', 'id', studentIds],
    ['company_users', 'company_id', companyIds],
    ['companies', 'id', companyIds],
    ['profiles', 'id', profileIds],
  ]

  for (const [table, column, values] of deletes) {
    await checked(admin.from(table).delete().in(column, values), `reset ${table}`)
  }

  const existingUsers = await listAllUsers()
  for (const [, email] of users) {
    const user = existingUsers.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) await checked(admin.auth.admin.deleteUser(user.id), `delete Auth user ${email}`)
  }
  console.log('Reset complete: only the seven explicit manual QA accounts and fixed test entities were targeted.')
}

async function main() {
  if (RESET) {
    await reset()
    return
  }

  const existingUsers = await listAllUsers()
  const userIds = {}
  for (const user of users) userIds[user[0]] = await ensureUser(...user, existingUsers)

  await upsertRows('companies', [
    { id: ids.companies.company1, name: 'Manual QA Company 1', business_id: 'MANUAL-QA-001', description: TEST_MARKER, website: 'https://manual-qa-company-1.invalid' },
    { id: ids.companies.company2, name: 'Manual QA Company 2', business_id: 'MANUAL-QA-002', description: TEST_MARKER, website: 'https://manual-qa-company-2.invalid' },
  ])
  await upsertRows('company_users', [
    { company_id: ids.companies.company1, profile_id: userIds.company1, company_role: 'owner' },
    { company_id: ids.companies.company2, profile_id: userIds.company2, company_role: 'owner' },
  ], 'company_id,profile_id')

  await upsertRows('courses', [
    { id: ids.courses.ai, code: 'MANUAL-QA-AI', name_fi: 'AI ja koneoppiminen', name_en: 'AI and Machine Learning', credits: 5, department: 'ICT', active: true },
    { id: ids.courses.frontend, code: 'MANUAL-QA-FE', name_fi: 'Frontend-kehitys', name_en: 'Frontend Development', credits: 5, department: 'ICT', active: true },
    { id: ids.courses.backend, code: 'MANUAL-QA-BE', name_fi: 'Backend API:t', name_en: 'Backend APIs', credits: 5, department: 'ICT', active: true },
  ])
  await upsertRows('skills', [
    { id: ids.skills.python, name_fi: 'Python', name_en: 'Python', normalized_name: 'manual-qa-python' },
    { id: ids.skills.machineLearning, name_fi: 'Machine Learning', name_en: 'Machine Learning', normalized_name: 'manual-qa-machine-learning' },
    { id: ids.skills.react, name_fi: 'React', name_en: 'React', normalized_name: 'manual-qa-react' },
    { id: ids.skills.typeScript, name_fi: 'TypeScript', name_en: 'TypeScript', normalized_name: 'manual-qa-typescript' },
    { id: ids.skills.reactNative, name_fi: 'React Native', name_en: 'React Native', normalized_name: 'manual-qa-react-native' },
  ])
  await upsertRows('interests', [
    { id: ids.interests.ai, name_fi: 'Tekoäly', name_en: 'AI', normalized_name: 'manual-qa-ai' },
    { id: ids.interests.frontend, name_fi: 'Frontend', name_en: 'Frontend', normalized_name: 'manual-qa-frontend' },
    { id: ids.interests.mobile, name_fi: 'Mobiilikehitys', name_en: 'Mobile Development', normalized_name: 'manual-qa-mobile' },
  ])

  await upsertRows('students', [
    { id: ids.students.student1, profile_id: userIds.student1, degree_programme: 'Software Engineering', department: 'ICT', study_credits: 180, availability_start: '2026-09-01', availability_end: '2027-05-31', preferred_project_types: ['company_project'] },
    { id: ids.students.student2, profile_id: userIds.student2, degree_programme: 'Software Engineering', department: 'ICT', study_credits: 100, availability_start: '2026-09-01', availability_end: '2027-01-31', preferred_project_types: ['company_project', 'internship'] },
    { id: ids.students.student3, profile_id: userIds.student3, degree_programme: 'Business Information Technology', department: 'Business', study_credits: 50, availability_start: '2027-02-01', availability_end: '2027-05-31', preferred_project_types: ['internship'] },
  ])
  await upsertRows('student_courses', [
    { student_id: ids.students.student1, course_id: ids.courses.ai },
    { student_id: ids.students.student1, course_id: ids.courses.backend },
    { student_id: ids.students.student2, course_id: ids.courses.frontend },
    { student_id: ids.students.student3, course_id: ids.courses.frontend },
  ], 'student_id,course_id')
  await upsertRows('student_skills', [
    { student_id: ids.students.student1, skill_id: ids.skills.python },
    { student_id: ids.students.student1, skill_id: ids.skills.machineLearning },
    { student_id: ids.students.student1, skill_id: ids.skills.react },
    { student_id: ids.students.student2, skill_id: ids.skills.react },
    { student_id: ids.students.student2, skill_id: ids.skills.typeScript },
    { student_id: ids.students.student2, skill_id: ids.skills.python },
    { student_id: ids.students.student3, skill_id: ids.skills.reactNative },
  ], 'student_id,skill_id')
  await upsertRows('student_interests', [
    { student_id: ids.students.student1, interest_id: ids.interests.ai },
    { student_id: ids.students.student2, interest_id: ids.interests.frontend },
    { student_id: ids.students.student3, interest_id: ids.interests.mobile },
  ], 'student_id,interest_id')

  await upsertRows('projects', [
    { id: ids.projects.ai, company_id: ids.companies.company1, title: 'Manual QA AI / Python Project', description: TEST_MARKER, project_type: 'company_project', status: 'published', positions: 3, application_start: '2026-08-01', application_deadline: '2027-12-31', project_start: '2027-01-01', project_end: '2027-05-31', work_mode: 'hybrid', location: 'Oulu', remote_allowed: true, minimum_study_credits: 60, required_language: 'en', department: 'ICT' },
    { id: ids.projects.frontend, company_id: ids.companies.company1, title: 'Manual QA Frontend Project', description: TEST_MARKER, project_type: 'company_project', status: 'published', positions: 2, application_start: '2026-08-01', application_deadline: '2027-12-31', project_start: '2027-01-01', project_end: '2027-05-31', work_mode: 'remote', location: 'Remote', remote_allowed: true, minimum_study_credits: 40, required_language: 'en', department: 'ICT' },
    { id: ids.projects.backend, company_id: ids.companies.company1, title: 'Manual QA Backend APIs Project', description: TEST_MARKER, project_type: 'company_project', status: 'published', positions: 2, application_start: '2026-08-01', application_deadline: '2027-12-31', project_start: '2027-01-01', project_end: '2027-05-31', work_mode: 'hybrid', location: 'Oulu', remote_allowed: true, minimum_study_credits: 60, required_language: 'en', department: 'ICT' },
  ])
  await upsertRows('project_required_courses', [
    { project_id: ids.projects.ai, course_id: ids.courses.ai },
    { project_id: ids.projects.frontend, course_id: ids.courses.frontend },
    { project_id: ids.projects.backend, course_id: ids.courses.backend },
  ], 'project_id,course_id')
  await upsertRows('project_required_skills', [
    { project_id: ids.projects.ai, skill_id: ids.skills.python },
    { project_id: ids.projects.ai, skill_id: ids.skills.machineLearning },
    { project_id: ids.projects.frontend, skill_id: ids.skills.react },
    { project_id: ids.projects.frontend, skill_id: ids.skills.typeScript },
    { project_id: ids.projects.backend, skill_id: ids.skills.python },
  ], 'project_id,skill_id')
  await upsertRows('project_interests', [
    { project_id: ids.projects.ai, interest_id: ids.interests.ai },
    { project_id: ids.projects.frontend, interest_id: ids.interests.frontend },
    { project_id: ids.projects.backend, interest_id: ids.interests.ai },
  ], 'project_id,interest_id')
  await upsertRows('project_weights', Object.values(ids.projects).map((projectId) => ({ project_id: projectId, study_credits: 10, required_courses: 20, recommended_courses: 10, skills: 25, language: 10, availability: 10, interests: 10, degree_programme: 5 })), 'project_id')

  console.log('Seed complete: 7 Auth users, 7 profiles, 2 companies, 2 memberships, 3 students and 3 published projects.')
  console.log(`Test marker: ${TEST_MARKER}`)
  console.log('Manual QA password was not printed.')
}

main().catch((error) => {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
})
