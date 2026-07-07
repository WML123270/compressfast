// AVIF compression end-to-end test
import { chromium } from 'playwright';
import * as fs from 'fs';

const BASE = 'http://localhost:3000/en';
const findings = [];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(`PAGE: ${err.message}`);
  });

  // ─── Step 1: Navigate ───
  console.log('1. Navigating...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // ─── Step 2: Create a test PNG and inject via DragEvent ───
  console.log('2. Creating test PNG and injecting...');

  // Create a real PNG file via canvas in the browser and trigger the dropzone
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 400, 300);
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('AVIF TEST', 100, 160);

      canvas.toBlob((blob) => {
        // Dispatch paste event with the image
        const file = new File([blob], 'avif-test.png', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);

        // Try dispatching paste event (the app supports Ctrl+V paste)
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
        });
        document.dispatchEvent(pasteEvent);

        setTimeout(() => resolve(true), 500);
      }, 'image/png');
    });
  });

  await page.waitForTimeout(1500);

  // Check if files appeared
  const fileCount = await page.evaluate(() => {
    const cards = document.querySelectorAll('[class*="ImageCard"], [class*="card"]');
    return cards.length;
  });
  console.log(`   Files detected: ${fileCount}`);

  // Try clicking AVIF button
  console.log('3. Selecting AVIF format...');
  const avifBtn = await page.$('button:has-text("AVIF")');
  if (!avifBtn) {
    console.log('   ❌ AVIF button not found!');
    findings.push({ severity: 'error', msg: 'AVIF button not found' });
    await page.screenshot({ path: 'test-results/avif-e2e-no-btn.png', fullPage: true });
    await browser.close();
    return { avifVisible: false };
  }

  await avifBtn.click();
  await page.waitForTimeout(300);
  console.log('   AVIF selected.');

  // Set quality to a lower value for faster compression
  console.log('4. Setting quality...');
  // Click the "Balanced" preset (Q50) to set quality
  const balancedBtn = await page.$('button:has-text("Balanced")');
  if (balancedBtn) {
    await balancedBtn.click();
    await page.waitForTimeout(300);
    console.log('   Balanced preset selected.');
  }

  await page.screenshot({ path: 'test-results/avif-e2e-before-compress.png', fullPage: true });

  // ─── Step 5: Click compress ───
  console.log('5. Clicking compress...');

  // Find the compress button
  const compressBtn = await page.$('button:has-text("Compress All")');
  if (!compressBtn) {
    console.log('   ❌ Compress button not found!');
    // Try to find any compress button
    const allBtns = await page.$$('button');
    for (const btn of allBtns) {
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('compress')) {
        console.log(`   Found button: "${text}"`);
      }
    }
    findings.push({ severity: 'error', msg: 'Compress button not found' });
    await page.screenshot({ path: 'test-results/avif-e2e-no-compress.png', fullPage: true });
    await browser.close();
    return { compressed: false };
  }

  await compressBtn.click();
  console.log('   Compress clicked, waiting for completion...');

  // Wait for compression to complete (max 30 seconds)
  let compressed = false;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000);
    // Check if any "Download" or "Done" indicators appear
    const downloadBtn = await page.$('button:has-text("Download")');
    const doneIndicators = await page.$$('text=Reduced');
    if (downloadBtn || doneIndicators.length > 0) {
      compressed = true;
      console.log(`   Compression completed after ${i + 1}s`);
      break;
    }
  }

  await page.screenshot({ path: 'test-results/avif-e2e-after-compress.png', fullPage: true });

  if (!compressed) {
    console.log('   ⚠️ Compression may not have completed within timeout');
    findings.push({ severity: 'warn', msg: 'Compression timeout' });
  }

  // ─── Step 6: Check for download and AVIF file ───
  console.log('6. Attempting download...');

  // Listen for download
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

  const downloadBtn = await page.$('button:has-text("Download")');
  if (downloadBtn) {
    await downloadBtn.click();
    const download = await downloadPromise;
    if (download) {
      const path = await download.path();
      const suggestedFilename = download.suggestedFilename();
      console.log(`   Download: ${suggestedFilename}`);
      console.log(`   Path: ${path}`);

      if (suggestedFilename && suggestedFilename.endsWith('.avif')) {
        console.log('   ✅ Downloaded file is AVIF!');
      } else if (suggestedFilename) {
        console.log(`   ⚠️ Downloaded file is not AVIF: ${suggestedFilename}`);
        findings.push({ severity: 'warn', msg: `Downloaded file is ${suggestedFilename}, expected .avif` });
      }

      // Check file size
      if (path) {
        const stats = fs.statSync(path);
        console.log(`   File size: ${stats.size} bytes`);
      }
    } else {
      console.log('   ⚠️ No download event captured');
      findings.push({ severity: 'warn', msg: 'No download captured' });
    }
  } else {
    console.log('   ⚠️ No download button found');
    findings.push({ severity: 'warn', msg: 'No download button' });
  }

  // ─── Step 7: Console errors ───
  console.log('\n7. Console errors:');
  if (consoleErrors.length === 0) {
    console.log('   ✅ None');
  } else {
    consoleErrors.forEach(e => {
      console.log(`   ❌ ${e}`);
      findings.push({ severity: 'error', msg: e });
    });
  }

  // ─── Summary ───
  console.log('\n=== E2E SUMMARY ===');
  console.log(`Files loaded: ${fileCount > 0}`);
  console.log(`AVIF visible: true`);
  console.log(`Compressed: ${compressed}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Findings: ${findings.length}`);

  findings.forEach(f => console.log(`  ${f.severity === 'error' ? '❌' : '⚠️'} ${f.msg}`));

  await browser.close();
  return { compressed, errors: consoleErrors.length, findings };
}

run()
  .then(r => {
    if (r.errors > 0 || r.findings.some(f => f.severity === 'error')) process.exit(1);
    process.exit(0);
  })
  .catch(err => { console.error('Fatal:', err); process.exit(1); });
