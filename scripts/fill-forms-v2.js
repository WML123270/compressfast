/**
 * 修复: 新趣集精确填写 + 飞书表单 iframe 处理
 */
const { chromium } = require('playwright');

const P = {
  name: '极速压图',
  url: 'https://jisuyatu.com',
  shortDesc: '纯浏览器端图片压缩工具，文件不上传服务器，支持批量处理，永久免费',
  longDesc: '极速压图是一款纯浏览器端图片压缩工具。所有压缩在浏览器本地 Web Worker 中完成，文件不会上传到任何服务器——断网也能正常使用。\n\n核心功能：\n• 支持 PNG/JPEG/WebP/GIF/BMP/SVG 六种格式输入\n• 单次 100 张批量压缩，一键 ZIP 打包下载\n• 三种预设档位（最大压缩/均衡/最佳画质）+ 手动调节\n• 指定目标大小压缩，自动多画质+缩放逼近\n• 画质实时预览，滑块即调即看\n• 输出格式可选 PNG/JPEG/WebP\n• 前后对比预览\n• Ctrl+V 粘贴截图直接压缩\n• 暗色模式 + PWA 桌面安装\n• 永久免费，无广告，无需注册\n\n适合前端开发者、UI/UX 设计师、自媒体运营、电商运营等所有需要处理图片的用户。',
  tags: '图片压缩,在线工具,设计工具,效率工具,图片处理',
  email: 'admin@jisuyatu.com',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════ 新趣集 - 精确填写 ══════
async function doXinquji(browser) {
  console.log('\n━━━ 新趣集 xinquji.com ━━━');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
  const page = await ctx.newPage();

  await page.goto('https://xinquji.com/submit', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(5000);
  console.log('Page: ' + await page.title());

  // Clear and refill correctly
  // 1. Product name
  const nameEl = await page.$('#name');
  if (nameEl) {
    await nameEl.click(); await sleep(200);
    await nameEl.fill('');
    await nameEl.fill(P.name);
    console.log('✓ name: ' + P.name);
  }

  // 2. Short description (was incorrectly filled with longDesc)
  const descEl = await page.$('#description');
  if (descEl) {
    await descEl.click(); await sleep(200);
    await descEl.fill('');
    await descEl.fill(P.shortDesc);
    console.log('✓ description: ' + P.shortDesc);
  }

  // 3. Website URL
  const urlEl = await page.$('#website');
  if (urlEl) {
    await urlEl.click(); await sleep(200);
    await urlEl.fill('');
    await urlEl.fill(P.url);
    console.log('✓ website: ' + P.url);
  }

  // 4. Long description
  const contentEl = await page.$('#content');
  if (contentEl) {
    await contentEl.click(); await sleep(200);
    await contentEl.fill('');
    await contentEl.fill(P.longDesc);
    console.log('✓ content: filled (' + P.longDesc.length + ' chars)');
  }

  // 5. Check checkboxes
  const checkboxes = await page.$$('input[type="checkbox"]');
  for (const cb of checkboxes) {
    const checked = await cb.evaluate(e => e.checked);
    if (!checked) {
      // Click the label or the checkbox itself
      try {
        await cb.click();
        console.log('✓ checkbox checked');
      } catch(e) {
        const label = await cb.evaluate(el => {
          const parent = el.closest('label');
          return parent ? parent.textContent?.trim() : null;
        });
        if (label) console.log('  checkbox label: ' + label);
      }
    }
  }

  // 6. Try to find and fill tags/category (if any beyond the 9 fields)
  // Look for any tag input or select
  const allInputs = await page.$$('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
  console.log('Total fillable fields after main fill: ' + allInputs.length);

  // 7. Handle file uploads - try to upload a screenshot
  // Check if there are file inputs
  const fileInputs = await page.$$('input[type="file"]');
  console.log('File inputs found: ' + fileInputs.length);
  // Note: we can't upload screenshots automatically - need user to do this

  await page.screenshot({ path: 'test-results/xinquji-ready.png', fullPage: true });
  console.log('📸 xinquji-ready.png');

  // Scroll to top to show the full form
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await page.screenshot({ path: 'test-results/xinquji-form-top.png' });
  console.log('📸 xinquji-form-top.png');

  await ctx.close();
}

// ══════ Toolin 飞书表单 - iframe 处理 ══════
async function doFeishu(browser) {
  console.log('\n━━━ Toolin 飞书表单 ━━━');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
  const page = await ctx.newPage();

  const feishuUrl = 'https://ai.feishu.cn/share/base/form/shrcnFrWJSFSRZ0osS0eLPjTsIb';
  await page.goto(feishuUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  console.log('Page: ' + await page.title());
  console.log('URL: ' + page.url());

  // Check for iframes
  const iframes = await page.$$('iframe');
  console.log('Iframes: ' + iframes.length);
  for (const iframe of iframes) {
    const src = await iframe.getAttribute('src');
    console.log('  iframe src: ' + (src || '(none)'));
  }

  // Try to get page content to understand structure
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.slice(0, 3000));
  console.log('Body (first 3k):');
  console.log(bodyHTML);

  // If there's an iframe, try to access it
  if (iframes.length > 0) {
    for (let i = 0; i < iframes.length; i++) {
      try {
        const frame = await iframes[i].contentFrame();
        if (frame) {
          console.log('\nFrame ' + i + ' URL: ' + frame.url());
          const frameInputs = await frame.$$('input:not([type="hidden"]), textarea, select');
          console.log('Frame ' + i + ' inputs: ' + frameInputs.length);

          // Try to fill in the frame
          for (const el of frameInputs) {
            const name = (await el.getAttribute('name') || '').toLowerCase();
            const placeholder = (await el.getAttribute('placeholder') || '').toLowerCase();
            const type = (await el.getAttribute('type') || 'text');
            console.log('  Frame input: name="' + name + '" placeholder="' + placeholder.slice(0,40) + '" type=' + type);
          }
        }
      } catch(e) {
        console.log('  Frame ' + i + ' error: ' + e.message.slice(0, 60));
      }
    }
  }

  await page.screenshot({ path: 'test-results/feishu-form.png', fullPage: true });
  console.log('📸 feishu-form.png');
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--no-proxy-server', '--disable-blink-features=AutomationControlled'],
  });

  await doXinquji(browser);
  await doFeishu(browser);

  await browser.close();
  console.log('\n✅ 完成');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
