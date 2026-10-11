// QA de experiencia del docente: recorre el flujo real, crea contenido y
// captura pantallas en tres anchos. No es un test de aserciones, es un
// auditor: deja evidencia en qa-screens/ y reporta errores de consola.
//
// Uso:  node tests/ux-audit.mjs [baseURL]
// Credenciales por entorno, nunca hardcodeadas.

import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = process.argv[2] || 'https://ciencias-tecnologia-institucional-i.vercel.app'
const OUT = 'qa-screens'
const EMAIL = process.env.QA_ADMIN_EMAIL
const PASSWORD = process.env.QA_ADMIN_PASSWORD

if (!EMAIL || !PASSWORD) {
  console.error('Faltan QA_ADMIN_EMAIL y QA_ADMIN_PASSWORD')
  process.exit(1)
}

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

const consoleIssues = []
const networkIssues = []

const stamp = Date.now().toString().slice(-6)
const slug = `qa-ux-${stamp}`

async function shoot(page, name, vp) {
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(OUT, `${vp}-${name}.png`), fullPage: true })
}

const main = async () => {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()

    page.on('console', (m) => {
      if (m.type() === 'error') consoleIssues.push(`[${vp.name}] ${m.text().slice(0, 300)}`)
    })
    page.on('response', (r) => {
      if (r.status() >= 400) networkIssues.push(`[${vp.name}] ${r.status()} ${r.url().slice(0, 140)}`)
    })

    console.log(`\n=== ${vp.name} (${vp.width}px) ===`)

    // ---- público ----
    for (const [path, name] of [
      ['/', 'home'],
      ['/projects', 'catalogo-proyectos'],
      ['/publications', 'catalogo-publicaciones'],
      ['/login', 'login'],
      ['/register', 'registro'],
    ]) {
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
      await shoot(page, name, vp.name)
    }

    // ---- login ----
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    const emailInput = page.locator('input[type="email"]').first()
    const passInput = page.locator('input[type="password"]').first()
    await emailInput.fill(EMAIL)
    await passInput.fill(PASSWORD)
    await shoot(page, 'login-lleno', vp.name)
    await page.locator('button[type="submit"]').first().click()

    await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45000 }).catch(() => {
      console.log(`  ! no salio de /login en ${vp.name}`)
    })
    await page.waitForTimeout(2500)
    await shoot(page, 'dashboard', vp.name)

    if (vp.name !== 'mobile') {
      for (const [path, name] of [
        ['/dashboard/projects', 'mis-proyectos'],
        ['/dashboard/projects/new', 'nuevo-proyecto'],
        ['/dashboard/resources', 'mis-recursos'],
        ['/dashboard/publications', 'mis-publicaciones'],
        ['/dashboard/activities', 'mis-actividades'],
        ['/dashboard/profile', 'mi-perfil'],
        ['/dashboard/teachers/new', 'registrar-profesor'],
        ['/dashboard/admin', 'panel-admin'],
      ]) {
        await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
        await shoot(page, name, vp.name)
      }
    }

    // ---- creación real de contenido ----
    if (vp.name === 'desktop') {
      await page.goto(BASE + '/dashboard/projects/new', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2500)

      const inputs = page.locator('input:visible, textarea:visible')
      const count = await inputs.count()
      console.log(`  campos visibles en el formulario: ${count}`)

      await inputs.nth(0).fill(`QA UX ${stamp}`)
      const textareas = page.locator('textarea:visible')
      if (await textareas.count() > 0) {
        await textareas.first().fill('Registro creado por la auditoría de experiencia de uso. Se elimina al final.')
      }
      await shoot(page, 'formulario-proyecto-lleno', vp.name)

      // No se envía: el objetivo es ver el estado del formulario, no ensuciar producción.
      const buttons = await page.locator('button:visible').allTextContents()
      console.log(`  acciones disponibles: ${buttons.filter(Boolean).join(' | ').slice(0, 200)}`)
    }

    await ctx.close()
  }

  await browser.close()

  const report = {
    base: BASE,
    slug,
    when: new Date().toISOString(),
    consoleErrors: [...new Set(consoleIssues)],
    httpErrors: [...new Set(networkIssues)],
  }
  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2))

  console.log('\n===== ERRORES DE CONSOLA =====')
  console.log(report.consoleErrors.length ? report.consoleErrors.join('\n') : 'ninguno')
  console.log('\n===== RESPUESTAS HTTP >= 400 =====')
  console.log(report.httpErrors.length ? [...new Set(report.httpErrors)].join('\n') : 'ninguna')
  console.log(`\ncapturas en ${OUT}/`)
}

main().catch((e) => {
  console.error('QA fallo:', e.message)
  process.exit(1)
})
