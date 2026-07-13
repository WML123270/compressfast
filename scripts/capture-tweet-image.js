const { chromium } = require('playwright');
const path = require('path');

const HTML = 'file:///' + path.join(__dirname, 'tweet-comparison.html').replace(/\\/g, '/');
const OUT = path.join(__dirname, '..', 'test-results', 'tweet-day1.png');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  await page.goto(HTML, { waitUntil: 'networkidle' });
  // Wait for images to load
  await page.waitForTimeout(2000);
  await page.screenshot({ path: OUT, fullPage: false });

  console.log('✅', OUT);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
