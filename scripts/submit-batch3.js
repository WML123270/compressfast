/**
 * 极速压图 - 第三批导航站探索
 * 用法: node scripts/submit-batch3.js
 */
const { chromium } = require('playwright');

const P = {
  name: '极速压图',
  url: 'https://jisuyatu.com',
  shortDesc: '纯浏览器端图片压缩工具，文件不上传，支持批量处理，永久免费',
  longDesc: '极速压图是一款纯浏览器端图片压缩工具。所有压缩在浏览器本地完成，文件不会上传到任何服务器——断网也能正常使用。支持 PNG/JPEG/WebP/GIF/BMP/SVG 六种格式、单次 100 张批量处理、三种预设档位、指定大小压缩、格式互转、一键 ZIP 下载。',
  tags: '图片压缩,在线工具,设计工具,效率工具,图片处理,免费',
  category: '设计工具',
  email: 'admin@jisuyatu.com',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function makePage(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, locale: 'zh-CN',
  });
  const page = await ctx.newPage();
  return { ctx, page };
}

async function fillForm(page) {
  const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea, select');
  const RULES = [
    { keys: ['name','title','product_name','site_name','app_name'], val: P.name },
    { keys: ['url','website','link','site','homepage','domain'], val: P.url },
    { keys: ['short','brief','oneliner','slogan','tagline','subtitle'], val: P.shortDesc },
    { keys: ['description','desc','summary','intro','detail','content','body'], val: P.longDesc },
    { keys: ['tag','tags','keyword','keywords','label'], val: P.tags },
    { keys: ['category','cat','categories','type','sort'], val: P.category },
    { keys: ['email','contact','mail'], val: P.email },
  ];

  let filled = 0;
  for (const el of inputs) {
    const nameAttr = ((await el.getAttribute('name')) || '').toLowerCase();
    const placeholder = ((await el.getAttribute('placeholder')) || '').toLowerCase();
    const id = ((await el.getAttribute('id')) || '').toLowerCase();
    const tag = await el.evaluate(e => e.tagName);
    const combined = nameAttr + '|' + placeholder + '|' + id;

    for (const rule of RULES) {
      if (rule.keys.some(k => combined.includes(k))) {
        try {
          if (tag === 'SELECT') {
            const opts = await el.$$eval('option', opts =>
              opts.map(o => ({ text: (o.textContent||'').trim(), val: o.value }))
            );
            const match = opts.find(o => o.text.includes(rule.val));
            if (match) { await el.selectOption(match.val); filled++; }
          } else {
            await el.fill(rule.val); filled++;
          }
          console.log('  ✓ ' + (nameAttr || placeholder || id || tag));
        } catch (e) {}
        break;
      }
    }
  }
  return filled;
}

// ══════ Solo 独立开发者社区 ══════
async function doSolo(browser) {
  console.log('\n━━━ Solo solo.xin ━━━');
  const { ctx, page } = await makePage(browser);

  try {
    console.log('1. 打开首页...');
    await page.goto('https://solo.xin', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(5000);
    console.log('   Page: ' + await page.title());
    console.log('   URL: ' + page.url());

    // Find submit/product links
    const links = await page.$$('a');
    for (const link of links) {
      const text = (await link.textContent() || '').trim();
      const href = (await link.getAttribute('href') || '');
      if (text && (text.includes('产品') || text.includes('提交') || text.includes('发布') || text.includes('submit') || text.includes('项目'))) {
        console.log('   Link: [' + text + '] -> ' + href);
      }
    }

    // Try common submit paths
    const tryPaths = ['/submit', '/products/new', '/post', '/create', '/share', '/products'];
    for (const path of tryPaths) {
      try {
        await page.goto('https://solo.xin' + path, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await sleep(4000);
        const inputs = await page.$$('input:not([type="hidden"]), textarea, select');
        if (inputs.length >= 2) {
          console.log('   ★ Found form at ' + path + ' (' + inputs.length + ' fields)');
          await fillForm(page);
          await page.screenshot({ path: 'test-results/solo-form.png', fullPage: true });
        }
      } catch (e) {}
    }

    await page.goto('https://solo.xin', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(3000);
    await page.screenshot({ path: 'test-results/solo-final.png', fullPage: true });
    console.log('   📸 solo-final.png');
  } catch (e) {
    console.error('   ❌ ' + e.message);
  }
  await ctx.close();
}

// ══════ Turbo0 ══════
async function doTurbo0(browser) {
  console.log('\n━━━ Turbo0 turbo0.com ━━━');
  const { ctx, page } = await makePage(browser);

  try {
    console.log('1. 打开首页...');
    await page.goto('https://turbo0.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(5000);
    console.log('   Page: ' + await page.title());

    // Find submit links
    const links = await page.$$('a, button');
    for (const link of links) {
      const text = (await link.textContent() || '').trim();
      const href = (await link.getAttribute('href') || '');
      if (text.includes('Submit') || text.includes('提交') || text.includes('Add') || text.includes('Listing')) {
        console.log('   ★ Submit: [' + text + '] -> ' + href);
      }
    }

    // Try submit paths
    const tryPaths = ['/submit', '/add', '/listing/new', '/post', '/submit-listing'];
    for (const path of tryPaths) {
      try {
        await page.goto('https://turbo0.com' + path, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await sleep(4000);
        console.log('   Path ' + path + ': ' + page.url());
        const inputs = await page.$$('input:not([type="hidden"]), textarea, select');
        if (inputs.length >= 2) {
          console.log('   ★ Form at ' + path + ' (' + inputs.length + ' fields)');
          await fillForm(page);
          await page.screenshot({ path: 'test-results/turbo0-form.png', fullPage: true });
        }
      } catch (e) {}
    }

    await page.screenshot({ path: 'test-results/turbo0-final.png', fullPage: true });
    console.log('   📸 turbo0-final.png');
  } catch (e) {
    console.error('   ❌ ' + e.message);
  }
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--no-proxy-server', '--disable-blink-features=AutomationControlled'],
  });

  await doSolo(browser);
  await doTurbo0(browser);

  await browser.close();
  console.log('\n✅ 完成');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
