// AVIF E2E test v3 — robust file upload
import { chromium } from 'playwright';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

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
  console.log('1. Navigating...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('   ✅ Page loaded');

  // ─── Step 2: Upload via direct file input injection ───
  console.log('2. Uploading test image...');

  // Listen for file chooser
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);

  // Click the dropzone area to trigger file input
  const dropZoneClickables = [
    'text=Drop your images here',
    'text=or click to browse',
  ];

  let clicked = false;
  for (const sel of dropZoneClickables) {
    try {
      const el = page.locator(sel);
      if (await el.count() > 0) {
        await el.click();
        clicked = true;
        console.log(`   Clicked "${sel}"`);
        break;
      }
    } catch {}
  }

  if (!clicked) {
    // Try clicking the dropzone div
    console.log('   Trying click on dropzone area...');
    await page.click('text=Supported formats');
    clicked = true;
  }

  const chooser = await chooserPromise;
  if (chooser) {
    await chooser.setFiles(TEST_IMAGE);
    console.log('   ✅ File set via chooser');
  } else {
    console.log('   ❌ No file chooser appeared');
    findings.push({ severity: 'error', msg: 'Cannot upload file - no file chooser' });
    await page.screenshot({ path: 'test-results/avif-v3-no-chooser.png', fullPage: true });
    await browser.close();
    return { uploaded: false };
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/avif-v3-01-uploaded.png', fullPage: false });

  // Check if file cards appeared
  const hasCompressBtn = await page.locator('button:has-text("Compress All")').count();
  console.log(`   Compress button visible: ${hasCompressBtn > 0}`);

  if (hasCompressBtn === 0) {
    // Check the page state
    const bodyText = await page.locator('body').innerText();
    console.log(`   Page text sample: ${bodyText.substring(0, 300)}`);
    findings.push({ severity: 'error', msg: 'Image not loaded - no compress button' });
    await browser.close();
    return { uploaded: false };
  }

  // ─── Step 3: Select AVIF ───
  console.log('3. Selecting AVIF format...');
  const avifBtn = page.getByRole('button', { name: /AVIF/i });
  if (await avifBtn.count() > 0) {
    await avifBtn.first().click();
    await page.waitForTimeout(500);
    console.log('   ✅ AVIF selected');
  } else {
    console.log('   ❌ AVIF button not found');
    findings.push({ severity: 'error', msg: 'AVIF button missing' });
  }

  await page.screenshot({ path: 'test-results/avif-v3-02-selected.png', fullPage: false });

  // ─── Step 4: Compress ───
  console.log('4. Compressing...');
  const compressBtn = page.getByRole('button', { name: /compress/i });
  await compressBtn.first().click();
  console.log('   Compression started...');

  // Wait for completion
  try {
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Reduced') ||
             document.body.innerText.includes('Download All') ||
             document.body.innerText.includes('Download Done');
    }, { timeout: 60000 });
    console.log('   ✅ Compression done');
  } catch {
    console.log('   ⚠️ Compression timeout');
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/avif-v3-03-compressed.png', fullPage: false });

  // ─── Step 5: Download individual file ───
  console.log('5. Testing individual download...');

  // Find individual "Download" button on the card (not batch "Download All")
  const allDownloadBtns = page.getByRole('button', { name: /^Download$/i });
  const count = await allDownloadBtns.count();
  console.log(`   Individual download buttons: ${count}`);

  if (count > 0) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      allDownloadBtns.first().click(),
    ]);

    const filename = download.suggestedFilename();
    console.log(`   Individual download: "${filename}"`);

    if (filename.endsWith('.avif')) {
      console.log('   ✅ Filename ends with .avif');
    } else {
      console.log(`   ❌ Expected .avif, got "${filename}"`);
      findings.push({ severity: 'error', msg: `Individual download wrong ext: ${filename}` });
    }
  }

  // ─── Step 6: Test batch download ───
  console.log('6. Testing batch download...');
  const batchBtn = page.getByRole('button', { name: /download all|download done/i });
  const batchCount = await batchBtn.count();

  if (batchCount > 0) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      batchBtn.first().click(),
    ]);

    const filename = download.suggestedFilename();
    const savePath = path.join(__dirname, 'batch-download');
    await download.saveAs(savePath);

    console.log(`   Batch download: "${filename}"`);
    const stats = fs.statSync(savePath);
    console.log(`   Size: ${stats.size} bytes`);

    // For ZIP, check if filename is correct
    if (filename.endsWith('.zip')) {
      console.log('   ✅ Batch download is ZIP (correct)');
      // To fully verify, we'd need to inspect ZIP contents
      // But the ZIP name from ImageList is hardcoded as 'compressed_images.zip'
    }

    fs.unlinkSync(savePath);
  } else {
    console.log('   ⚠️ No batch download button');
  }

  // ─── Step 7: Console check ───
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
  console.log('\n========== VERIFICATION SUMMARY ==========');
  console.log(`Upload:      ${hasCompressBtn > 0 ? '✅' : '❌'}`);
  console.log(`AVIF button: ${(await avifBtn.count()) > 0 ? '✅' : '❌'}`);
  console.log(`No JS errors: ${consoleErrors.length === 0 ? '✅' : '❌'}`);
  findings.forEach(f => console.log(`  ${f.severity === 'error' ? '❌' : '⚠️'} ${f.msg}`));

  await browser.close();
  return { ok: findings.filter(f => f.severity === 'error').length === 0, findings };
}

run()
  .then(r => process.exit(r.ok ? 0 : 1))
  .catch(err => { console.error('Fatal:', err); process.exit(1); });
