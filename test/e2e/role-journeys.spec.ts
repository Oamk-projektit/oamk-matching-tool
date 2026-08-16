import { expect, test, type Page } from '@playwright/test'

const password = process.env.E2E_PASSWORD ?? process.env.TEST_SEED_PASSWORD ?? 'LocalDemoOnly!1'

const accounts = {
  student: process.env.E2E_STUDENT_EMAIL ?? 'student1@oamk-matching.test',
  student2: process.env.E2E_STUDENT2_EMAIL ?? 'student2@oamk-matching.test',
  student3: process.env.E2E_STUDENT3_EMAIL ?? 'student3@oamk-matching.test',
  company: process.env.E2E_COMPANY_EMAIL ?? 'company1@oamk-matching.test',
  teacher: process.env.E2E_TEACHER_EMAIL ?? 'teacher1@oamk-matching.test',
}

const aiProjectId = '74000000-0000-4000-8000-000000000001'
const consoleErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  consoleErrors.set(page, errors)
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
})

test.afterEach(async ({ page }, testInfo) => {
  const errors = consoleErrors.get(page) ?? []
  await testInfo.attach('console-errors', {
    body: Buffer.from(errors.length ? errors.join('\n') : 'No console errors'),
    contentType: 'text/plain',
  })
})

async function login(page: Page, email: string, expectedPath: RegExp) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(password)
    await page.locator('button[type="submit"]').click()
    try {
      await expect(page).toHaveURL(expectedPath, { timeout: 10_000 })
      return
    } catch (error) {
      if (attempt < 3) continue
      const alert = await page.locator('[role="alert"]').textContent().catch(() => null)
      throw new Error(`Login failed for ${email}: ${alert ?? 'no visible error'}`, {
        cause: error,
      })
    }
  }
}

test('health endpoint reports a connected database', async ({ request }) => {
  const response = await request.get('/api/health?deep=1')
  expect(response.ok()).toBeTruthy()
  await expect(response.json()).resolves.toMatchObject({
    data: { database: 'connected' },
  })
})

test('student can sign in and open core journey pages', async ({ page }) => {
  await login(page, accounts.student, /\/dashboard$/)

  for (const path of ['/profile', '/projects', '/matches', '/applications', '/notifications']) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
    await expect(page.locator('body')).not.toContainText(/unauthorized|forbidden/i)
  }

  const matches = await page.request.get('/api/matches/me')
  expect(matches.ok()).toBeTruthy()
  const matchBody = await matches.json()
  expect(matchBody.data).toEqual(expect.arrayContaining([
    expect.objectContaining({ projectId: aiProjectId, totalScore: 96 }),
  ]))
  expect(matchBody.data[0].explanation).toBeTruthy()

  const privateRanking = await page.request.get(`/api/projects/${aiProjectId}/top-candidates`)
  expect(privateRanking.status()).toBe(403)
})

test('company can sign in and open applicant and ranking pages', async ({ page }) => {
  await login(page, accounts.company, /\/company\/dashboard$/)
  await page.goto(`/company/projects/${aiProjectId}/applicants`)
  await expect(page).toHaveURL(/\/applicants$/)
  const matches = await page.request.get(`/api/projects/${aiProjectId}/matches`)
  expect(matches.ok()).toBeTruthy()
  const matchBody = await matches.json()
  expect(matchBody.data.map((match: { totalScore: number }) => match.totalScore)).toEqual([96, 55, 18])
  await page.goto(`/company/projects/${aiProjectId}/top`)
  await expect(page).toHaveURL(/\/top$/)
})

test('teacher can sign in and open oversight and audit pages', async ({ page }) => {
  await login(page, accounts.teacher, /\/teacher\/dashboard$/)
  await page.goto('/teacher/projects')
  await expect(page).toHaveURL(/\/teacher\/projects$/)
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/teacher/students')
  await expect(page.getByRole('heading', { name: 'Test Student 1' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Test Student 2' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Test Student 3' })).toBeVisible()
  await expect(page.getByText('Tietotekniikan tutkinto-ohjelma').first()).toBeVisible()
  await expect(page.getByText('Tietojenkäsittelyn tutkinto-ohjelma')).toBeVisible()
  await expect(page.getByText('Informaatioteknologia').first()).toBeVisible()
  const student1Card = page
    .getByRole('heading', { name: 'Test Student 1' })
    .locator('xpath=ancestor::div[contains(@class,"flex-col")][1]')
  const student3Card = page
    .getByRole('heading', { name: 'Test Student 3' })
    .locator('xpath=ancestor::div[contains(@class,"flex-col")][1]')
  await expect(student1Card).toContainText('Suuntautuminen')
  await expect(student3Card).not.toContainText('Suuntautuminen')
  await expect(page.locator('body')).not.toContainText(
    /Software Engineering|Business Information Technology|\bICT\b|OSASTO/
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
  ).toBe(false)

  await page.goto('/teacher/audit')
  await expect(page).toHaveURL(/\/teacher\/audit$/)

  await expect(
    page.getByRole('heading', { name: 'Projektia päivitettiin' }).first()
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Projekti luotiin' }).first()
  ).toBeVisible()
  await expect(
    page.getByText('AI / Python machine learning lab', { exact: true }).first()
  ).toBeVisible()

  const technicalDetails = page
    .locator('details')
    .filter({ hasText: aiProjectId })
    .first()
  await expect(technicalDetails).not.toHaveAttribute('open', '')
  await expect(technicalDetails.getByText(aiProjectId, { exact: true })).toBeHidden()
  await technicalDetails.getByText('Näytä tekniset tiedot').click()
  await expect(technicalDetails.getByText(aiProjectId, { exact: true })).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('wrong role cannot open company or teacher surfaces', async ({ page }) => {
  await login(page, accounts.student, /\/dashboard$/)
  await page.goto('/company/dashboard')
  await expect(page).not.toHaveURL(/\/company\/dashboard$/)
  await page.goto('/teacher/dashboard')
  await expect(page).not.toHaveURL(/\/teacher\/dashboard$/)
})

test('logout clears the student session', async ({ page }) => {
  await login(page, accounts.student, /\/dashboard$/)
  const logout = page.getByRole('button', { name: /logout|kirjaudu ulos/i })
  await logout.click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/profile')
  await expect(page).not.toHaveURL(/\/profile$/)
})

test('company creates and publishes a project that flows through matching and oversight', async ({
  page,
  browser,
}) => {
  test.slow()
  await login(page, accounts.company, /\/company\/dashboard$/)

  const [coursesResponse, skillsResponse, interestsResponse] = await Promise.all([
    page.request.get('/api/courses'),
    page.request.get('/api/skills'),
    page.request.get('/api/interests'),
  ])
  expect(coursesResponse.ok()).toBeTruthy()
  expect(skillsResponse.ok()).toBeTruthy()
  expect(interestsResponse.ok()).toBeTruthy()
  const courses = (await coursesResponse.json()).data
  const skills = (await skillsResponse.json()).data
  const interests = (await interestsResponse.json()).data
  const aiCourse = courses.find((course: { code: string }) => course.code === 'TTTEST01')
  const pythonSkill = skills.find(
    (skill: { normalizedName: string }) => skill.normalizedName === 'test-python'
  )
  const aiInterest = interests.find(
    (interest: { normalizedName: string }) => interest.normalizedName === 'test-ai'
  )
  expect(aiCourse?.id).toBeTruthy()
  expect(pythonSkill?.id).toBeTruthy()
  expect(aiInterest?.id).toBeTruthy()

  const created = await page.request.post('/api/projects', {
    data: {
      title: 'E2E acceptance AI project',
      description: 'Created by the browser acceptance flow.',
      projectType: 'company_project',
      status: 'draft',
      positions: 3,
      applicationStart: '2026-08-01',
      applicationDeadline: '2027-12-31',
      projectStart: '2027-01-01',
      projectEnd: '2027-05-31',
      workMode: 'hybrid',
      location: 'Oulu',
      remoteAllowed: true,
      minimumStudyCredits: 40,
      requiredLanguage: 'en',
      department: 'Informaatioteknologia',
      requiredCourseIds: [aiCourse.id],
      recommendedCourseIds: [],
      requiredSkillIds: [pythonSkill.id],
      recommendedSkillIds: [],
      interestIds: [aiInterest.id],
    },
  })
  expect(created.status()).toBe(201)
  const project = (await created.json()).data
  expect(project.status).toBe('draft')

  try {
    const published = await page.request.put(`/api/projects/${project.id}`, {
      data: { status: 'published' },
    })
    expect(published.ok()).toBeTruthy()
    expect((await published.json()).data.status).toBe('published')

    for (const email of [accounts.student, accounts.student2, accounts.student3]) {
      const applicantContext = await browser.newContext()
      const applicantPage = await applicantContext.newPage()
      try {
        await login(applicantPage, email, /\/dashboard$/)
        const application = await applicantPage.request.post('/api/applications', {
          data: { projectId: project.id, message: 'E2E acceptance application' },
        })
        expect(application.status()).toBe(201)
      } finally {
        await applicantContext.close()
      }
    }

    const generated = await page.request.post(`/api/projects/${project.id}/matches`, {
      data: { locale: 'en' },
    })
    expect(generated.ok()).toBeTruthy()
    expect((await generated.json()).data).toHaveLength(3)

    const companyMatches = await page.request.get(`/api/projects/${project.id}/matches`)
    expect(companyMatches.ok()).toBeTruthy()
    const ranked = (await companyMatches.json()).data
    expect(ranked.map((match: { totalScore: number }) => match.totalScore)).toEqual(
      [...ranked].map((match: { totalScore: number }) => match.totalScore).sort((a, b) => b - a)
    )
    expect(ranked.every((match: { totalScore: number; explanation: string }) => match.totalScore >= 0 && match.totalScore <= 100 && match.explanation)).toBeTruthy()

    const studentContext = await browser.newContext()
    const studentPage = await studentContext.newPage()
    try {
      await login(studentPage, accounts.student, /\/dashboard$/)
      await studentPage.goto(`/projects/${project.id}`)
      await expect(studentPage).toHaveURL(new RegExp(`/projects/${project.id}$`))
      const studentMatches = await studentPage.request.get('/api/matches/me')
      expect(studentMatches.ok()).toBeTruthy()
      expect((await studentMatches.json()).data).toEqual(
        expect.arrayContaining([expect.objectContaining({ projectId: project.id })])
      )
    } finally {
      await studentContext.close()
    }

    const teacherContext = await browser.newContext()
    const teacherPage = await teacherContext.newPage()
    try {
      await login(teacherPage, accounts.teacher, /\/teacher\/dashboard$/)
      await teacherPage.goto(`/teacher/projects/${project.id}`)
      await expect(teacherPage).toHaveURL(new RegExp(`/teacher/projects/${project.id}$`))
    } finally {
      await teacherContext.close()
    }
  } finally {
    const deleted = await page.request.delete(`/api/projects/${project.id}`)
    expect([200, 204]).toContain(deleted.status())
  }
})
