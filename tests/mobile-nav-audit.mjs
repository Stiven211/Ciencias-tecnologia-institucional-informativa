// Revisa la navegación en móvil sin el toast tapando la vista,
// y comprueba si hay forma de abrir el menú lateral.
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const BASE = process.argv[2]
const EMAIL = process.env.QA_ADMIN_EMAIL
const PASSWORD = process.env.QA_ADMIN_PASSWORD

const main = async () => {
  await mkdir('qa-screens', { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await ctx.newPage()

  await page.goto(BASE + '/login', { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(2000)
  await page.locator('input[type="email"]').first().fill(EMAIL)
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45000 }).catch(() => {})

  // Dejar que el toast de bienvenida desaparezca
  await page.waitForTimeout(6000)
  await page.screenshot({ path: 'qa-screens/m2-dashboard-sin-toast.png', fullPage: true })

  console.log('=== ¿hay algo para abrir el menú? ===')
  const candidates = await page.evaluate(() => {
    const found = []
    const walk = (el, depth) => {
      for (const c of el.children) {
        const label = (
          c.getAttribute('aria-label') || c.getAttribute('title') ||
          c.getAttribute('data-testid') || (c.innerText || '').trim().slice(0, 30)
        )
        if (c.tagName === 'BUTTON' && c.offsetParent !== null) {
          found.push(`button "${label}" (${Math.round(c.getBoundingClientRect().width)}x${Math.round(c.getBoundingClientRect().height)})`)
        }
        walk(c, depth + 1)
      }
    }
    walk(document.body, 0)
    return found.slice(0, 12)
  })
  candidates.forEach((c) => console.log('  ' + c))

  console.log('\n=== botones en el viewport (top 120px) ===')
  const top = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('button, a').forEach((b) => {
      const r = b.getBoundingClientRect()
      if (r.top < 130 && r.height > 0 && r.width > 0 && r.left < 375) {
        out.push(`${b.tagName} "${(b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 24)}" x=${Math.round(r.left)} w=${Math.round(r.width)}`)
      }
    })
    return out.slice(0, 10)
  })
  top.forEach((t) => console.log('  ' + t))

  // Probar si se puede llegar a un CRUD sin el sidebar
  console.log('\n=== intentar ir a /dashboard/projects por URL directa ===')
  await page.goto(BASE + '/dashboard/projects', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const heading = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 150)
  console.log('  ' + heading)
  await page.screenshot({ path: 'qa-screens/m2-mis-proyectos.png', fullPage: true })

  await browser.close()
}
main().catch((e) => { console.error('fallo:', e.message); process.exit(1) })
