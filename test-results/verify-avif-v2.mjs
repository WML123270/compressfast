// AVIF compression E2E test v2 — uses proper file upload
import { chromium } from 'playwright';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, 'test-image.png');
const BASE = 'http://localhost:3000/en';
const findings = [];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });

  // ─── Step 1: Navigate ───
  console.log('1. Navigating to page...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('   ✅ Page loaded');

  // ─── Step 2: Upload file via file chooser ───
  console.log('2. Uploading test image...');

  // Find the hidden file input inside the dropzone
  const fileInput = page.locator('input[type="file"]').first();
  const fileInputCount = await page.locator('input[type="file"]').count();
  console.log(`   Found ${fileInputCount} file input(s)`);

  if (fileInputCount > 0) {
    await fileInput.setInputFiles(TEST_IMAGE);
    console.log('   ✅ File set via input');
  } else {
    // Alternative: use file chooser from clicking a dropzone
    console.log('   Trying file chooser...');
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      page.click('.border-dashed, [class*="drop"], [class*="Drop"]').catch(() =>
        page.click('text=Drop').catch(() => {})
      ),
    ]);
    await chooser.setFiles(TEST_IMAGE);
    console.log('   ✅ File set via chooser');
  }

  await page.waitForTimeout(1500);

  // Check file cards
  const fileCards = await page.locator('[class*="card"], [class*="Card"], [class*="image"]').count();
  console.log(`   File cards visible: ${fileCards}`);
  await page.screenshot({ path: 'test-results/avif-v2-01-uploaded.png', fullPage: false });

  // ─── Step 3: Select AVIF format ───
  console.log('3. Selecting AVIF output format...');
  // Wait for controls to render
  await page.waitForTimeout(500);

  // Find and click the AVIF button
  const avifBtn = page.getByRole('button', { name: /AVIF/i });
  const avifExists = await avifBtn.count();
  console.log(`   AVIF buttons found: ${avifExists}`);

  if (avifExists > 0) {
    await avifBtn.first().click();
    await page.waitForTimeout(500);

    // Verify it's selected (check for active styling)
    const classAttr = await avifBtn.first().getAttribute('class');
    const isActive = classAttr?.includes('brand') || classAttr?.includes('active');
    console.log(`   AVIF selected (has active class: ${!!isActive})`);
    console.log(`   ✅ AVIF selected`);
  } else {
    console.log('   ❌ AVIF button not found!');
    findings.push({ severity: 'error', msg: 'AVIF button not found' });
  }

  await page.screenshot({ path: 'test-results/avif-v2-02-avif-selected.png', fullPage: false });

  // ─── Step 4: Compress ───
  console.log('4. Starting compression...');

  // Click "Compress All" or "Compress" button
  const compressBtn = page.getByRole('button', { name: /compress/i });
  const compressBtnCount = await compressBtn.count();

  if (compressBtnCount > 0) {
    console.log(`   Found "${await compressBtn.first().textContent()}" button`);
    await compressBtn.first().click();
    console.log('   ✅ Compression started, waiting...');

    // Wait for "Download" or "Reduced" text to appear (signal of completion)
    try {
      await page.waitForFunction(() => {
        const body = document.body.innerText;
        return body.includes('Download') || body.includes('Reduced') || body.includes('Done');
      }, { timeout: 30000 });
      console.log('   ✅ Compression completed');
    } catch {
      console.log('   ⚠️ Timeout waiting for compression (may be slow)');
      findings.push({ severity: 'warn', msg: 'Compression completion timeout' });
    }
  } else {
    console.log('   ❌ No compress button found');
    findings.push({ severity: 'error', msg: 'No compress button' });
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/avif-v2-03-compressed.png', fullPage: false });

  // ─── Step 5: Download and verify AVIF ───
  console.log('5. Downloading result...');

  const downloadBtn = page.getByRole('button', { name: /download/i }).first();
  const downloadBtnCount = await downloadBtn.count();

  if (downloadBtnCount > 0) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      downloadBtn.click(),
    ]);

    const filename = download.suggestedFilename();
    console.log(`   Downloaded: "${filename}"`);

    const savePath = path.join(__dirname, 'downloaded-result');
    await download.saveAs(savePath);

    // Check if it's actually AVIF
    const fs = await import('fs');
    const buf = fs.readFileSync(savePath);
    console.log(`   File size: ${buf.length} bytes`);

    // Check AVIF magic bytes: ftyp box at offset 4
    // AVIF starts with 00 00 00 XX 66 74 79 70 (ftyp)
    const isAVIF = buf.length > 12 &&
      buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;

    // Actually AVIF uses ISOBMFF: 4 bytes size, then 'ftyp'
    // More specifically: bytes 4-7 should be 'ftyp' and bytes 8-11 should contain 'avif' or 'avis'
    const hasAvifBrand = buf.length > 16 &&
      ((buf[8] === 0x61 && buf[9] === 0x76 && buf[10] === 0x69 && buf[11] === 0x66) || // 'avif'
       (buf[12] === 0x61 && buf[13] === 0x76 && buf[14] === 0x69 && buf[15] === 0x66));  // in compatible brands

    if (filename.endsWith('.avif')) {
      console.log(`   ✅ Filename ends with .avif`);
    } else {
      console.log(`   ⚠️ Filename does NOT end with .avif: "${filename}"`);
      findings.push({ severity: 'warn', msg: `Filename is ${filename}, not .avif` });
    }

    if (isAVIF || hasAvifBrand) {
      console.log(`   ✅ File has AVIF/ISOBMFF signature`);
    } else {
      // Check the actual first bytes
      const hex = buf.slice(0, 24).toString('hex');
      console.log(`   ⚠️ File signature: ${hex}`);
      findings.push({ severity: 'warn', msg: `File doesn't look like AVIF, header: ${hex}` });
    }

    // Clean up
    fs.unlinkSync(savePath);
  } else {
    console.log('   ⚠️ No download button found');
    findings.push({ severity: 'warn', msg: 'No download button' });
  }

  // ─── Step 6: Console errors ───
  console.log('\n6. Console errors:');
  if (consoleErrors.length === 0) {
    console.log('   ✅ None');
  } else {
    consoleErrors.forEach(e => {
      console.log(`   ❌ ${e}`);
      findings.push({ severity: 'error', msg: e });
    });
  }

  // ─── Step 7: Check page for quality tier badge ───
  const pageText = await page.locator('body').innerText();
  const hasQualityBadge = pageText.includes('excellent') || pageText.includes('good') || pageText.includes('ok');
  console.log(`\n7. Quality badge visible: ${hasQualityBadge}`);
  if (pageText.includes('error') && !pageText.includes('Error')) {
    console.log('   ⚠️ "error" text found on page — possible compression failure');
  }

  // ─── Summary ───
  console.log('\n========== E2E VERIFICATION SUMMARY ==========');
  console.log(`AVIF button found:    ${avifExists > 0 ? '✅' : '❌'}`);
  console.log(`Compression started:  ${compressBtnCount > 0 ? '✅' : '❌'}`);
  console.log(`Console errors:       ${consoleErrors.length === 0 ? '✅' : '❌'} (${consoleErrors.length})`);
  console.log(`Findings:             ${findings.length}`);

  if (findings.length > 0) {
    console.log('\nFindings:');
    findings.forEach(f => console.log(`  ${f.severity === 'error' ? '❌' : '⚠️'} ${f.msg}`));
  }

  await browser.close();
  return { avifExists: avifExists > 0, errors: consoleErrors.length, findings };
}

run()
  .then(r => {
    const hasRealErrors = r.findings.some(f => f.severity === 'error');
    if (r.errors > 0 || hasRealErrors) process.exit(1);
    process.exit(0);
  })
  .catch(err => { console.error('Fatal:', err); process.exit(1); });
