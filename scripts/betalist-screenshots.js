/**
 * BetaList 截图 — 4:3 比例 (1200×900), 3 张
 */
const { chromium } = require('playwright');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const outDir = 'test-results/betalist';
  const BASE = 'https://compressfast.site';
  const W = 1200, H = 900; // 4:3

  // 1. 首页 — 工具界面（上传区+控件）
  console.log('1. 首页工具界面...');
  const ctx1 = await browser.newContext({ viewport: { width: W, height: H } });
  const page1 = await ctx1.newPage();
  await page1.goto(BASE + '/en', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);
  await page1.screenshot({ path: outDir + '/01-homepage-tool.png', fullPage: false });
  console.log('   ✓ 01-homepage-tool.png');
  await ctx1.close();

  // 2. 功能介绍页 — 产品亮点
  console.log('2. 功能介绍页...');
  const ctx2 = await browser.newContext({ viewport: { width: W, height: H } });
  const page2 = await ctx2.newPage();
  await page2.goto(BASE + '/en/tool', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);
  await page2.screenshot({ path: outDir + '/02-features.png', fullPage: false });
  console.log('   ✓ 02-features.png');
  await ctx2.close();

  // 3. Pro 购买页 — 功能对比表+定价
  console.log('3. Pro 功能对比...');
  const ctx3 = await browser.newContext({ viewport: { width: W, height: H } });
  const page3 = await ctx3.newPage();
  await page3.goto(BASE + '/en/pro', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);
  await page3.screenshot({ path: outDir + '/03-pro-pricing.png', fullPage: false });
  console.log('   ✓ 03-pro-pricing.png');
  await ctx3.close();

  await browser.close();
  console.log('\n✅ 3 张截图完成！保存在 test-results/betalist/');
  console.log('   (4:3 ratio, 1200×900)');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
