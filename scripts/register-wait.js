/**
 * RustPoint 注册 - 等待验证码模式
 *
 * 用法: node scripts/register-wait.js
 *
 * 1. 自动填写邮箱并发送验证码
 * 2. 轮询等待 code.txt 中出现验证码
 * 3. 用户手动将验证码写入 code.txt
 * 4. 自动填入并完成注册
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAIL = '756971388@qq.com';
const PASSWORD = 'Jsy@2025Tuya!';
const CODE_FILE = path.join(__dirname, '..', 'test-results', 'code.txt');
const READY_FILE = path.join(__dirname, '..', 'test-results', 'ready.txt');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForCode(timeoutMs = 120000) {
  console.log('⏳ 等待验证码...');
  console.log('   请在 QQ 邮箱查收验证码');
  console.log('   收到后运行: echo 验证码 > test-results/code.txt');
  console.log('');

  // Write READY signal
  fs.writeFileSync(READY_FILE, 'ready');

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const code = fs.readFileSync(CODE_FILE, 'utf-8').trim();
      if (/^\d{6}$/.test(code)) return code;
    } catch (e) {
      // file doesn't exist yet
    }
    await sleep(2000);
  }
  return null;
}

async function main() {
  // Clean up previous files
  try { fs.unlinkSync(CODE_FILE); } catch {}
  try { fs.unlinkSync(READY_FILE); } catch {}

  console.log('=== RustPoint 注册 (等待模式) ===');
  console.log('邮箱: ' + EMAIL);
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
    // Step 1: Navigate to register
    console.log('1. 打开注册页...');
    await page.goto('https://rustpoint.com/nav/submit', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(4000);
    await page.click('button:has-text("登录")');
    await sleep(8000);
    await page.click('a:has-text("注册")');
    await sleep(5000);
    console.log('   注册页: ' + page.url());

    // Step 2: Fill email
    await page.evaluate(email => {
      const el = document.querySelector('input[name="identifier"]');
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      s.call(el, email);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, EMAIL);
    await sleep(500);

    // Step 3: Send verification code
    console.log('2. 发送验证码...');
    await page.click('button:visible:has-text("注册")');
    await sleep(6000);
    console.log('   验证码已发送到: ' + EMAIL);
    console.log('');

    // Step 4: Wait for user to provide code
    const code = await waitForCode();

    if (!code) {
      console.log('❌ 等待超时，未收到验证码');
      await browser.close();
      return;
    }

    console.log('   收到验证码: ' + code);

    // Step 5: Enter code using keyboard (more reliable)
    console.log('3. 键入验证码...');
    await page.waitForSelector('input[name="passcode_0"]', { timeout: 5000 });
    const firstField = await page.$('input[name="passcode_0"]');
    await firstField.click();
    await sleep(300);
    await page.keyboard.type(code, { delay: 150 });
    await sleep(1000);
    console.log('   验证码已输入');

    // Step 6: Submit code - find enabled button
    const buttons = await page.$$('button');
    let btnClicked = false;
    for (const b of buttons) {
      const disabled = await b.evaluate(e => e.disabled);
      const display = await b.evaluate(e => window.getComputedStyle(e).display);
      if (!disabled && display !== 'none') {
        const txt = (await b.textContent() || '').trim();
        console.log('4. 点击: "' + txt + '"');
        await b.click();
        btnClicked = true;
        await sleep(10000);
        break;
      }
    }
    if (!btnClicked) {
      console.log('4. 按 Enter 提交...');
      await page.keyboard.press('Enter');
      await sleep(8000);
    }
    console.log('5. 验证后: ' + page.url());

    // Step 7: Set password if needed
    const pwFields = await page.$$('input[type="password"]');
    if (pwFields.length > 0) {
      console.log('5. 设置密码...');
      // Use keyboard input for React compatibility
      await pwFields[0].click();
      await sleep(200);
      await page.keyboard.type(PASSWORD, { delay: 50 });
      await sleep(500);
      if (pwFields.length > 1) {
        await pwFields[1].click();
        await sleep(200);
        await page.keyboard.type(PASSWORD, { delay: 50 });
        await sleep(500);
      }

      // Find enabled button
      const allBtns = await page.$$('button');
      for (const b of allBtns) {
        const d = await b.evaluate(e => e.disabled);
        const disp = await b.evaluate(e => window.getComputedStyle(e).display);
        if (!d && disp !== 'none') {
          console.log('6. 点击: "' + ((await b.textContent())||'').trim() + '"');
          await b.click();
          await sleep(10000);
          break;
        }
      }
      console.log('7. 密码后: ' + page.url());
    }

    // Final
    console.log('\n最终: ' + page.url());
    if (page.url().includes('rustpoint') && !page.url().includes('logto')) {
      console.log('✅ 注册+登录成功！');
      console.log('   邮箱: ' + EMAIL);
      console.log('   密码: ' + PASSWORD);
      fs.writeFileSync('test-results/rustpoint-logged-in.json', JSON.stringify(await ctx.storageState()));
      console.log('   状态已保存');
    } else {
      const errorMsg = await page.$('[class*="error"], [class*="Error"]');
      if (errorMsg) console.log('错误: ' + (await errorMsg.textContent())?.trim());
      await page.screenshot({ path: 'test-results/register-failed.png' });
    }
  } catch (e) {
    console.error('❌ ' + e.message);
  }

  await ctx.close();
  await browser.close();
  console.log('Done');
}

main();
