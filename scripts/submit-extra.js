/**
 * 极速压图 - 新增导航站提交
 * 用法: node scripts/submit-extra.js [xinquji|toolin|all]
 */
const { chromium } = require('playwright');

const P = {
  name: '极速压图',
  url: 'https://jisuyatu.com',
  shortDesc: '纯浏览器端图片压缩工具，文件不上传，支持批量处理，永久免费。',
  longDesc: '极速压图是一款纯浏览器端图片压缩工具。所有压缩在浏览器本地完成，文件不会上传到任何服务器——断网也能正常使用。支持 PNG/JPEG/WebP/GIF/BMP/SVG 六种格式、单次 100 张批量处理、三种预设档位一键压缩、画质实时预览、指定目标大小压缩、格式互转、一键 ZIP 打包下载。永久免费，无广告。',
  tags: '图片压缩,在线工具,设计工具,效率工具,图片处理,免费,隐私安全',
  category: '设计工具',
  email: 'admin@jisuyatu.com',
};

const BROWSER_ARGS = ['--no-sandbox', '--no-proxy-server', '--disable-blink-features=AutomationControlled'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function makePage(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  return { ctx, page };
}

async function autoFill(page) {
  const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
  const RULES = [
    { keys: ['name', 'title', 'product_name', 'productname', 'site_name', 'appname', 'app_name'], val: P.name },
    { keys: ['url', 'website', 'link', 'site', 'product_url', 'homepage', 'domain'], val: P.url },
    { keys: ['short', 'brief', 'oneliner', 'slogan', 'tagline', 'subtitle'], val: P.shortDesc },
    { keys: ['description', 'desc', 'summary', 'intro', 'introduction', 'bio', 'detail', 'content', 'body'], val: P.longDesc },
    { keys: ['tag', 'tags', 'keyword', 'keywords', 'label', 'labels'], val: P.tags },
    { keys: ['category', 'cat', 'categories', 'type', '分类', '类别', 'sort'], val: P.category },
    { keys: ['email', 'contact', 'mail', 'author_email', 'creator_email'], val: P.email },
    { keys: ['author', 'creator', 'developer', 'maker'], val: '极速压图团队' },
  ];

  let filled = 0;
  for (const el of inputs) {
    const attrs = {};
    for (const attr of ['name', 'placeholder', 'id']) {
      attrs[attr] = ((await el.getAttribute(attr)) || '').toLowerCase();
    }
    const tag = await el.evaluate(e => e.tagName);
    const combined = [attrs.name, attrs.placeholder, attrs.id].join('|');

    for (const rule of RULES) {
      if (rule.keys.some(k => combined.includes(k))) {
        try {
          if (tag === 'SELECT') {
            const opts = await el.$$eval('option', opts =>
              opts.map(o => ({ text: (o.textContent||'').trim(), val: o.value }))
            );
            const match = opts.find(o => o.text.includes(rule.val) || o.val.includes(rule.val.toLowerCase().replace(/\s/g, '')));
            if (match) { await el.selectOption(match.val); filled++; }
          } else {
            await el.fill(rule.val);
            filled++;
          }
          console.log('  ✓ ' + (attrs.name || attrs.placeholder || attrs.id || tag) + ' = ' + rule.val.slice(0, 60) + '...');
        } catch (e) { console.log('  ⚠ skip: ' + e.message.slice(0, 50)); }
        break;
      }
    }
  }
  return filled;
}

// ══════ 新趣集 xinquji.com ══════
async function doXinquji(browser) {
  console.log('\n━━━ 新趣集 xinquji.com ━━━');
  const { ctx, page } = await makePage(browser);

  try {
    // Step 1: Navigate to homepage
    console.log('1. 打开首页...');
    await page.goto('https://xinquji.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(5000);
    console.log('   Page: ' + await page.title());
    console.log('   URL: ' + page.url());

    // Step 2: Look for submit/register links
    const allLinks = await page.$$('a, button');
    for (const link of allLinks) {
      const text = (await link.textContent() || '').trim();
      const href = (await link.getAttribute('href') || '');
      if (text && (text.includes('提交') || text.includes('Submit') || text.includes('注册'))) {
        console.log('   Found: [' + text + '] -> ' + href);
      }
    }

    // Try common submit paths
    const submitPaths = ['/submit', '/products/new', '/post', '/create'];
    for (const path of submitPaths) {
      try {
        await page.goto('https://xinquji.com' + path, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await sleep(3000);
        const inputs = await page.$$('input:not([type="hidden"]), textarea, select');
        if (inputs.length >= 3) {
          console.log('   ✓ Found submit form at ' + path + ' (' + inputs.length + ' fields)');
          const filled = await autoFill(page);
          console.log('   Filled: ' + filled + '/' + inputs.length);
          await page.screenshot({ path: 'test-results/xinquji-form.png', fullPage: true });
          console.log('   📸 xinquji-form.png');
          break;
        }
      } catch (e) { /* path doesn't exist */ }
    }

    await page.screenshot({ path: 'test-results/xinquji-final.png', fullPage: true });
    console.log('   📸 xinquji-final.png');
  } catch (e) {
    console.error('   ❌ ' + e.message);
  }
  await ctx.close();
}

// ══════ Toolin.ai ══════
async function doToolin(browser) {
  console.log('\n━━━ Toolin.ai ━━━');
  const { ctx, page } = await makePage(browser);

  try {
    // Step 1: Navigate
    console.log('1. 打开首页...');
    await page.goto('https://toolin.ai', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(6000);
    console.log('   Page: ' + await page.title());
    console.log('   URL: ' + page.url());

    // Step 2: Look for submit buttons
    const allLinks = await page.$$('a, button');
    let submitUrl = null;
    for (const link of allLinks) {
      const text = (await link.textContent() || '').trim();
      const href = (await link.getAttribute('href') || '');
      console.log('   Link: [' + text.slice(0, 40) + '] -> ' + href.slice(0, 80));
      if (text.includes('提交') || text.includes('收录') || text.includes('Submit') || text.includes('AI工具')) {
        submitUrl = href;
        console.log('   ★ 找到提交入口: ' + text + ' -> ' + href);
      }
    }

    // Step 3: Try cooperation page
    console.log('\n2. 尝试合作页...');
    await page.goto('https://toolin.ai/cooperation', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(5000);
    console.log('   URL: ' + page.url());

    const inputs = await page.$$('input:not([type="hidden"]), textarea, select');
    console.log('   Fields: ' + inputs.length);

    if (inputs.length > 0) {
      const filled = await autoFill(page);
      console.log('   Filled: ' + filled + '/' + inputs.length);

      // Find submit button
      const submitBtns = await page.$$('button[type="submit"], input[type="submit"], button:has-text("提交")');
      if (submitBtns.length > 0) {
        console.log('   Submit buttons: ' + submitBtns.length);
        console.log('   🖱️ Clicking submit...');
        try { await submitBtns[0].click(); await sleep(3000); } catch(e) {}
        console.log('   After submit: ' + page.url());
      }
    }

    await page.screenshot({ path: 'test-results/toolin-final.png', fullPage: true });
    console.log('   📸 toolin-final.png');
  } catch (e) {
    console.error('   ❌ ' + e.message);
  }
  await ctx.close();
}

// ══════ MAIN ══════
async function main() {
  const target = process.argv[2] || 'all';
  console.log('🚀 新增站点提交 - 目标: ' + target);

  const browser = await chromium.launch({
    headless: true,
    args: BROWSER_ARGS,
  });

  const tasks = [];
  if (target === 'xinquji' || target === 'all') tasks.push(doXinquji(browser));
  if (target === 'toolin' || target === 'all') tasks.push(doToolin(browser));

  await Promise.all(tasks);
  await browser.close();

  console.log('\n═══════════════════');
  console.log('✅ 完成！截图在 test-results/');
  console.log('═══════════════════');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
