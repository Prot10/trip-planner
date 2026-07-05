/* Shared headless-Chrome infrastructure for the live-search modules
   (booking.mjs, places.mjs). One browser instance, lazily launched from
   the user's own Chrome/Edge/Brave install, closed after a couple of
   idle minutes. */

import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const CHROME_CANDIDATES = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/bin/microsoft-edge',
    '/usr/bin/brave-browser',
  ],
  win32: [
    `${process.env.PROGRAMFILES ?? 'C:\\Program Files'}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)'}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA ?? ''}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)'}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ],
}

export function findChrome() {
  const fromEnv = process.env.ULISSE_CHROME || process.env.CHROME_BIN
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  for (const p of CHROME_CANDIDATES[process.platform] ?? []) {
    if (p && existsSync(p)) return p
  }
  return null
}

/* one shared headless browser, closed after a couple of idle minutes */
let browserPromise = null
let idleTimer = null
const IDLE_MS = 120_000

export async function getBrowser() {
  if (!browserPromise) {
    const executablePath = findChrome()
    if (!executablePath) throw new Error('CHROME_NOT_FOUND')
    browserPromise = puppeteer
      .launch({
        executablePath,
        headless: 'new',
        args: ['--no-first-run', '--disable-blink-features=AutomationControlled', '--disable-gpu', '--lang=en-US'],
      })
      .then((b) => {
        b.on('disconnected', () => { browserPromise = null })
        return b
      })
      .catch((e) => { browserPromise = null; throw e })
  }
  clearTimeout(idleTimer)
  idleTimer = setTimeout(async () => {
    const p = browserPromise
    browserPromise = null
    try { (await p)?.close() } catch { /* already gone */ }
  }, IDLE_MS)
  return browserPromise
}

/* a page that passes bot checks: real-Chrome UA (the default headless one
   triggers degraded pages on Booking and Google alike) */
export async function newStealthPage(browser, { width = 1280, height = 1600 } = {}) {
  const page = await browser.newPage()
  const ua = (await browser.userAgent()).replace('HeadlessChrome', 'Chrome')
  await page.setUserAgent(ua)
  await page.setViewport({ width, height })
  return page
}
