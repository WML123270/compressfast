/**
 * RustPoint 快速注册 - 接受验证码参数
 * 用法: node scripts/register-fast.js <6位验证码>
 */
const { chromium } = require('playwright');

const EMAIL = '756971388@qq.com';
const PASSWORD = 'Jsy@2025Tuya!';
const CODE = process.argv[2];

if (!CODE || !/^\d{6}$/.test(CODE)) {
  console.error('用法: node scripts/register-fast.js <6位验证码>');
  process.exit(1);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('=== RustPoint 快速注册 ===');
  console.log('邮箱: ' + EMAIL);
  console.log('验证码: ' + CODE);
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox','--no-proxy-server','--disable-blink-features=AutomationControlled'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });

  try {
    // Step 1: Navigate to register page
    console.log('1. 打开注册页...');
    await page.goto('https://rustpoint.com/nav/submit', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(4000);
    await page.click('button:has-text("登录")');
    await sleep(8000);
    await page.click('a:has-text("注册")');
    await sleep(5000);
    console.log('   注册页: ' + page.url());

    // Step 2: Fill email - use React-compatible approach
    await page.evaluate(email => {
      const el = document.querySelector('input[name="identifier"]');
      if (el) {
        const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        s.call(el, email);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, EMAIL);
    await sleep(500);

    // Step 3: Click register to send verification code
    console.log('2. 发送验证码...');
    await page.click('button:visible:has-text("注册")');
    await sleep(6000);
    console.log('   验证码已发送');

    // Step 4: Directly enter the provided code
    console.log('3. 输入验证码: ' + CODE);
    try {
      await page.waitForSelector('input[name="passcode_0"]', { timeout: 10000 });
    } catch {
      // Maybe passcode fields have different names
      const passcodeInputs = await page.$$('input[id*="passcode"], input[name*="passcode"], input[class*="passcode"]');
      console.log('   找到 ' + passcodeInputs.length + ' 个验证码输入框');
    }

    // Try to find all passcode input fields
    const allInputs = await page.$$('input');
    let codeInputs = [];
    for (const inp of allInputs) {
      const name = (await inp.getAttribute('name') || '');
      const type = (await inp.getAttribute('type') || '');
      const id = (await inp.getAttribute('id') || '');
      if (name.includes('passcode') || id.includes('passcode') || name.includes('code') || id.includes('code')) {
        codeInputs.push(inp);
      }
    }
    console.log('   验证码输入框: ' + codeInputs.length);

    if (codeInputs.length > 0) {
      // Click the first one and type
      await codeInputs[0].click();
      await sleep(300);
      // Clear first
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.type(CODE, { delay: 100 });
      await sleep(1000);
    } else {
      // Fallback - try clicking on the first visible input after the email
      console.log('   回退: 尝试直接键入验证码');
      await page.keyboard.type(CODE, { delay: 100 });
      await sleep(1000);
    }

    // Step 5: Find and click the continue/verify button
    console.log('4. 点击继续...');
    const buttons = await page.$$('button');
    let clicked = false;
    for (const b of buttons) {
      const disabled = await b.evaluate(e => e.disabled);
      const display = await b.evaluate(e => window.getComputedStyle(e).display);
      const text = (await b.textContent() || '').trim();
      if (!disabled && display !== 'none' && (text.includes('继续') || text.includes('验证') || text.includes('确') || text.includes('注册') || text.includes('下一步'))) {
        console.log('   点击: "' + text + '"');
        await b.click();
        clicked = true;
        await sleep(10000);
        break;
      }
    }
    if (!clicked) {
      console.log('   按 Enter...');
      await page.keyboard.press('Enter');
      await sleep(8000);
    }
    console.log('5. 验证后: ' + page.url());

    // Step 6: Check if we need to set password
    await sleep(3000);
    const pwFields = await page.$$('input[type="password"]');
    if (pwFields.length > 0) {
      console.log('6. 设置密码...');
      for (const pw of pwFields) {
        await pw.click();
        await sleep(200);
        await page.keyboard.type(PASSWORD, { delay: 50 });
        await sleep(300);
      }

      const allBtns = await page.$$('button');
      for (const b of allBtns) {
        const d = await b.evaluate(e => e.disabled);
        const disp = await b.evaluate(e => window.getComputedStyle(e).display);
        const text = (await b.textContent() || '').trim();
        if (!d && disp !== 'none' && (text.includes('设置') || text.includes('确') || text.includes('完成') || text.includes('注册') || text.includes('保存'))) {
          console.log('   点击: "' + text + '"');
          await b.click();
          await sleep(10000);
          break;
        }
      }
      console.log('7. 密码后: ' + page.url());
    } else {
      console.log('6. 无需设置密码（可能已存在账号），检查状态...');
    }

    // Final
    console.log('\n最终: ' + page.url());
    await page.screenshot({ path: 'test-results/rustpoint-result.png' });
    console.log('📸 rustpoint-result.png');

    if (page.url().includes('rustpoint') && !page.url().includes('logto')) {
      console.log('✅ 注册/登录成功！');
      console.log('   邮箱: ' + EMAIL);
      console.log('   密码: ' + PASSWORD);
      await ctx.storageState({ path: 'test-results/rustpoint-session.json' });
    } else if (page.url().includes('verification-code')) {
      console.log('⚠️ 仍在验证码页 - 验证码可能无效或过期');
    } else if (page.url().includes('sign-in') || page.url().includes('login')) {
      console.log('⚠️ 跳转到登录页 - 账号可能已存在，请尝试登录');
    } else {
      console.log('⚠️ 未知状态');
    }

  } catch (e) {
    console.error('❌ ' + e.message);
    await page.screenshot({ path: 'test-results/rustpoint-error.png' });
  }

  await ctx.close();
  await browser.close();
  console.log('Done');
}

main();
