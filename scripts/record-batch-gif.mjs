/**
 * 录制批量压缩 GIF — 30张真实照片
 * 用法: node scripts/record-batch-gif.mjs
 * 前提: npm run dev 已在 localhost:3000 运行
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(__dirname, '..', 'test-results', 'batch-test');
const FRAMES_DIR = path.join(__dirname, '..', 'test-results', 'gif-frames');
const OUTPUT_GIF = path.join(__dirname, '..', 'test-results', 'batch-compress.gif');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const images = fs.readdirSync(TEST_DIR)
    .filter(f => /\.(jpg|png|jpeg)$/i.test(f))
    .map(f => path.join(TEST_DIR, f));
  console.log(`Found ${images.length} test images`);

  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 2400 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Opening compressor...');
  await page.goto('http://localhost:3000/en', { waitUntil: 'load', timeout: 60000 });
  await sleep(3000);

  // Frame 1: empty
  await page.screenshot({ path: path.join(FRAMES_DIR, 'frame-01-empty.png') });
  console.log('Frame 1: empty state');

  // Upload via file input (react-dropzone hidden input)
  console.log('Uploading 30 photos...');
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(images);
  await sleep(1500);

  // Frame 2: all loaded
  await page.screenshot({ path: path.join(FRAMES_DIR, 'frame-02-loaded.png') });
  console.log('Frame 2: files loaded');

  // Click compress
  const compressBtn = page.locator('button').filter({ hasText: /compress|start|压缩/i }).first();
  await compressBtn.click();
  console.log('Compressing...');

  // Capture frames
  let frameNum = 3;
  const startTime = Date.now();
  let lastDone = 0;

  while (true) {
    await sleep(200);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    await page.screenshot({
      path: path.join(FRAMES_DIR, `frame-${String(frameNum).padStart(2, '0')}.png`)
    });

    // Check done count via DOM
    const doneCount = await page.evaluate(() => {
      return document.querySelectorAll('[class*="status"]').length;
    });
    // Alternative: check for done indicators
    const allVisible = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="item"]');
      const texts = Array.from(cards).map(c => c.textContent?.slice(0, 20));
      return texts.filter(t => t && t.includes('KB')).length;
    });

    if (allVisible !== lastDone) {
      console.log(`Frame ${frameNum}: @ ${elapsed}s (detected ${allVisible} results)`);
      lastDone = allVisible;
    }
    frameNum++;

    // Stop when ZIP/download button appears or 30s passed
    const hasDownload = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => /zip|download|save/i.test(b.textContent || ''));
    });

    if (hasDownload) {
      console.log('Download button appeared!');
      break;
    }
    if (elapsed > 45) break; // safety timeout
  }

  // Final frame
  await sleep(500);
  await page.screenshot({ path: path.join(FRAMES_DIR, `frame-${String(frameNum).padStart(2, '0')}-done.png`) });
  console.log(`Final frame ${frameNum}: done`);

  await browser.close();
  console.log(`Captured ${frameNum} frames`);

  // Create GIF
  await createGif(FRAMES_DIR, OUTPUT_GIF);
}

async function createGif(framesDir, outputPath) {
  const GIFEncoder = (await import('gif-encoder-2')).default;
  const { createCanvas, loadImage } = await import('@napi-rs/canvas');

  let files = fs.readdirSync(framesDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  // Pick key frames: first 2 + every 5th + last
  const selected = [files[0], files[1]];
  for (let i = 2; i < files.length - 1; i += 1) {
    selected.push(files[i]);
  }
  if (!selected.includes(files[files.length - 1])) {
    selected.push(files[files.length - 1]);
  }

  files = selected;
  console.log(`GIF: ${files.length} key frames`);

  const firstFrame = await loadImage(path.join(framesDir, files[0]));
  const scale = 0.45;
  const w = Math.floor(firstFrame.width * scale);
  const h = Math.floor(firstFrame.height * scale);

  const encoder = new GIFEncoder(w, h, 'neuquant', true);
  encoder.setRepeat(0);
  encoder.setQuality(12);
  encoder.start();

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < files.length; i++) {
    const img = await loadImage(path.join(framesDir, files[i]));
    ctx.drawImage(img, 0, 0, w, h);
    encoder.setDelay(i <= 1 || i === files.length - 1 ? 400 : 150);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  const buf = encoder.out.getData();
  fs.writeFileSync(outputPath, buf);
  console.log(`GIF saved: ${outputPath} (${(buf.length / 1024).toFixed(0)}KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
