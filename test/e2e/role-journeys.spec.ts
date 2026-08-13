import { expect, test, type Page } from '@playwright/test'

const password = process.env.E2E_PASSWORD ?? 'LocalDemoOnly!1'

const accounts = {
  student: process.env.E2E_STUDENT_EMAIL ?? 't3jato02@students.oamk.fi',
  company: process.env.E2E_COMPANY_EMAIL ?? 'contact@nordicsoft.example',
  teacher: process.env.E2E_TEACHER_EMAIL ?? 'teacher.demo@oamk.fi',
}

async function login(page: Page, email: string, expectedPath: RegExp) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  try {
    await expect(page).toHaveURL(expectedPath)
  } catch (error) {
    const alert = await page.locator('[role="alert"]').textContent().catch(() => null)
    throw new Error(`Login failed for ${email}: ${alert ?? 'no visible error'}`, {
      cause: error,
    })
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

  const privateRanking = await page.request.get(
    '/api/projects/90000000-0000-4000-8000-000000000001/top-candidates'
  )
  expect(privateRanking.status()).toBe(403)
})

test('company can sign in and open applicant and ranking pages', async ({ page }) => {
  await login(page, accounts.company, /\/company\/dashboard$/)
  await page.goto('/company/projects/90000000-0000-4000-8000-000000000001/applicants')
  await expect(page).toHaveURL(/\/applicants$/)
  await page.goto('/company/projects/90000000-0000-4000-8000-000000000001/top')
  await expect(page).toHaveURL(/\/top$/)
})

test('teacher can sign in and open oversight and audit pages', async ({ page }) => {
  await login(page, accounts.teacher, /\/teacher\/dashboard$/)
  await page.goto('/teacher/projects')
  await expect(page).toHaveURL(/\/teacher\/projects$/)
  await page.goto('/teacher/audit')
  await expect(page).toHaveURL(/\/teacher\/audit$/)
})
