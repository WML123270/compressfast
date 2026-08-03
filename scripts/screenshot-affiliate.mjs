import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

await page.goto('http://localhost:3000/en/affiliates', { waitUntil: 'domcontentloaded', timeout: 10000 })

// Click "Sign Up" tab
await page.click('button:has-text("Sign Up")')
await page.waitForTimeout(300)

// Fill form
const email = 'demo' + Date.now() + '@test.com'
await page.fill('input[type="text"]', 'Demo User')
const inputs = await page.$$('input[type="email"]')
await inputs[0].fill(email)
if (inputs.length > 1) await inputs[1].fill(email)

// Click Join button
await page.click('button:has-text("Join")')
await page.waitForTimeout(2000)

// Screenshot
await page.screenshot({ path: 'C:/Users/Administrator/Desktop/affiliate-dashboard.png', fullPage: true })
console.log('Saved!')
await browser.close()
