import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:9989'
const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL || 'kurregorojas@gmail.com'
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD || ''

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies()
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
})

function attachErrorCollector(page: Page, errors: string[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
}

function assertNoCriticalErrors(errors: string[], label: string) {
  const critical = errors.filter((e) => {
    if (e.includes('Failed to load resource')) return false
    if (e.includes('500')) return true
    if (e.includes('PGRST100')) return true
    if (e.includes('failed to parse filter')) return true
    if (e.includes('supabase') && e.includes('error')) return true
    return false
  })
  expect(
    critical,
    `${label}: Errores criticos capturados: ${critical.join(', ')}`
  ).toHaveLength(0)
}

async function login(page: Page) {
  test.skip(!ADMIN_PASSWORD, 'Define QA_ADMIN_PASSWORD en el entorno para los tests con login')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 })
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 60000 })
  // NOTA: no usar networkidle — el keep-alive de Supabase lo impide; espera fija
  await page.waitForTimeout(6000)
}

async function refreshPage(page: Page) {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(6000)
}

async function clearStorageAndRefresh(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(6000)
}

async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

test.describe('QA Suite - Area Ciencias y Tecnologia', () => {
  test.setTimeout(180000)
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  // ============================================================
  // PUBLIC PAGES - F5 Refresh + localStorage.clear() con captura de errores
  // ============================================================
  test.describe('Paginas Publicas - F5 Refresh y localStorage.clear()', () => {

    test('Home - Carga correcta con Hero, StemAreas, FeaturedProjects', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Ciencias Naturales y Tecnología')
      await expect(page.locator('main').getByText('Áreas').first()).toBeVisible({ timeout: 20000 })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      assertNoCriticalErrors(errors, 'Home - Carga')
    })

    test('Home - F5 refresh sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Ciencias Naturales y Tecnología', { timeout: 20000 })
      await page.waitForTimeout(2000)

      await refreshPage(page)
      await expect(page.locator('h1')).toContainText('Ciencias Naturales y Tecnología', { timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Home - F5 refresh')
    })

    test('Home - localStorage.clear() + F5 sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Ciencias Naturales y Tecnología', { timeout: 20000 })
      await page.waitForTimeout(2000)

      await clearStorageAndRefresh(page)
      await expect(page.locator('h1')).toContainText('Ciencias Naturales y Tecnología', { timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Home - localStorage.clear() + F5')
    })

    test('Catalogo Proyectos - Carga correcta', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Repositorio de Proyectos')).toBeVisible({ timeout: 20000 })
      await expect(page.locator('input[placeholder*="Título"]')).toBeVisible({ timeout: 15000 })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      assertNoCriticalErrors(errors, 'Catalogo Proyectos - Carga')
    })

    test('Catalogo Proyectos - F5 refresh sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Repositorio de Proyectos')).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await refreshPage(page)
      await expect(page.getByText('Repositorio de Proyectos')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Catalogo Proyectos - F5 refresh')
    })

    test('Catalogo Proyectos - localStorage.clear() + F5 sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Repositorio de Proyectos')).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await clearStorageAndRefresh(page)
      await expect(page.getByText('Repositorio de Proyectos')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Catalogo Proyectos - localStorage.clear() + F5')
    })

    test('Catalogo Proyectos - Filtro por tecnologia desde URL', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects?technology=informatica`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      await page.waitForTimeout(2000)
      assertNoCriticalErrors(errors, 'Catalogo Proyectos - Filtro URL')
    })

    test('Catalogo Publicaciones - Carga correcta', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/publicaciones`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Publicaciones').first()).toBeVisible({ timeout: 20000 })
      await page.locator('input[placeholder*="Buscar publicaciones"]').waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      assertNoCriticalErrors(errors, 'Catalogo Publicaciones - Carga')
    })

    test('Catalogo Publicaciones - F5 refresh sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/publicaciones`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Publicaciones').first()).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await refreshPage(page)
      await expect(page.locator('main').getByText('Publicaciones').first()).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Catalogo Publicaciones - F5 refresh')
    })

    test('Catalogo Publicaciones - localStorage.clear() + F5 sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/publicaciones`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Publicaciones').first()).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await clearStorageAndRefresh(page)
      await expect(page.locator('main').getByText('Publicaciones').first()).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Catalogo Publicaciones - localStorage.clear() + F5')
    })

    test('Detalle Proyecto Publico - Carga correctamente', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' })
      const firstProjectLink = page.locator('a[href^="/projects/"]').first()
      if (await firstProjectLink.isVisible()) {
        await firstProjectLink.click()
        await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
        assertNoCriticalErrors(errors, 'Detalle Proyecto - Carga')
      }
    })

    test('Detalle Proyecto - F5 refresh sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' })
      const firstProjectLink = page.locator('a[href^="/projects/"]').first()
      if (!(await firstProjectLink.isVisible())) {
        return
      }
      await firstProjectLink.click()
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      await refreshPage(page)
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Detalle Proyecto - F5 refresh')
    })

    test('Detalle Proyecto - localStorage.clear() + F5 sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' })
      const firstProjectLink = page.locator('a[href^="/projects/"]').first()
      if (!(await firstProjectLink.isVisible())) {
        return
      }
      await firstProjectLink.click()
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      await clearStorageAndRefresh(page)
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Detalle Proyecto - localStorage.clear() + F5')
    })

    test('Detalle Publicacion - Carga correctamente', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/publicaciones`, { waitUntil: 'domcontentloaded' })
      const firstPubLink = page.locator('a[href^="/publicaciones/"]').first()
      if (await firstPubLink.isVisible()) {
        await firstPubLink.click()
        await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
        assertNoCriticalErrors(errors, 'Detalle Publicacion - Carga')
      }
    })

    test('Detalle Publicacion - F5 refresh sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/publicaciones`, { waitUntil: 'domcontentloaded' })
      const firstPubLink = page.locator('a[href^="/publicaciones/"]').first()
      if (!(await firstPubLink.isVisible())) {
        return
      }
      await firstPubLink.click()
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      await refreshPage(page)
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Detalle Publicacion - F5 refresh')
    })

    test('Detalle Publicacion - localStorage.clear() + F5 sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/publicaciones`, { waitUntil: 'domcontentloaded' })
      const firstPubLink = page.locator('a[href^="/publicaciones/"]').first()
      if (!(await firstPubLink.isVisible())) {
        return
      }
      await firstPubLink.click()
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      await clearStorageAndRefresh(page)
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Detalle Publicacion - localStorage.clear() + F5')
    })

    test('Perfil Profesor - Carga correctamente', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/profesor/test-id`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Profesor no encontrado')).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Perfil Profesor - Carga')
    })

    test('Perfil Profesor - F5 refresh sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/profesor/test-id`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Profesor no encontrado')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      await refreshPage(page)
      await expect(page.getByText('Profesor no encontrado')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Perfil Profesor - F5 refresh')
    })

    test('Perfil Profesor - localStorage.clear() + F5 sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/profesor/test-id`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Profesor no encontrado')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      await clearStorageAndRefresh(page)
      await expect(page.getByText('Profesor no encontrado')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Perfil Profesor - localStorage.clear() + F5')
    })

    test('Acerca de - Carga correctamente', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Sobre Nosotros')).toBeVisible({ timeout: 20000 })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      assertNoCriticalErrors(errors, 'Acerca de - Carga')
    })

    test('Acerca de - F5 refresh sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Sobre Nosotros')).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await refreshPage(page)
      await expect(page.getByText('Sobre Nosotros')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Acerca de - F5 refresh')
    })

    test('Acerca de - localStorage.clear() + F5 sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Sobre Nosotros')).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await clearStorageAndRefresh(page)
      await expect(page.getByText('Sobre Nosotros')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Acerca de - localStorage.clear() + F5')
    })
  })

  // ============================================================
  // AUTH TESTS
  // ============================================================
  test.describe('Autenticacion', () => {
    test('Login Admin - Acceso correcto', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await login(page)
      await expect(page.locator('text=Nuevo Proyecto').first()).toBeVisible({ timeout: 20000 })
      assertNoCriticalErrors(errors, 'Login Admin')
    })

    test('Ruta protegida sin login - Redirige a login', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL(`${BASE_URL}/login`, { timeout: 30000 })
      await expect(page.locator('h2:has-text("Iniciar Sesión")')).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Ruta protegida sin login')
    })
  })

  // ============================================================
  // DASHBOARD - CARGA DE PÁGINAS CON ERROR CAPTURE
  // ============================================================
  test.describe('Dashboard - Carga de paginas con error capture', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    test('Dashboard Home - Stats cargan sin error 400', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mis Proyectos').first()).toBeVisible({ timeout: 20000 })
      await expect(page.locator('main').getByText('Recursos').first()).toBeVisible({ timeout: 15000 })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      assertNoCriticalErrors(errors, 'Dashboard Home - Carga')
    })

    test('Dashboard - No hay errores de consola en stats', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(5000)

      const criticalErrors = errors.filter((e) =>
        e.includes('400') ||
        e.includes('PGRST100') ||
        e.includes('failed to parse filter') ||
        (e.includes('supabase') && e.includes('error'))
      )
      expect(criticalErrors).toHaveLength(0)
    })

    test('Dashboard Proyectos - Lista carga', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard/projects`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mis Proyectos').first()).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("Nuevo proyecto")')).toBeVisible({ timeout: 10000 })
      assertNoCriticalErrors(errors, 'Dashboard Proyectos - Carga')
    })

    test('Dashboard Recursos - Lista carga', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard/resources`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mis Recursos').first()).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("Nuevo recurso")')).toBeVisible({ timeout: 10000 })
      assertNoCriticalErrors(errors, 'Dashboard Recursos - Carga')
    })

    test('Dashboard Publicaciones - Lista carga', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard/publications`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mis Publicaciones').first()).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("Nueva publicación")')).toBeVisible({ timeout: 10000 })
      assertNoCriticalErrors(errors, 'Dashboard Publicaciones - Carga')
    })

    test('Dashboard Actividades - Lista carga', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard/activities`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mis Actividades').first()).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("Nueva actividad")')).toBeVisible({ timeout: 10000 })
      assertNoCriticalErrors(errors, 'Dashboard Actividades - Carga')
    })

    test('Dashboard Perfil - Carga correctamente', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard/profile`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mi Perfil').first()).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Dashboard Perfil - Carga')
    })

    test('Dashboard Admin - Panel de administracion', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard/admin`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Administración').first()).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Dashboard Admin - Carga')
    })
  })

  // ============================================================
  // F5 REFRESH - SESION PERSISTE EN TODAS LAS PÁGINAS
  // ============================================================
  test.describe('F5 Refresh - Persistencia de sesion en todas las paginas', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    const dashboardRoutes = [
      { name: 'Dashboard Home', path: '/dashboard', verify: 'Mis Proyectos' },
      { name: 'Dashboard Proyectos', path: '/dashboard/projects', verify: 'Mis Proyectos' },
      { name: 'Dashboard Recursos', path: '/dashboard/resources', verify: 'Mis Recursos' },
      { name: 'Dashboard Publicaciones', path: '/dashboard/publications', verify: 'Mis Publicaciones' },
      { name: 'Dashboard Actividades', path: '/dashboard/activities', verify: 'Mis Actividades' },
      { name: 'Dashboard Perfil', path: '/dashboard/profile', verify: 'Mi Perfil' },
      { name: 'Dashboard Admin', path: '/dashboard/admin', verify: 'Administración' },
    ]

    for (const route of dashboardRoutes) {
      test(`F5 en ${route.name} - Session persiste`, async ({ page }) => {
        const errors: string[] = []
        attachErrorCollector(page, errors)

        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('main').getByText(route.verify).first()).toBeVisible({ timeout: 20000 })
        await page.waitForTimeout(2000)

        await refreshPage(page)
        await expect(page.locator('main').getByText(route.verify).first()).toBeVisible({ timeout: 15000 })
        await page.waitForTimeout(1000)
        assertNoCriticalErrors(errors, `F5 ${route.name}`)
      })

      test(`F5 en ${route.name} - localStorage.clear() redirige a login`, async ({ page }) => {
        const errors: string[] = []
        attachErrorCollector(page, errors)

        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('main').getByText(route.verify).first()).toBeVisible({ timeout: 20000 })
        await page.waitForTimeout(2000)

        await clearStorageAndRefresh(page)
        await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 15000 })
        await expect(page.locator('h2:has-text("Iniciar Sesión")')).toBeVisible({ timeout: 15000 })
        assertNoCriticalErrors(errors, `F5 ${route.name} localStorage.clear`)
      })
    }

    test('F5 en Dashboard - No hay errores de consola criticos tras refresh', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      await page.waitForTimeout(3000)

      const criticalErrors = errors.filter((e) =>
        e.includes('400') ||
        e.includes('PGRST100') ||
        e.includes('failed to parse filter') ||
        (e.includes('supabase') && e.includes('error'))
      )
      expect(criticalErrors).toHaveLength(0)
    })
  })

  // ============================================================
  // LOCALSTORAGE.CLEAR() ENTRE SECCIONES - SIMULAR PRIMERA ENTRADA
  // ============================================================
  test.describe('localStorage.clear() - Simular primera entrada', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    test('Dashboard tras localStorage.clear() (sin sessionStorage.clear) - Session persiste', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mis Proyectos').first()).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await page.evaluate(() => localStorage.clear())
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      await expect(page.locator('main').getByText('Mis Proyectos').first()).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'localStorage.clear solo')
    })

    test('Dashboard tras localStorage.clear() + sessionStorage.clear() - Redirige a login', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mis Proyectos').first()).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 15000 })
      await expect(page.locator('h2:has-text("Iniciar Sesión")')).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'localStorage.clear + sessionStorage.clear')
    })

    test('Navegacion entre secciones tras localStorage.clear() - Sin errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/dashboard/publications`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main').getByText('Mis Publicaciones').first()).toBeVisible({ timeout: 20000 })
      await page.waitForTimeout(2000)

      await page.evaluate(() => localStorage.clear())
      await page.goto(`${BASE_URL}/dashboard/projects`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      await expect(page.locator('main').getByText('Mis Proyectos').first()).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'Navegacion localStorage.clear')
    })

    test('Public Pages - localStorage.clear() entre secciones no causa errores', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Ciencias Naturales y Tecnología', { timeout: 20000 })
      await page.waitForTimeout(2000)
      assertNoCriticalErrors(errors, 'Home carga')

      await clearStorage(page)
      await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      await expect(page.getByText('Sobre Nosotros')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      assertNoCriticalErrors(errors, 'About tras localStorage.clear')
    })
  })

  // ============================================================
  // CRUD - PUBLICACIONES
  // ============================================================
  test.describe('CRUD - Publicaciones', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    test('Crear publicacion - Llena formulario y verifica en lista', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      const uniqueTitle = `Publicacion QA Test - ${Date.now()}`

      await page.goto(`${BASE_URL}/dashboard/publications/new`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Crear nueva publicación')).toBeVisible({ timeout: 20000 })

      const titleInput = page.locator('label:has-text("Título") + div input').first()
      await titleInput.fill(uniqueTitle)

      const excerptTextarea = page.locator('label:has-text("Extracto") + textarea').first()
      await excerptTextarea.fill('Extracto de prueba para QA')

      const contentTextarea = page.locator('label:has-text("Contenido") + textarea').first()
      await contentTextarea.fill('Contenido completo de la publicacion de prueba para QA')

      await page.locator('label:has-text("Publicado")').first().locator('input[type="checkbox"]').check()

      await page.click('button:has-text("Crear publicación")')

      await page.waitForURL(`${BASE_URL}/dashboard/publications`, { timeout: 60000 })
      await expect(page.locator('main').getByText('Mis Publicaciones').first()).toBeVisible({ timeout: 15000 })
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      await page.waitForTimeout(3000)

      await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Crear publicacion')
    })

test('Editar publicacion - Modifica titulo y verifica en lista', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      const uniqueTitle = `Publicacion Editar QA - ${Date.now()}`
      const editedTitle = `Publicacion Editar QA (Editada) - ${Date.now()}`

      await page.goto(`${BASE_URL}/dashboard/publications/new`, { waitUntil: 'domcontentloaded' })

      const titleInput = page.locator('label:has-text("Título") + div input').first()
      await titleInput.fill(uniqueTitle)

      const excerptTextarea = page.locator('label:has-text("Extracto") + textarea').first()
      await excerptTextarea.fill('Extracto original')

      const contentTextarea = page.locator('label:has-text("Contenido") + textarea').first()
      await contentTextarea.fill('Contenido original')

await page.click('button:has-text(" Crear publicación")')
      await page.waitForURL(`${BASE_URL}/dashboard/publications`, { timeout: 60000 })
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      const card = page.locator('.bg-white.rounded-2xl').filter({ hasText: uniqueTitle }).first()
      await card.locator('a[href*="/edit"]').click()

      await page.waitForLoadState('networkidle', { timeout: 15000 })
      await page.waitForTimeout(3000)
      await expect(page.getByRole('heading', { name: 'Editar publicación' })).toBeVisible({ timeout: 15000 })

      const editTitleInput = page.locator('label:has-text("Título") + div input').first()
      await expect(editTitleInput).toBeVisible({ timeout: 15000 })
      await editTitleInput.fill(editedTitle)

      await page.getByRole('button', { name: 'Actualizar publicación' }).click()
      await page.waitForURL(`${BASE_URL}/dashboard/publications`, { timeout: 60000 })
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      await page.waitForTimeout(3000)
      await expect(page.getByText(editedTitle).first()).toBeVisible({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Editar publicacion')
    })

    test('Eliminar publicacion - Crea y elimina, verifica desaparicion', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      const uniqueTitle = `Publicacion Eliminar QA - ${Date.now()}`

      await page.goto(`${BASE_URL}/dashboard/publications/new`, { waitUntil: 'domcontentloaded' })

      const titleInput = page.locator('label:has-text("Título") + div input').first()
      await titleInput.fill(uniqueTitle)

      const excerptTextarea = page.locator('label:has-text("Extracto") + textarea').first()
      await excerptTextarea.fill('Extracto a eliminar')

      const contentTextarea = page.locator('label:has-text("Contenido") + textarea').first()
      await contentTextarea.fill('Contenido a eliminar')

      await page.click('button:has-text("Crear publicación")')
      await page.waitForURL(`${BASE_URL}/dashboard/publications`, { timeout: 60000 })
      await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      const card = page.locator('.bg-white.rounded-2xl').filter({ hasText: uniqueTitle }).first()
      await card.locator('button').first().click()

      await expect(page.getByText('Eliminar publicación')).toBeVisible({ timeout: 10000 })
      await page.click('button:has-text("Eliminar")')

      await page.waitForTimeout(5000)
      await page.waitForLoadState('networkidle', { timeout: 30000 })
      await page.waitForTimeout(3000)
      await expect(page.locator('h3').filter({ hasText: uniqueTitle }).first()).toBeHidden({ timeout: 15000 })
      assertNoCriticalErrors(errors, 'Eliminar publicacion')
    })
  })

  // ============================================================
  // CRUD - PERFIL PROFESOR
  // ============================================================
  test.describe('CRUD - Perfil Profesor', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
    })

    test('Modificar perfil - Cambia bio y especializacion, persiste tras refresh', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      const testBio = `Bio de prueba QA - ${Date.now()}`

      await page.goto(`${BASE_URL}/dashboard/profile`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Mi Perfil' })).toBeVisible({ timeout: 20000 })
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      // Fill both name and bio to ensure form is valid
      const nameInput = page.locator('label:has-text("Nombre completo") + div input').first()
      await nameInput.fill(`Prof. QA Test ${Date.now()}`)

      await page.fill('textarea[placeholder*="experiencia"]', testBio, { force: true })

      await page.waitForTimeout(1000)

      await page.click('button:has-text("Guardar cambios")')
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)
      assertNoCriticalErrors(errors, 'Modificar perfil - submit')

      await refreshPage(page)
      await expect(page.getByRole('heading', { name: 'Mi Perfil' })).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      const bioAfterReload = await page.locator('textarea[placeholder*="experiencia"]').inputValue()

      expect(bioAfterReload).toContain(testBio)
      assertNoCriticalErrors(errors, 'Modificar perfil - refresh')
    })

    test('Modificar nombre completo - Persistencia tras refresh', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      const testFullName = `Prof. QA Test ${Date.now()}`

      await page.goto(`${BASE_URL}/dashboard/profile`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Mi Perfil' })).toBeVisible({ timeout: 20000 })
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      const nameInput = page.locator('label:has-text("Nombre completo") + div input').first()
      await nameInput.clear()
      await nameInput.fill(testFullName)

      await page.click('button:has-text("Guardar cambios")')
      await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)
      assertNoCriticalErrors(errors, 'Modificar nombre - submit')

      await refreshPage(page)
      await expect(page.getByRole('heading', { name: 'Mi Perfil' })).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(2000)

      const nameAfterReload = await page.locator('label:has-text("Nombre completo") + div input').first().inputValue()
      expect(nameAfterReload).toContain(testFullName)
      assertNoCriticalErrors(errors, 'Modificar nombre - refresh')
    })
  })

  // ============================================================
  // FIX RELATED PROJECTS - NO ERROR 400 EN DETALLE PROYECTO
  // ============================================================
  test.describe('Fix RelatedProjects - No error 400 en detalle proyecto', () => {
    test('Detalle proyecto publico - RelatedProjects sin error 400', async ({ page }) => {
      const errors: string[] = []
      attachErrorCollector(page, errors)

      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' })
      const firstProjectLink = page.locator('a[href^="/projects/"]').first()
      if (await firstProjectLink.isVisible()) {
        await firstProjectLink.click()
        await page.waitForTimeout(4000)

        const relatedErrors = errors.filter((e) =>
          e.includes('PGRST100') ||
          e.includes('failed to parse filter') ||
          e.includes('technologies.cs') ||
          e.includes('Error 400')
        )
        expect(relatedErrors).toHaveLength(0)
      }
    })
  })

  // ============================================================
  // RESPONSIVE
  // ============================================================
  test.describe('Responsive - Movil', () => {
    test('Navbar movil - Home visible', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('nav button[aria-label="Abrir menú"]')).toBeVisible()
    })
  })
})
