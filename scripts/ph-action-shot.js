const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = 'docs/ph-screenshots';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });

  // Create a colorful test PNG in-memory
  const testImagePath = path.join(outDir, '_test-image.png');
  // Generate a small colorful image with node canvas or just use an existing one
  // Let's create an SVG then convert... actually simplest: download a sample
  
  // Since we don't have a test image, let's create a simple one using raw PNG bytes
  // Minimal 100x100 red PNG
  const pngData = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG header
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x64,0x00,0x00,0x00,0x64, // 100x100
    0x08,0x02,0x00,0x00,0x00,0xFF,0x80,0x02,
    0x03,0x00,0x00,0x00,0x0D,0x49,0x44,0x41,
    0x54,0x78,0xDA,0x63,0x60,0x60,0x60,0x00,
    0x00,0x00,0x04,0x00,0x01,0x27,0x34,0x0A,
    0xE8,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
    0x44,0xAE,0x42,0x60,0x82
  ]);
  
  // Use a simple approach: create a canvas element and convert to blob
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    // Draw a colorful gradient
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#4ecdc4');
    gradient.addColorStop(1, '#45b7d1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 200);
    // Add some text
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('Test', 75, 110);
    // Store as data URL in window
    window.__testImageDataUrl = canvas.toDataURL('image/png');
  });

  // Get the data URL and create a File object
  const fileHandle = await page.evaluate(async () => {
    const dataUrl = window.__testImageDataUrl;
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'test-compression.png', { type: 'image/png' });
    
    // Create DataTransfer to simulate drop
    const dt = new DataTransfer();
    dt.items.add(file);
    return true;
  });

  // Trigger the dropzone via the file input
  const input = page.locator('input[type="file"]');
  // Create actual file and set it
  const tmpDir = require('os').tmpdir();
  const tmpFile = path.join(tmpDir, 'test-compress.png');
  
  // Create a valid small test PNG
  await page.evaluate(async () => {
    const dataUrl = window.__testImageDataUrl;
    const blob = await (await fetch(dataUrl)).blob();
    const arrayBuffer = await blob.arrayBuffer();
    window.__testImageBuffer = Array.from(new Uint8Array(arrayBuffer));
  });
  
  const buffer = await page.evaluate(() => window.__testImageBuffer);
  fs.writeFileSync(tmpFile, Buffer.from(buffer));
  
  // Set the file input
  await input.setInputFiles(tmpFile);
  await page.waitForTimeout(2000);

  // Wait for compression to complete
  try {
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).some(b => b.textContent.includes('Download') || b.textContent.includes('ZIP'));
    }, { timeout: 15000 });
  } catch(e) {
    console.log('Compression might still be running...');
  }
  await page.waitForTimeout(1000);

  // Click preview toggle to show comparison slider
  const previewBtn = page.locator('button[title="Toggle Preview"], button[title="对比预览"]');
  if (await previewBtn.count() > 0) {
    await previewBtn.first().click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: `${outDir}/06-compression-comparison.png`, fullPage: false });
  console.log('6/6 - Compression comparison');
  
  // Cleanup
  fs.unlinkSync(tmpFile);
  await browser.close();
  console.log('Done!');
})();
