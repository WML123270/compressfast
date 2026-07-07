const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

(async () => {
  const outDir = 'docs/ph-screenshots';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });

  // Create 2 test images
  const tmpDir = os.tmpdir();
  const files = [];
  
  for (let i = 1; i <= 2; i++) {
    const buffer = await page.evaluate(async (idx) => {
      const canvas = new OffscreenCanvas(300, 200);
      const ctx = canvas.getContext('2d');
      const colors = [['#ff6b6b','#4ecdc4'], ['#a855f7','#eab308']];
      const g = ctx.createLinearGradient(0, 0, 300, 200);
      g.addColorStop(0, colors[idx-1][0]);
      g.addColorStop(1, colors[idx-1][1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 300, 200);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.fillText('Photo ' + idx, 100, 110);
      const blob = await canvas.convertToBlob({type: 'image/png'});
      const buf = await blob.arrayBuffer();
      return Array.from(new Uint8Array(buf));
    }, i);
    const filePath = path.join(tmpDir, `test${i}.png`);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    files.push(filePath);
  }

  // Upload both images at once
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(files);
  console.log('2 images uploaded');

  // Wait for "Compress All" button to appear
  await page.waitForTimeout(1000);

  // Click "Compress All"
  const compressBtn = page.locator('button', { hasText: /Compress|压缩/ });
  if (await compressBtn.count() > 0) {
    await compressBtn.first().click();
    console.log('Compression started');
  }

  // Wait for compression to complete (look for Download buttons)
  await page.waitForTimeout(5000);
  
  // Try to wait for finished state
  try {
    await page.waitForFunction(() => {
      const imgs = document.querySelectorAll('img');
      let doneCount = 0;
      // Check for green/reduced text indicators
      const text = document.body.innerText;
      return text.includes('Reduced') || text.includes('saved') || text.includes('减小');
    }, { timeout: 20000 });
    console.log('Compression done');
  } catch(e) {
    console.log('Waiting a bit more...');
    await page.waitForTimeout(5000);
  }

  // Click preview toggle on first image to show comparison
  const previewBtns = page.locator('button[title="Toggle Preview"], button[title="对比预览"]');
  if (await previewBtns.count() > 0) {
    await previewBtns.first().click();
    await page.waitForTimeout(500);
    console.log('Preview opened');
  }

  await page.screenshot({ path: `${outDir}/06-compression-batch.png`, fullPage: false });
  console.log('Screenshot saved!');
  
  // Cleanup
  files.forEach(f => { try { fs.unlinkSync(f); } catch{} });
  await browser.close();
})();
