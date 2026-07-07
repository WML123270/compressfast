// AVIF feature verification script
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000/en';
const findings = [];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleMessages.push(`[PAGE ERROR] ${err.message}`);
    findings.push({ severity: 'error', msg: `Page error: ${err.message}` });
  });

  // ─── Step 1: Navigate to the page ───
  console.log('Step 1: Navigating to page...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/avif-01-home.png', fullPage: false });
  console.log('  Page loaded.');

  // ─── Step 2: Check if AVIF format option is visible ───
  console.log('Step 2: Looking for AVIF format option...');
  // First, we need to add a file to see the controls. Let's create a test canvas image.
  // Use a data URL approach — inject a test file via the page

  // Create a small test PNG using canvas and add it via DataTransfer
  const testImageCreated = await page.evaluate(() => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      // Draw something recognizable
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(0, 0, 200, 150);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px sans-serif';
      ctx.fillText('AVIF Test', 40, 80);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(100, 40, 20, 0, Math.PI * 2);
      ctx.fill();

      canvas.toBlob((blob) => {
        const file = new File([blob], 'test-avif.png', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);

        // Dispatch drop event on the page
        const dropZone = document.querySelector('[class*="drop"]') ||
                         document.querySelector('div');
        if (dropZone) {
          const dropEvent = new DragEvent('drop', {
            dataTransfer: dt,
            bubbles: true,
            cancelable: true,
          });
          dropZone.dispatchEvent(dropEvent);
        }

        // Also try the file input if it exists
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          const dt2 = new DataTransfer();
          dt2.items.add(file);
          fileInput.files = dt2.files;
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        resolve(!!blob);
      }, 'image/png');
    });
  });

  console.log(`  Test image created: ${testImageCreated}`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/avif-02-after-drop.png', fullPage: false });

  // Check if controls are now visible (they appear when files are present)
  const controlsVisible = await page.isVisible('text=Compress');
  console.log(`  Controls visible: ${controlsVisible}`);

  if (!controlsVisible) {
    // Try clicking the dropzone area to trigger file input
    console.log('  Trying alternative upload method...');
    // Use the file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      page.click('text=Choose files').catch(() => page.click('text=Select').catch(() => {})),
    ]);
    if (fileChooser) {
      // We need an actual file on disk — let's create one
      console.log('  File chooser appeared, but need a real file.');
    }
  }

  // ─── Step 3: Check for AVIF in format options ───
  console.log('Step 3: Checking AVIF format presence...');
  const formatSection = await page.$('text=Output Format');
  const formatSectionVisible = !!formatSection;
  console.log(`  "Output Format" label visible: ${formatSectionVisible}`);

  // Try to find AVIF button
  const avifButton = await page.$('button:has-text("AVIF")');
  console.log(`  AVIF button found: ${!!avifButton}`);

  if (avifButton) {
    const avifText = await avifButton.textContent();
    console.log(`  AVIF button text: "${avifText}"`);
  } else {
    findings.push({ severity: 'warn', msg: 'AVIF button not found in format options' });
  }

  await page.screenshot({ path: 'test-results/avif-03-formats.png', fullPage: true });

  // ─── Step 4: Try clicking AVIF ───
  if (avifButton) {
    console.log('Step 4: Clicking AVIF format...');
    await avifButton.click();
    await page.waitForTimeout(500);

    // Check if it's highlighted/active
    const avifActive = await avifButton.evaluate(el => {
      return el.classList.contains('border-brand-500') ||
             el.className.includes('brand') ||
             el.getAttribute('aria-pressed') === 'true';
    });
    console.log(`  AVIF appears active: ${avifActive}`);
  }

  // ─── Step 5: Check console for errors ───
  console.log('\nStep 5: Console messages during session:');
  const errors = consoleMessages.filter(m => m.includes('[error]') || m.includes('[PAGE ERROR]'));
  const warnings = consoleMessages.filter(m => m.includes('[warning]'));
  console.log(`  Errors: ${errors.length}, Warnings: ${warnings.length}`);
  if (errors.length > 0) {
    errors.forEach(e => {
      console.log(`  ❌ ${e}`);
      findings.push({ severity: 'error', msg: e });
    });
  }
  if (warnings.length > 0) {
    warnings.slice(0, 5).forEach(w => console.log(`  ⚠️ ${w}`));
  }

  // ─── Step 6: Screenshot final state ───
  await page.screenshot({ path: 'test-results/avif-04-final.png', fullPage: true });

  // ─── Summary ───
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`AVIF button visible: ${!!avifButton}`);
  console.log(`Console errors: ${errors.length}`);
  console.log(`Total findings: ${findings.length}`);

  if (findings.length > 0) {
    console.log('\nFindings:');
    findings.forEach(f => console.log(`  ${f.severity === 'error' ? '❌' : '⚠️'} ${f.msg}`));
  }

  await browser.close();
  return { avifVisible: !!avifButton, errors: errors.length, findings };
}

run()
  .then(result => {
    if (result.errors > 0 || result.findings.some(f => f.severity === 'error')) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
