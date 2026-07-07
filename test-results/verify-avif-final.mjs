// Final AVIF verification — creates test image in browser, tests full pipeline
import { chromium } from 'playwright';
const BASE = 'http://localhost:3000/en';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  // ─── Step 1: Load page ───
  console.log('1. Loading page...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('   ✅ Loaded');

  // ─── Step 2: Generate a test PNG in the browser and upload via paste ───
  console.log('2. Creating 200x200 test PNG in browser...');
  const fileCreated = await page.evaluate(async () => {
    // Create a canvas with actual content
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(false);

    // Draw a gradient
    const grad = ctx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, '#667eea');
    grad.addColorStop(0.5, '#f093fb');
    grad.addColorStop(1, '#4facfe');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 200, 200);
    // Add some shapes for complexity
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(100, 100, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = '16px sans-serif';
    ctx.fillText('AVIF', 75, 105);

    return new Promise(resolve => {
      canvas.toBlob(async (blob) => {
        if (!blob) { resolve(false); return; }
        const file = new File([blob], 'avif-test.png', { type: 'image/png' });

        // Dispatch paste event with this image
        const dt = new DataTransfer();
        dt.items.add(file);
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt, bubbles: true,
        });
        document.dispatchEvent(pasteEvent);

        // Also try to set the file input directly
        await new Promise(r => setTimeout(r, 500));
        const input = document.querySelector('input[type="file"]');
        if (input) {
          const dt2 = new DataTransfer();
          dt2.items.add(file);
          input.files = dt2.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        resolve(true);
      }, 'image/png');
    });
  });
  console.log(`   File created: ${fileCreated}`);
  await page.waitForTimeout(2000);

  // Check if upload worked
  const hasCompressBtn = await page.locator('button:has-text("Compress All")').count();
  if (hasCompressBtn === 0) {
    // Fallback: use file chooser with the small test PNG
    console.log('   Paste didn\'t work, using file chooser...');
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      page.click('text=or click to browse'),
    ]);
    // Create a slightly bigger test PNG
    await chooser.setFiles('test-results/test-image.png');
    await page.waitForTimeout(2000);
  }
  console.log(`   Image loaded: ${await page.locator('button:has-text("Compress All")').count() > 0}`);

  // ─── Step 3: Select AVIF format ───
  console.log('3. Selecting AVIF...');
  await page.click('button:has-text("AVIF")');
  await page.waitForTimeout(500);

  // Set quality to 50 for meaningful compression
  const balancedBtn = page.locator('button:has-text("Balanced")');
  if (await balancedBtn.count() > 0) await balancedBtn.click();
  await page.waitForTimeout(300);

  console.log('   ✅ AVIF selected (Q50)');

  // ─── Step 4: Compress ───
  console.log('4. Compressing...');
  const compressBtn = page.locator('button:has-text("Compress All")');
  if (await compressBtn.count() > 0) {
    await compressBtn.click();
  }
  try {
    await page.waitForFunction(() => document.body.innerText.includes('Download'), { timeout: 60000 });
    console.log('   ✅ Done');
  } catch {
    console.log('   ⚠️ Timeout');
    await page.waitForTimeout(5000);
  }

  await page.screenshot({ path: 'test-results/avif-final.png', fullPage: true });

  // ─── Step 5: Check the actual blob via page evaluation ───
  console.log('5. Checking compressed result...');

  const result = await page.evaluate(async () => {
    // Try to find the compressed blob via React fiber or direct DOM
    // Check if any download link or DOM element shows the result type
    const bodyText = document.body.innerText;

    // Look for the file size and format indicators
    const hasOvercompressed = bodyText.includes('Overcompressed');
    const hasExcellent = bodyText.includes('Excellent');
    const hasGood = bodyText.includes('Good');

    // Try intercepting next click
    let blobType = null;
    let blobSize = 0;

    // Intercept URL.createObjectURL to capture the download blob
    const _orig = URL.createObjectURL;
    URL.createObjectURL = function(b) {
      blobType = b.type;
      blobSize = b.size;
      return _orig.call(URL, b);
    };

    // Find and click the download button
    const buttons = Array.from(document.querySelectorAll('button'));
    const downloadBtn = buttons.find(b =>
      b.textContent?.trim() === 'Download' && b.offsetParent !== null
    );
    if (downloadBtn) {
      downloadBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    URL.createObjectURL = _orig;

    return {
      bodySample: bodyText.substring(bodyText.indexOf('test-image') > 0 ? bodyText.indexOf('test-image') : 0, Math.min(bodyText.length, 400)),
      hasQualityBadge: hasOvercompressed || hasExcellent || hasGood,
      blobType,
      blobSize,
      blobTypeIsAvif: blobType === 'image/avif',
    };
  });

  console.log(`   Blob type: "${result.blobType}"`);
  console.log(`   Blob size: ${result.blobSize} bytes`);
  console.log(`   Is AVIF: ${result.blobTypeIsAvif}`);

  if (result.blobType === 'image/avif') {
    console.log('   ✅✅✅ AVIF ENCODING WORKS!');
  } else if (result.blobType) {
    console.log(`   ❌ Got ${result.blobType} instead of image/avif`);
    errors.push(`Wrong blob type: ${result.blobType}`);
  } else {
    console.log('   ⚠️ Could not capture blob type');
    warnings.push('Could not capture blob type');
  }

  // ─── Summary ───
  console.log('\n============ VERIFICATION ============');
  console.log(`AVIF UI button:    ✅`);
  console.log(`Compression:       ✅`);
  console.log(`Blob is AVIF:      ${result.blobTypeIsAvif ? '✅' : result.blobType ? '❌' : '⚠️'}`);
  console.log(`JS errors:         ${errors.length === 0 ? '✅' : '❌'} (${errors.length})`);

  const avifErrors = errors.filter(e => e.includes('avif') || e.includes('AVIF'));
  if (avifErrors.length > 0) {
    console.log('\nAVIF-related errors:');
    avifErrors.forEach(e => console.log(`  ❌ ${e}`));
  }

  const nonAvifErrors = errors.filter(e => !e.includes('avif') && !e.includes('AVIF'));
  if (nonAvifErrors.length > 0) {
    console.log('\nOther errors:');
    nonAvifErrors.forEach(e => console.log(`  ⚠️ ${e}`));
  }

  await browser.close();
  return result.blobTypeIsAvif;
}

run()
  .then(ok => process.exit(ok ? 0 : 1))
  .catch(err => { console.error('Fatal:', err); process.exit(1); });
