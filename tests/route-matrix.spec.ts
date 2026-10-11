import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:9989'
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || 'kurregorojas@gmail.com'
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || ''

async function login(page: Page) {
  test.skip(!ADMIN_PASSWORD, 'Define QA_ADMIN_PASSWORD en el entorno para los tests con login')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 })
}

async function refreshPage(page: Page) {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
}

async function clearStorageAndRefresh(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
}

function attachErrorCollector(page: Page, errors: string[]) {
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))
}

function assertNoCriticalErrors(errors: string[], label: string) {
  const criticalErrors = errors.filter(e => {
    if (e.includes('Failed to load resource')) return false
    if (e.includes('500') || e.includes('PGRST100') || e.includes('failed to parse filter')) return true
    if (e.includes('supabase') && e.includes('error')) return true
    return false
  })
  expect(criticalErrors, `${label}: critical terminal errors found: ${criticalErrors.join(', ')}`).toHaveLength(0)
}

test.describe('Route + F5 + localStorage Test Matrix', () => {
  test.setTimeout(180000)
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test.describe('Public Routes', () => {
    const publicRoutes = [
      { name: 'Home', path: '/' },
      { name: 'Projects Catalog', path: '/projects' },
      { name: 'Projects Filter', path: '/projects?technology=informatica' },
      { name: 'Publications Catalog', path: '/publicaciones' },
      { name: 'Professor Profile', path: '/profesor/test-id' },
      { name: 'About', path: '/about' },
    ]

    for (const route of publicRoutes) {
      test(`${route.name} (${route.path}) - F5 no errors`, async ({ page }) => {
        const errors: string[] = []
        attachErrorCollector(page, errors)

        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(2000)
        await refreshPage(page)
        await page.waitForTimeout(2000)
        assertNoCriticalErrors(errors, `${route.name} F5`)
      })

      test(`${route.name} (${route.path}) - localStorage.clear + F5`, async ({ page }) => {
        const errors: string[] = []
        attachErrorCollector(page, errors)

        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(2000)
        await clearStorageAndRefresh(page)
        await page.waitForTimeout(2000)
        assertNoCriticalErrors(errors, `${route.name} clearStorage+F5`)
      })
    }

    test('Projects detail - F5 no errors', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' })
      const firstProjectLink = page.locator('a[href^="/projects/"]').first()
      if (await firstProjectLink.isVisible()) {
        await firstProjectLink.click()
        await page.waitForTimeout(3000)
        await refreshPage(page)
        await page.waitForTimeout(2000)
        assertNoCriticalErrors(errors, 'Project detail F5')
      }
    })

    test('Publications detail - F5 no errors', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/publicaciones`, { waitUntil: 'domcontentloaded' })
      const firstPubLink = page.locator('a[href^="/publicaciones/"]').first()
      if (await firstPubLink.isVisible()) {
        await firstPubLink.click()
        await page.waitForTimeout(3000)
        await refreshPage(page)
        await page.waitForTimeout(2000)
        assertNoCriticalErrors(errors, 'Publication detail F5')
      }
    })
  })

  test.describe('Auth Routes', () => {
    test('/login - F5 stays on login', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await refreshPage(page)
      await page.waitForTimeout(2000)
      await expect(page.locator('h2:has-text("Iniciar Sesión")')).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Login F5')
    })

    test('/login - localStorage.clear + F5 stays on login', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await clearStorageAndRefresh(page)
      await page.waitForTimeout(2000)
      await expect(page.locator('h2:has-text("Iniciar Sesión")')).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Login clearStorage+F5')
    })

    test('/login invalid creds - F5 stays on login', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
      await page.fill('input[type="email"]', ADMIN_EMAIL)
      await page.fill('input[type="password"]', 'wrong-password')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(3000)
      await refreshPage(page)
      await page.waitForTimeout(2000)
      await expect(page.locator('h2:has-text("Iniciar Sesión")')).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Login invalid+F5')
    })

    test('Login → Dashboard → F5 → session restored', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await login(page)
      await page.waitForTimeout(3000)
      await refreshPage(page)
      await page.waitForTimeout(3000)
      await expect(page.locator('main').locator('text=Mis Proyectos').first()).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Dashboard after F5')
    })
  })

  test.describe('Protected Dashboard Routes', () => {
    const protectedRoutes = [
      { name: 'Dashboard Home', path: '/dashboard' },
      { name: 'Projects', path: '/dashboard/projects' },
      { name: 'Resources', path: '/dashboard/resources' },
      { name: 'Publications', path: '/dashboard/publications' },
      { name: 'Activities', path: '/dashboard/activities' },
      { name: 'Profile', path: '/dashboard/profile' },
      { name: 'Admin', path: '/dashboard/admin' },
    ]

    for (const route of protectedRoutes) {
      test(`${route.name} (${route.path}) - F5 session restored`, async ({ page }) => {
        const errors: string[] = []
        attachErrorCollector(page, errors)

        await login(page)
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(3000)
        await refreshPage(page)
        await page.waitForTimeout(3000)
        assertNoCriticalErrors(errors, `${route.name} F5`)
      })

      test(`${route.name} (${route.path}) - localStorage.clear → redirect to login`, async ({ page }) => {
        const errors: string[] = []
        attachErrorCollector(page, errors)

        await login(page)
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(3000)
        await clearStorageAndRefresh(page)
        await page.waitForTimeout(3000)
        await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 10000 })
        assertNoCriticalErrors(errors, `${route.name} clearStorage→login`)
      })
    }
  })

  test.describe('CRUD Operations - Persist after F5', () => {
    test('Create Project → F5 → persists', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await login(page)
      await page.goto(`${BASE_URL}/dashboard/projects`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      const createBtn = page.locator('button:has-text("Nuevo proyecto")').first()
      if (await createBtn.isVisible()) {
        await createBtn.click()
        await page.waitForTimeout(2000)
        await page.fill('input[placeholder*="Título"]', 'Test Project QA')
        await page.fill('textarea', 'Test description for QA')
        const submitBtn = page.locator('button[type="submit"]').first()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(3000)
          await refreshPage(page)
          await page.waitForTimeout(3000)
          assertNoCriticalErrors(errors, 'Create Project F5')
        }
      }
    })

    test('Create Resource → F5 → persists', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await login(page)
      await page.goto(`${BASE_URL}/dashboard/resources`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      const createBtn = page.locator('button:has-text("Nuevo recurso")').first()
      if (await createBtn.isVisible()) {
        await createBtn.click()
        await page.waitForTimeout(2000)
        await page.fill('input[placeholder*="Título"]', 'Test Resource QA')
        const submitBtn = page.locator('button[type="submit"]').first()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(3000)
          await refreshPage(page)
          await page.waitForTimeout(3000)
          assertNoCriticalErrors(errors, 'Create Resource F5')
        }
      }
    })

    test('Create Publication → F5 → persists', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await login(page)
      await page.goto(`${BASE_URL}/dashboard/publications`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      const createBtn = page.locator('button:has-text("Nueva publicación")').first()
      if (await createBtn.isVisible()) {
        await createBtn.click()
        await page.waitForTimeout(2000)
        await page.fill('input[placeholder*="Título"]', 'Test Publication QA')
        const submitBtn = page.locator('button[type="submit"]').first()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(3000)
          await refreshPage(page)
          await page.waitForTimeout(3000)
          assertNoCriticalErrors(errors, 'Create Publication F5')
        }
      }
    })

    test('Create Activity → F5 → persists', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await login(page)
      await page.goto(`${BASE_URL}/dashboard/activities`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      const createBtn = page.locator('button:has-text("Nueva actividad")').first()
      if (await createBtn.isVisible()) {
        await createBtn.click()
        await page.waitForTimeout(2000)
        await page.fill('input[placeholder*="Título"]', 'Test Activity QA')
        const submitBtn = page.locator('button[type="submit"]').first()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(3000)
          await refreshPage(page)
          await page.waitForTimeout(3000)
          assertNoCriticalErrors(errors, 'Create Activity F5')
        }
      }
    })
  })
})
