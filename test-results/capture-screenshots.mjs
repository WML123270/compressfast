// Capture Product Hunt screenshots
import { chromium } from 'playwright';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(__dirname, '..', 'docs', 'ph-screenshots');
const TEST_IMG = path.join(__dirname, 'test-image.png');
const BASE = 'http://localhost:3000';

async function screenshot(page, name, fullPage = false) {
  const filePath = path.join(SHOT_DIR, name);
  await page.screenshot({ path: filePath, fullPage });
  console.log('  ✅ ' + name);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ===== 1. Hero page (English, light mode) =====
  console.log('1. Hero page');
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page1 = await ctx1.newPage();
  await page1.goto(BASE + '/en', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(2000);
  await screenshot(page1, '01-hero.png', true);
  await ctx1.close();

  // ===== 2. Compression interface with AVIF =====
  console.log('2. Compression with AVIF');
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto(BASE + '/en', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(2000);

  // Upload two images
  const fi = page2.locator('input[type="file"]');
  await fi.first().setInputFiles([TEST_IMG, TEST_IMG]);
  await page2.waitForTimeout(2000);

  // Select AVIF format
  const avifBtn = page2.locator('button', { hasText: 'AVIF' });
  if (await avifBtn.count() > 0) {
    await avifBtn.click();
    await page2.waitForTimeout(500);
  }
  await screenshot(page2, '02-compression-avif.png', true);
  await ctx2.close();

  // ===== 3. Before/After comparison =====
  console.log('3. Before/After comparison');
  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page3 = await ctx3.newPage();
  await page3.goto(BASE + '/en', { waitUntil: 'networkidle' });
  await page3.waitForTimeout(1500);

  const fi3 = page3.locator('input[type="file"]');
  await fi3.first().setInputFiles(TEST_IMG);
  await page3.waitForTimeout(1500);

  // Compress first
  await page3.locator('button', { hasText: 'Compress All' }).click();
  try {
    await page3.waitForFunction(() => document.body.innerText.includes('Reduced'), { timeout: 60000 });
  } catch {}
  await page3.waitForTimeout(1000);

  // Click preview to show comparison
  const previewBtn = page3.locator('button', { hasText: 'Preview' });
  if (await previewBtn.count() > 0) {
    await previewBtn.first().click();
    await page3.waitForTimeout(1000);
  }
  await screenshot(page3, '03-before-after.png', true);
  await ctx3.close();

  // ===== 4. Pro page =====
  console.log('4. Pro page');
  const ctx4 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page4 = await ctx4.newPage();
  await page4.goto(BASE + '/en/pro', { waitUntil: 'networkidle' });
  await page4.waitForTimeout(2000);
  await screenshot(page4, '04-pro-page.png', true);
  await ctx4.close();

  // ===== 5. Dark mode + VS page =====
  console.log('5. Dark mode');
  const ctx5 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page5 = await ctx5.newPage();
  await page5.goto(BASE + '/en', { waitUntil: 'networkidle' });
  await page5.waitForTimeout(1500);

  // Enable dark mode
  await page5.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page5.waitForTimeout(500);
  await screenshot(page5, '05-dark-mode.png', true);

  // Also capture VS TinyPNG page in dark
  await page5.goto(BASE + '/en/vs-tinypng', { waitUntil: 'networkidle' });
  await page5.waitForTimeout(1500);
  await page5.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page5.waitForTimeout(500);
  await screenshot(page5, '06-vs-tinypng-dark.png', true);
  await ctx5.close();

  // ===== Thumbnail =====
  console.log('6. Thumbnail (640x320)');
  const ctx6 = await browser.newContext({ viewport: { width: 640, height: 320 } });
  const page6 = await ctx6.newPage();
  await page6.goto(BASE + '/en', { waitUntil: 'networkidle' });
  await page6.waitForTimeout(1000);
  await page6.evaluate(() => {
    // Hide header for clean thumbnail
    const header = document.querySelector('header');
    if (header) header.style.display = 'none';
  });
  await page6.waitForTimeout(500);
  await screenshot(page6, 'thumbnail.png', false);
  await ctx6.close();

  console.log('\n✅ All screenshots captured!');
  await browser.close();
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
