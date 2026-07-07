/**
 * 极速压图 - 导航站自动提交
 * 用法: node scripts/submit.js [rustpoint|nav3|toolin|v2ex|all]
 */
const { chromium } = require('playwright');

const P = {
  name: '极速压图',
  url: 'https://jisuyatu.com',
  shortDesc: '纯浏览器端图片压缩工具，文件不上传，支持批量处理，永久免费。',
  longDesc: '极速压图是纯浏览器端运行的在线图片压缩工具。所有压缩在本地 Web Worker 中完成，文件不会上传到任何服务器——断网也能正常使用。支持 PNG/JPEG/WebP/GIF/BMP/SVG 六种格式、单次 100 张批量处理、三种预设档位一键压缩、画质实时预览、指定目标大小压缩、格式互转、一键 ZIP 打包下载。完全免费，无广告。',
  tags: '图片压缩,在线工具,设计工具,效率工具,图片处理',
  category: '设计工具',
  email: 'admin@jisuyatu.com',
};

const BROWSER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--no-proxy-server'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fillForm(page) {
  const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea, select');
  const RULES = [
    { keys: ['name', 'title', 'product_name', 'productname', 'site_name', 'app_name'], val: P.name },
    { keys: ['url', 'website', 'link', 'site', 'product_url', 'homepage'], val: P.url },
    { keys: ['description', 'desc', 'summary', 'intro', 'introduction', 'bio', 'detail'], val: P.longDesc },
    { keys: ['short', 'brief', 'oneliner', 'slogan', 'tagline'], val: P.shortDesc },
    { keys: ['tag', 'tags', 'keyword', 'keywords', 'label', 'labels'], val: P.tags },
    { keys: ['category', 'cat', 'categories', 'type', '分类', '类别'], val: P.category },
    { keys: ['email', 'contact', 'mail'], val: P.email },
  ];

  let filled = 0;
  for (const el of inputs) {
    const nameAttr = (await el.getAttribute('name') || '').toLowerCase();
    const placeholder = (await el.getAttribute('placeholder') || '').toLowerCase();
    const id = (await el.getAttribute('id') || '').toLowerCase();
    const tag = await el.evaluate(e => e.tagName);
    const combined = nameAttr + '|' + placeholder + '|' + id;

    for (const rule of RULES) {
      if (rule.keys.some(k => combined.includes(k))) {
        try {
          if (tag === 'SELECT') {
            const opts = await el.$$eval('option', opts =>
              opts.map(o => ({ text: o.textContent, val: o.value }))
            );
            const match = opts.find(o => o.text.includes(rule.val));
            if (match) { await el.selectOption(match.val); filled++; }
          } else {
            await el.fill(rule.val);
            filled++;
          }
          console.log('  ✓ ' + (nameAttr || placeholder || id || tag) + ' = ' + rule.val.slice(0, 50) + '...');
        } catch (e) { /* skip */ }
        break;
      }
    }
  }
  return filled;
}

async function makePage(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
  });
  const page = await ctx.newPage();
  return { ctx, page };
}

// ══════ RustPoint ══════
async function doRustpoint(browser) {
  console.log('\n━━━ RustPoint ━━━');
  const { ctx, page } = await makePage(browser);

  try {
    await page.goto('https://rustpoint.com/nav', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(4000);
    console.log('  Page: ' + await page.title());

    const link = await page.$('a:has-text("提交站点")');
    if (link) {
      await link.click();
      await sleep(4000);
    } else {
      await page.goto('https://rustpoint.com/nav/submit', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(4000);
    }
    console.log('  URL: ' + page.url());

    const inputs = await page.$$('input, textarea, select');
    console.log('  Fields: ' + inputs.length);

    if (inputs.length > 0) {
      const filled = await fillForm(page);
      console.log('  Filled: ' + filled + '/' + inputs.length);

      // Find and highlight submit button
      const submitBtns = await page.$$('button[type="submit"], input[type="submit"]');
      if (submitBtns.length > 0) {
        console.log('  Submit buttons found: ' + submitBtns.length);
        // Click the first submit button
        try {
          console.log('  🖱️ Clicking submit...');
          await submitBtns[0].click();
          await sleep(3000);
          console.log('  After submit URL: ' + page.url());
        } catch(e) {
          console.log('  Submit click failed: ' + e.message);
        }
      }
    }

    await page.screenshot({ path: 'test-results/rustpoint-final.png', fullPage: true });
    console.log('  📸 rustpoint-final.png');
  } catch (e) {
    console.error('  ❌ ' + e.message);
  }
  await ctx.close();
}

// ══════ nav3.cn ══════
async function doNav3(browser) {
  console.log('\n━━━ nav3.cn ━━━');
  const { ctx, page } = await makePage(browser);

  try {
    await page.goto('https://nav3.cn', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(5000);
    console.log('  Page: ' + await page.title());

    // nav3 is an Angular SPA, look for submit feature
    const buttons = await page.$$('a, button, [role="button"]');
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').trim();
      if (text.includes('提交') || text.includes('收录') || text.includes('添加网站')) {
        console.log('  Clicking: ' + text);
        await btn.click();
        await sleep(4000);
        break;
      }
    }
    console.log('  URL: ' + page.url());

    const inputs = await page.$$('input, textarea, select');
    console.log('  Fields: ' + inputs.length);

    if (inputs.length > 0) {
      const filled = await fillForm(page);
      console.log('  Filled: ' + filled + '/' + inputs.length);
    }

    await page.screenshot({ path: 'test-results/nav3-final.png', fullPage: true });
    console.log('  📸 nav3-final.png');
  } catch (e) {
    console.error('  ❌ ' + e.message);
  }
  await ctx.close();
}

// ══════ Toolin.ai ══════
async function doToolin(browser) {
  console.log('\n━━━ Toolin.ai ━━━');
  const { ctx, page } = await makePage(browser);

  try {
    await page.goto('https://toolin.ai', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(5000);
    console.log('  Page: ' + await page.title());

    const buttons = await page.$$('a, button');
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').trim();
      if (text.includes('提交') && text.includes('工具')) {
        console.log('  Clicking: ' + text);
        await btn.click();
        await sleep(4000);
        break;
      }
    }
    console.log('  URL: ' + page.url());

    const inputs = await page.$$('input, textarea, select');
    console.log('  Fields: ' + inputs.length);

    if (inputs.length > 0) {
      const filled = await fillForm(page);
      console.log('  Filled: ' + filled + '/' + inputs.length);
    }

    await page.screenshot({ path: 'test-results/toolin-final.png', fullPage: true });
    console.log('  📸 toolin-final.png');
  } catch (e) {
    console.error('  ❌ ' + e.message);
  }
  await ctx.close();
}

// ══════ V2EX ══════
async function doV2ex(browser) {
  console.log('\n━━━ V2EX ━━━');
  const { ctx, page } = await makePage(browser);

  try {
    await page.goto('https://v2ex.com/go/create', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(4000);
    console.log('  Page: ' + await page.title());

    const body = await page.textContent('body');
    if (body.includes('登录') || body.includes('Sign in')) {
      console.log('  ⚠️ 需登录');
    } else {
      console.log('  ✓ 已登录');
      const ti = await page.$('input[name="title"], #topic_title');
      if (ti) {
        await ti.fill('极速压图 - 一个纯浏览器端的图片压缩工具，文件完全不上传');
        console.log('  ✓ 标题已填');
      }
      const ci = await page.$('textarea[name="content"], #topic_content');
      if (ci) {
        await ci.fill('平时做前端项目经常要压缩图片，TinyPNG 虽然好用但每次都要上传到对方服务器。自己写了一个纯本地压缩工具。\n\n**特点：**\n1. 纯本地处理 — 文件不会上传到任何服务器\n2. 批量压缩 — 单次 100 张，一键 ZIP\n3. 三种预设 + 手动调节画质\n4. 指定大小压缩\n5. 6 种格式 + 格式互转\n6. Ctrl+V 粘贴\n7. 暗色模式 + PWA\n\n**对比：** https://jisuyatu.com/vs-tinypng\n**链接：** https://jisuyatu.com\n\n欢迎试用 🙏');
        console.log('  ✓ 正文已填');
      }
    }

    await page.screenshot({ path: 'test-results/v2ex-final.png', fullPage: true });
    console.log('  📸 v2ex-final.png');
  } catch (e) {
    console.error('  ❌ ' + e.message);
  }
  await ctx.close();
}

// ══════ MAIN ══════
async function main() {
  const target = process.argv[2] || 'all';
  console.log('🚀 开始提交 - 目标: ' + target);

  const browser = await chromium.launch({
    headless: true,
    args: BROWSER_ARGS,
  });

  const tasks = [];
  if (target === 'rustpoint' || target === 'all') tasks.push(doRustpoint(browser));
  if (target === 'nav3' || target === 'all') tasks.push(doNav3(browser));
  if (target === 'toolin' || target === 'all') tasks.push(doToolin(browser));
  if (target === 'v2ex' || target === 'all') tasks.push(doV2ex(browser));

  await Promise.all(tasks);
  await browser.close();

  console.log('\n═══════════════════');
  console.log('✅ 完成！截图在 test-results/');
  console.log('═══════════════════');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
