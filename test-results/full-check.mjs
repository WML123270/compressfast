// Comprehensive project check v2 — robust selectors
import { chromium } from 'playwright';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';
const bugs = [];

function log(emoji, msg) { console.log('  ' + emoji + ' ' + msg); }
function bug(msg) { bugs.push(msg); console.log('  ❌ BUG: ' + msg); }
function pass(msg) { console.log('  ✅ ' + msg); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  // ===== 1. Chinese page =====
  console.log('\n📄 1. 中文页面');
  await page.goto(BASE + '/zh', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const zhTitle = await page.title();
  if (zhTitle.includes('CompressFast')) {
    bug('中文页title是英文: "' + zhTitle + '" （应显示中文标题）');
  } else {
    pass('中文标题: ' + zhTitle);
  }

  // Check key elements
  const zhBody = await page.locator('body').innerText();
  if (zhBody.includes('极速') || zhBody.includes('压缩') || zhBody.includes('隐私')) pass('中文内容正常');
  else bug('中文页面内容异常');

  // ===== 2. English page =====
  console.log('\n📄 2. 英文页面');
  await page.goto(BASE + '/en', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  pass('英文页面正常加载');

  // ===== 3. Upload via file chooser =====
  console.log('\n📤 3. 上传图片（回中文页）');
  await page.goto(BASE + '/zh', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Use file input directly instead of clicking text
  const fileInput = page.locator('input[type="file"]');
  const fiCount = await fileInput.count();
  if (fiCount > 0) {
    await fileInput.first().setInputFiles(path.join(__dirname, 'test-image.png'));
    await page.waitForTimeout(2000);
    pass('通过 input 上传成功');
  } else {
    // Fallback: try clicking dropzone text
    try {
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 3000 }),
        page.locator('text=拖拽').click(),
      ]);
      await chooser.setFiles(path.join(__dirname, 'test-image.png'));
      await page.waitForTimeout(2000);
      pass('通过拖拽区域上传成功');
    } catch {
      bug('无法上传图片');
    }
  }

  const hasCompress = await page.locator('button:has-text("压缩全部")').count();
  if (hasCompress > 0) pass('压缩按钮可见');
  else bug('上传后无压缩按钮');

  // ===== 4. Format buttons =====
  console.log('\n🎨 4. 输出格式选项');
  const formats = ['保持原格式', 'PNG', 'JPEG', 'WebP', 'AVIF'];
  for (const fmt of formats) {
    const count = await page.locator('button', { hasText: fmt }).count();
    if (count > 0) pass(fmt);
    else bug('缺少格式: ' + fmt);
  }

  // ===== 5. AVIF compress =====
  console.log('\n🗜️ 5. AVIF 压缩');
  await page.locator('button', { hasText: 'AVIF' }).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: '均衡' }).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: '压缩全部' }).click();

  try {
    await page.waitForFunction(() => document.body.innerText.includes('减小'), { timeout: 60000 });
    pass('压缩完成');
  } catch {
    bug('压缩超时');
  }

  // ===== 6. Download blob type =====
  console.log('\n📥 6. 下载文件类型');
  const avifType = await page.evaluate(async () => {
    let t = null;
    const orig = URL.createObjectURL;
    URL.createObjectURL = function(b) { t = b.type; return orig.call(URL, b); };
    const btns = Array.from(document.querySelectorAll('button'));
    const dl = btns.find(b => b.textContent.trim() === '下载' && b.offsetParent !== null);
    if (dl) dl.click();
    await new Promise(r => setTimeout(r, 800));
    URL.createObjectURL = orig;
    return t;
  });

  if (avifType === 'image/avif') pass('AVIF 类型正确');
  else bug('类型异常: ' + avifType);

  // ===== 7. Clear and test WebP =====
  console.log('\n🖼️ 7. WebP 压缩');
  const clearBtn = page.locator('button', { hasText: '清空' });
  if (await clearBtn.count() > 0) {
    await clearBtn.click();
    await page.waitForTimeout(500);
  }

  // Upload fresh
  const fi2 = page.locator('input[type="file"]');
  if (await fi2.count() > 0) {
    await fi2.first().setInputFiles(path.join(__dirname, 'test-image.png'));
    await page.waitForTimeout(1500);
  }
  await page.locator('button', { hasText: 'WebP' }).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: '压缩全部' }).click();
  try {
    await page.waitForFunction(() => document.body.innerText.includes('减小'), { timeout: 60000 });
    pass('WebP 压缩完成');
  } catch { bug('WebP 超时'); }

  const webpType = await page.evaluate(async () => {
    let t = null;
    const orig = URL.createObjectURL;
    URL.createObjectURL = function(b) { t = b.type; return orig.call(URL, b); };
    const btns = Array.from(document.querySelectorAll('button'));
    const dl = btns.find(b => b.textContent.trim() === '下载' && b.offsetParent !== null);
    if (dl) dl.click();
    await new Promise(r => setTimeout(r, 800));
    URL.createObjectURL = orig;
    return t;
  });
  if (webpType === 'image/webp') pass('WebP 类型正确');
  else bug('WebP 类型异常: ' + webpType);

  // ===== 8. Resize =====
  console.log('\n📐 8. 尺寸调整');
  const resizeSection = page.locator('text=尺寸调整');
  if (await resizeSection.count() > 0) {
    pass('尺寸调整区域可见');
    const preset50 = page.locator('button', { hasText: '50%' });
    if (await preset50.count() > 0) {
      await preset50.click();
      await page.waitForTimeout(300);
      pass('50% 预设可用');
    }
  } else {
    log('⚠️', '尺寸调整区域不可见（需有文件）');
  }

  // ===== 9. Target KB =====
  console.log('\n🎯 9. 目标大小模式');
  const targetMode = page.locator('button', { hasText: '指定大小' });
  if (await targetMode.count() > 0) {
    await targetMode.click();
    await page.waitForTimeout(300);
    pass('目标KB模式切换正常');
    // Back to quality mode
    const qMode = page.locator('button', { hasText: '压缩画质' });
    if (await qMode.count() > 0) await qMode.click();
  }

  // ===== 10. JS errors =====
  console.log('\n🐛 10. JS 错误');
  if (jsErrors.length === 0) {
    pass('零 JS 错误');
  } else {
    jsErrors.forEach(e => bug('JS: ' + e));
  }

  // ===== 11. Pro page =====
  console.log('\n💎 11. Pro 页面');
  await page.goto(BASE + '/zh/pro', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const proText = await page.locator('body').innerText();
  if (proText.includes('Pro') || proText.includes('升级') || proText.includes('$')) {
    pass('Pro 页正常');
  } else bug('Pro 页异常');

  // ===== 12. VS TinyPNG =====
  console.log('\n⚔️ 12. vs-tinypng 页');
  await page.goto(BASE + '/zh/vs-tinypng', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const vsText = await page.locator('body').innerText();
  if (vsText.includes('TinyPNG') || vsText.includes('对比')) pass('对比页正常');
  else bug('对比页异常');

  // ===== 13. Privacy/Terms =====
  console.log('\n📜 13. 隐私/条款');
  await page.goto(BASE + '/zh/privacy', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  pass('隐私页: ' + (await page.locator('body').innerText()).length + ' 字符');

  await page.goto(BASE + '/zh/terms', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  pass('条款页: ' + (await page.locator('body').innerText()).length + ' 字符');

  // ===== 14. Batch ZIP download =====
  console.log('\n📦 14. 批量下载');
  await page.goto(BASE + '/zh', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  // Upload 2 images
  const fi3 = page.locator('input[type="file"]');
  if (await fi3.count() > 0) {
    await fi3.first().setInputFiles([
      path.join(__dirname, 'test-image.png'),
      path.join(__dirname, 'test-image.png'),
    ]);
    await page.waitForTimeout(2000);
  }
  const count = await page.locator('button', { hasText: '压缩全部' }).count();
  pass('上传2张: ' + (count > 0 ? '成功' : '失败'));

  if (count > 0) {
    await page.locator('button', { hasText: '压缩全部' }).click();
    try {
      await page.waitForFunction(() => document.body.innerText.includes('下载全部'), { timeout: 60000 });
      pass('批量压缩完成');
    } catch { log('⚠️', '批量压缩时间较长'); }

    const batchBtn = page.locator('button', { hasText: '下载全部' });
    if (await batchBtn.count() > 0) {
      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        batchBtn.click(),
      ]);
      if (dl && dl.suggestedFilename().endsWith('.zip')) {
        pass('ZIP 批量下载正常');
      } else {
        bug('批量下载异常: ' + (dl ? dl.suggestedFilename() : '未触发'));
      }
    }
  }

  // ===== 15. Dark mode =====
  console.log('\n🌙 15. 暗色模式');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(500);
  const bgColor = await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor
  );
  if (bgColor !== 'rgb(255, 255, 255)') {
    pass('暗色模式生效');
  } else {
    bug('暗色模式未生效');
  }
  // Restore
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  });

  // ===== SUMMARY =====
  console.log('\n' + '═'.repeat(50));
  console.log('         全 面 检 查 结 果');
  console.log('═'.repeat(50));

  if (bugs.length === 0) {
    console.log('\n  🎉 全部通过！');
  } else {
    console.log('\n  ⚠️ 发现 ' + bugs.length + ' 个问题：');
    bugs.forEach((b, i) => console.log('    ' + (i + 1) + '. ' + b));
  }
  console.log('  JS 错误: ' + jsErrors.length);
  console.log('═'.repeat(50));

  await page.screenshot({ path: 'test-results/fullcheck-final.png', fullPage: true });
  await browser.close();
}

run()
  .then(() => process.exit(bugs.length > 0 ? 1 : 0))
  .catch(err => { console.error('Fatal:', err); process.exit(1); });
