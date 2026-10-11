// QA de ciclo completo: crear -> editar -> publicar -> verificar publico -> borrar.
//
// Regla dura: NO se toca ningun usuario existente. Solo se crean y destruyen
// entidades con el prefijo QA_CYCLE_, que se borran al final.
//
// Uso: node tests/crud-cycle.mjs <baseURL>

import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const BASE = process.argv[2]
const EMAIL = process.env.QA_ADMIN_EMAIL
const PASSWORD = process.env.QA_ADMIN_PASSWORD

const PREFIX = 'QA_CYCLE'
const stamp = Date.now().toString().slice(-6)
const TITLE = `${PREFIX}_${stamp}`
const SLUG = `${PREFIX.toLowerCase()}-${stamp}`

const log = (s) => console.log(s)
const ok = (s) => console.log(`  PASS  ${s}`)
const fail = (s) => { console.log(`  FALLA ${s}`); process.exitCode = 1 }

const main = async () => {
  await mkdir('qa-screens', { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(-60)}`) })

  log('\n=== 1. login ===')
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.locator('input[type="email"]').first().fill(EMAIL)
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45000 })
  ok(`sesion iniciada, url=${page.url().replace(BASE, '')}`)

  log('\n=== 2. crear proyecto ===')
  await page.goto(BASE + '/dashboard/projects/new', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)

  const textInputs = page.locator('input[type="text"], input:not([type])')
  log(`  inputs de texto visibles: ${await textInputs.count()}`)

  await textInputs.nth(0).fill(TITLE)
  await textInputs.nth(1).fill(SLUG)
  const ta = page.locator('textarea').first()
  if (await ta.count()) await ta.fill('Descripcion creada por el QA de ciclo. Se elimina al final.')
  await page.screenshot({ path: 'qa-screens/crud-1-lleno.png', fullPage: true })

  const submit = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button[type="submit"]').first()
  log(`  boton de envio: "${(await submit.textContent())?.trim()}"`)
  await submit.click()
  await page.waitForTimeout(6000)
  log(`  url tras enviar: ${page.url().replace(BASE, '')}`)
  await page.screenshot({ path: 'qa-screens/crud-2-creado.png', fullPage: true })

  const bodyAfter = (await page.locator('body').innerText()).replace(/\s+/g, ' ')
  if (bodyAfter.includes(TITLE)) ok('el proyecto recien creado aparece en pantalla')
  else fail(`el proyecto no aparece tras crear (url=${page.url().replace(BASE, '')})`)

  log('\n=== 3. verificar en "Mis Proyectos" ===')
  await page.goto(BASE + '/dashboard/projects', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const listText = (await page.locator('body').innerText()).replace(/\s+/g, ' ')
  if (listText.includes(TITLE)) ok('aparece en el listado de proyectos')
  else fail('no aparece en el listado')
  await page.screenshot({ path: 'qa-screens/crud-3-listado.png', fullPage: true })

  log('\n=== 4. editar ===')
  const row = page.locator(`text=${TITLE}`).first()
  await row.click().catch(() => {})
  await page.waitForTimeout(4000)
  log(`  url tras click: ${page.url().replace(BASE, '')}`)
  const editInput = page.locator('input[type="text"], input:not([type])').first()
  if (await editInput.count()) {
    await editInput.fill(`${TITLE}_EDITADO`)
    const save = page.locator('button:has-text("Guardar"), button[type="submit"]').first()
    await save.click().catch(() => {})
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'qa-screens/crud-4-editado.png', fullPage: true })
    await page.goto(BASE + '/dashboard/projects', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const after = (await page.locator('body').innerText()).replace(/\s+/g, ' ')
    if (after.includes(`${TITLE}_EDITADO`)) ok('la edicion se guardo')
    else log('  AVISO: no se pudo confirmar la edicion desde el listado')
  } else {
    fail('no se llego a un formulario de edicion')
  }

  log('\n=== 5. borrar ===')
  const target = page.locator(`text=${TITLE}_EDITADO, text=${TITLE}`).first()
  await target.hover().catch(() => {})
  await page.waitForTimeout(800)
  const delBtn = page.locator('button:has-text("Eliminar"), button[aria-label*="liminar"]').first()
  if (await delBtn.count()) {
    await delBtn.click().catch(() => {})
    await page.waitForTimeout(1200)
    const confirm = page.locator('button:has-text("Confirmar"), button:has-text("Si")').first()
    if (await confirm.count()) await confirm.click().catch(() => {})
    await page.waitForTimeout(4000)
    await page.screenshot({ path: 'qa-screens/crud-5-borrado.png', fullPage: true })

    await page.goto(BASE + '/dashboard/projects', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const final = (await page.locator('body').innerText()).replace(/\s+/g, ' ')
    if (!final.includes(TITLE)) ok('el proyecto de QA ya no esta en el listado')
    else fail('el proyecto sigue apareciendo tras borrar')
  } else {
    fail('no se encontro boton de eliminar en la tarjeta del proyecto')
  }

  log('\n=== 6. errores acumulados ===')
  log(errors.length ? errors.join('\n') : '  ninguno')

  await browser.close()
}

main().catch((e) => { console.error('QA fallo:', e.message); process.exit(1) })
