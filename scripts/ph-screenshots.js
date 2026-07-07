const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const outDir = 'docs/ph-screenshots';
  require('fs').mkdirSync(outDir, { recursive: true });

  // Screenshot 1: Homepage Hero
  const page1 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page1.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });
  await page1.screenshot({ path: `${outDir}/01-hero.png`, fullPage: false });
  console.log('1/5 - Hero');
  await page1.close();

  // Screenshot 2: Pro page
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page2.goto('http://localhost:3000/en/pro', { waitUntil: 'networkidle' });
  await page2.screenshot({ path: `${outDir}/02-pro-page.png`, fullPage: false });
  console.log('2/5 - Pro page');
  await page2.close();

  // Screenshot 3: VS TinyPNG comparison
  const page3 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page3.goto('http://localhost:3000/en/vs-tinypng', { waitUntil: 'networkidle' });
  await page3.screenshot({ path: `${outDir}/03-vs-tinypng.png`, fullPage: false });
  console.log('3/5 - VS page');
  await page3.close();

  // Screenshot 4: Dark mode
  const page4 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page4.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });
  await page4.evaluate(() => { document.documentElement.classList.add('dark'); });
  await page4.waitForTimeout(300);
  await page4.screenshot({ path: `${outDir}/04-dark-mode.png`, fullPage: false });
  console.log('4/5 - Dark mode');
  await page4.close();

  // Screenshot 5: Mobile
  const page5 = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page5.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });
  await page5.screenshot({ path: `${outDir}/05-mobile.png`, fullPage: true });
  console.log('5/5 - Mobile');
  await page5.close();

  await browser.close();
  console.log('Done! Screenshots saved to docs/ph-screenshots/');
})();
