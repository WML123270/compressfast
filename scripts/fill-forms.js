/**
 * 精确填写新趣集和Toolin飞书表单
 */
const { chromium } = require('playwright');

const P = {
  name: '极速压图',
  url: 'https://jisuyatu.com',
  shortDesc: '纯浏览器端图片压缩工具，文件不上传服务器，支持批量处理，永久免费',
  longDesc: '极速压图是一款纯浏览器端图片压缩工具。所有压缩在浏览器本地 Web Worker 中完成，文件不会上传到任何服务器——断网也能正常使用。支持 PNG/JPEG/WebP/GIF/BMP/SVG 六种格式输入、单次 100 张批量处理、三种预设档位一键压缩、画质实时预览、指定目标大小压缩、格式互转 PNG/JPEG/WebP、一键 ZIP 打包下载。适合前端开发者、设计师、自媒体运营等需要处理图片的用户。完全免费，无广告，无需注册。',
  tags: '图片压缩,在线工具,设计工具,效率工具',
  email: 'admin@jisuyatu.com',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function dumpAllFields(page) {
  const fields = await page.$$('input:not([type="hidden"]), textarea, select, [role="combobox"], [role="listbox"]');
  console.log('  === All ' + fields.length + ' fields ===');
  for (const el of fields) {
    const tag = await el.evaluate(e => e.tagName);
    const type = (await el.getAttribute('type') || '').toLowerCase();
    const name = (await el.getAttribute('name') || '').toLowerCase();
    const placeholder = (await el.getAttribute('placeholder') || '').toLowerCase();
    const id = (await el.getAttribute('id') || '').toLowerCase();
    const ariaLabel = (await el.getAttribute('aria-label') || '').toLowerCase();
    const required = (await el.getAttribute('required') !== null);
    const visible = await el.evaluate(e => e.offsetParent !== null);
    const label = await el.evaluate(e => {
      const lbl = e.closest('label') || (e.id ? document.querySelector('label[for="' + e.id + '"]') : null);
      return lbl ? lbl.textContent?.trim()?.toLowerCase() : '';
    });

    console.log('  [' + tag + (type ? ':' + type : '') + '] name="' + name + '" placeholder="' + placeholder.slice(0,40) + '" id="' + id + '" label="' + (label||'').slice(0,40) + '" req=' + required + ' vis=' + visible);
  }
  return fields;
}

// ══════ 新趣集 ══════
async function doXinquji(browser) {
  console.log('\n━━━ 新趣集 xinquji.com ━━━');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
  const page = await ctx.newPage();

  await page.goto('https://xinquji.com/submit', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(5000);
  console.log('Page: ' + await page.title());

  // Dump all fields
  await dumpAllFields(page);

  // Try to fill all detectable fields more carefully
  const inputs = await page.$$('input:not([type="hidden"]):not([type="file"]), textarea, select');
  for (const el of inputs) {
    const name = (await el.getAttribute('name') || '').toLowerCase();
    const placeholder = (await el.getAttribute('placeholder') || '').toLowerCase();
    const id = (await el.getAttribute('id') || '').toLowerCase();
    const tag = await el.evaluate(e => e.tagName);
    const type = (await el.getAttribute('type') || '');

    // Try to match unfilled fields
    const combined = name + '|' + placeholder + '|' + id;

    try {
      if (tag === 'TEXTAREA' && (combined.includes('desc') || combined.includes('story') || combined.includes('intro') || combined.includes('content') || combined.includes('function') || combined.includes('feature') || combined.includes('problem'))) {
        await el.fill(P.longDesc);
        console.log('  ✓ textarea = longDesc');
      } else if (tag === 'TEXTAREA' && (combined.includes('tag') || combined.includes('keyword') || combined.includes('label'))) {
        await el.fill(P.tags);
        console.log('  ✓ textarea = tags');
      } else if (tag === 'SELECT' || combined.includes('categor') || combined.includes('分类') || combined.includes('sort')) {
        console.log('  SELECT: ' + combined);
      } else if (type === 'file' || combined.includes('image') || combined.includes('logo') || combined.includes('icon') || combined.includes('screenshot') || combined.includes('cover')) {
        console.log('  FILE: ' + combined);
      } else if (combined.includes('name') || combined.includes('title') || combined.includes('产品')) {
        if (!combined.includes('user') && !combined.includes('author')) {
          try { await el.fill(P.name); console.log('  ✓ name = ' + P.name); } catch(e) {}
        }
      } else if (combined.includes('url') || combined.includes('website') || combined.includes('link') || combined.includes('domain') || combined.includes('site')) {
        try { await el.fill(P.url); console.log('  ✓ url = ' + P.url); } catch(e) {}
      } else if (combined.includes('short') || combined.includes('brief') || combined.includes('oneliner') || combined.includes('slogan') || combined.includes('tagline')) {
        try { await el.fill(P.shortDesc); console.log('  ✓ short = ' + P.shortDesc); } catch(e) {}
      }
    } catch (e) {
      console.log('  ⚠ ' + combined.slice(0,40) + ': ' + e.message.slice(0,50));
    }
  }

  await page.screenshot({ path: 'test-results/xinquji-filled.png', fullPage: true });
  console.log('📸 xinquji-filled.png');
  await ctx.close();
}

// ══════ Toolin 飞书表单 ══════
async function doFeishu(browser) {
  console.log('\n━━━ Toolin 飞书表单 ━━━');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
  const page = await ctx.newPage();

  const feishuUrl = 'https://ai.feishu.cn/share/base/form/shrcnFrWJSFSRZ0osS0eLPjTsIb';
  await page.goto(feishuUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await sleep(8000);
  console.log('Page: ' + await page.title());
  console.log('URL: ' + page.url());

  // Dump all fields
  await dumpAllFields(page);

  // Try to fill
  const inputs = await page.$$('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
  console.log('  Inputs: ' + inputs.length);

  for (const el of inputs) {
    const name = (await el.getAttribute('name') || '').toLowerCase();
    const placeholder = (await el.getAttribute('placeholder') || '').toLowerCase();
    const tag = await el.evaluate(e => e.tagName);
    const combined = name + '|' + placeholder;

    try {
      if (combined.includes('name') || combined.includes('title') || combined.includes('工具') || combined.includes('产品')) {
        await el.fill(P.name); console.log('  ✓ name');
      } else if (combined.includes('url') || combined.includes('website') || combined.includes('链接') || combined.includes('地址') || combined.includes('官网')) {
        await el.fill(P.url); console.log('  ✓ url');
      } else if (combined.includes('desc') || combined.includes('描述') || combined.includes('介绍') || combined.includes('intro')) {
        await el.fill(P.longDesc); console.log('  ✓ desc');
      } else if (combined.includes('tag') || combined.includes('分类') || combined.includes('标签') || combined.includes('keyword')) {
        await el.fill(P.tags); console.log('  ✓ tags');
      } else if (combined.includes('email') || combined.includes('邮箱') || combined.includes('mail') || combined.includes('联系')) {
        await el.fill(P.email); console.log('  ✓ email');
      } else {
        console.log('  ? ' + combined.slice(0, 60));
      }
    } catch(e) {
      console.log('  ⚠ ' + e.message.slice(0, 50));
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
