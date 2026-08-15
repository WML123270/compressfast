/**
 * 抓取线上站真实 UI 截图，用于 AlternativeTo 提交
 * 输出到 test-results/alternativeto/
 */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'https://compressfast.site';

async function main() {
  const outDir = 'test-results/alternativeto';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-proxy-server'],
  });

  // 1. 首页 hero（主压缩器 UI）
  const p1 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p1.goto(`${BASE}/en`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p1.waitForTimeout(2500);
  await p1.screenshot({ path: `${outDir}/01-homepage-hero.png` });
  console.log('✓ 01-homepage-hero.png');
  await p1.close();

  // 2. 首页整页（展示工具页网格 + FAQ）
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p2.goto(`${BASE}/en`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p2.waitForTimeout(3000);
  await p2.screenshot({ path: `${outDir}/02-homepage-full.png`, fullPage: true });
  console.log('✓ 02-homepage-full.png');
  await p2.close();

  // 3. vs-tinypng 对比页（可信度背书）
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await p3.goto(`${BASE}/en/vs-tinypng`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p3.waitForTimeout(2500);
  await p3.screenshot({ path: `${outDir}/03-vs-tinypng.png`, fullPage: true });
  console.log('✓ 03-vs-tinypng.png');
  await p3.close();

  await browser.close();
  console.log('✅ 完成，输出到', outDir);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
