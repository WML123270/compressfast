/**
 * Convert captured PNG frames to a standard-compliant GIF using gifenc
 * Usage: node scripts/make-gif.mjs
 */
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const FRAMES_DIR = 'test-results/gif-frames';
const OUTPUT = 'test-results/batch-compress.gif';

async function main() {
  let files = fs.readdirSync(FRAMES_DIR)
    .filter(f => f.endsWith('.png'))
    .sort();

  // Select key frames
  const selected = [files[0], files[1]];
  for (let i = 2; i < files.length - 1; i += 2) {
    selected.push(files[i]);
  }
  if (!selected.includes(files[files.length - 1])) {
    selected.push(files[files.length - 1]);
  }
  files = selected;
  console.log(`${files.length} frames`);

  // Read and resize all frames
  const frames = [];
  let width, height;

  for (const file of files) {
    const img = sharp(path.join(FRAMES_DIR, file));
    const { data, info } = await img
      .resize(Math.floor(1212 * 0.45), Math.floor(2270 * 0.45), { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (!width) { width = info.width; height = info.height; }
    frames.push({ data: new Uint8ClampedArray(data), width: info.width, height: info.height, delay: 200 });
  }

  // Slow down first and last frames
  frames[0].delay = 500;
  frames[1].delay = 400;
  frames[frames.length - 1].delay = 500;

  console.log(`Encoding ${frames.length} frames at ${width}x${height}...`);

  // Quantize all frames to a shared palette
  const palette = quantize(frames[0].data, 256);

  // Encode GIF
  const gif = GIFEncoder();

  for (const frame of frames) {
    const { data, width, height } = frame;
    // Resize frame data to match if needed
    const indexed = applyPalette(
      new Uint8ClampedArray(data),
      palette
    );

    gif.writeFrame(indexed, width, height, {
      palette,
      delay: frame.delay,
      repeat: 0,
    });
  }

  gif.finish();
  const buffer = gif.bytes();
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`GIF saved: ${OUTPUT} (${(buffer.length / 1024).toFixed(0)}KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
