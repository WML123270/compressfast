/**
 * 截取产品截图用于导航站提交
 */
const { chromium } = require('playwright');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const outDir = 'test-results/screenshots';

  // 1. PC 首页 - 浅色模式
  console.log('1. PC 首页 (浅色)...');
  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await ctx1.newPage();
  await page1.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  // Set light mode
  await page1.evaluate(() => { localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); });
  await sleep(500);
  await page1.screenshot({ path: outDir + '/01-homepage-light.png', fullPage: true });
  console.log('   ✓ 01-homepage-light.png');
  await ctx1.close();

  // 2. PC 首页 - 暗色模式
  console.log('2. PC 首页 (暗色)...');
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  await page2.evaluate(() => { localStorage.setItem('theme', 'dark'); document.documentElement.classList.add('dark'); });
  await sleep(500);
  await page2.screenshot({ path: outDir + '/02-homepage-dark.png', fullPage: true });
  console.log('   ✓ 02-homepage-dark.png');
  await ctx2.close();

  // 3. 移动端首页
  console.log('3. 移动端首页...');
  const ctx3 = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const page3 = await ctx3.newPage();
  await page3.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  await page3.evaluate(() => { localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); });
  await sleep(500);
  await page3.screenshot({ path: outDir + '/03-mobile.png', fullPage: true });
  console.log('   ✓ 03-mobile.png');
  await ctx3.close();

  // 4. 对比页 vs-tinypng
  console.log('4. 对比页...');
  const ctx4 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page4 = await ctx4.newPage();
  await page4.goto('http://localhost:3000/vs-tinypng', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  await page4.screenshot({ path: outDir + '/04-vs-tinypng.png', fullPage: true });
  console.log('   ✓ 04-vs-tinypng.png');
  await ctx4.close();

  await browser.close();
  console.log('\n✅ 截图完成！保存在 test-results/screenshots/');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
