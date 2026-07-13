const sharp = require('sharp');
const fs = require('fs');

const SRC = 'C:/Users/Administrator/png-compressor/test-results/tweet-source.jpg';
const OUT = 'C:/Users/Administrator/png-compressor/test-results/tweet-day1.png';

async function main() {
  const meta = await sharp(SRC).metadata();
  const srcSizeKB = Math.round(fs.statSync(SRC).size / 1024);

  // Compress the FULL-RESOLUTION image to get realistic compressed file size
  const fullResCompressed = await sharp(SRC).jpeg({ quality: 70, mozjpeg: true }).toBuffer();
  const compressedKB = Math.round(fullResCompressed.length / 1024);
  const pct = Math.round((1 - compressedKB / srcSizeKB) * 100);

  console.log(`Full-res: ${srcSizeKB}KB → q70: ${compressedKB}KB → -${pct}%`);
  console.log(`Both display at same visual size, only the file is ${pct}% smaller`);

  // Build the card
  const W = 1200, H = 800, PAD = 32, GAP = 16;
  const TOP = 96, BOT = 74;
  const slotW = (W - PAD * 2 - GAP) / 2;
  const slotH = H - TOP - BOT;
  const scale = Math.min(slotW / meta.width, slotH / meta.height);
  const iw = Math.round(meta.width * scale);
  const ih = Math.round(meta.height * scale);

  // Both displayed at same size — visually identical at this resolution
  const leftBuf = await sharp(SRC).resize(iw, ih).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  const rightBuf = await sharp(SRC).resize(iw, ih).jpeg({ quality: 70, mozjpeg: true }).toBuffer();

  const leftX = PAD + Math.round((slotW - iw) / 2);
  const rightX = PAD + slotW + GAP + Math.round((slotW - iw) / 2);
  const iy = TOP + Math.round((slotH - ih) / 2);

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${W/2}" y="46" text-anchor="middle" font-size="28" font-weight="bold" font-family="Arial" fill="#e2e8f0">Same photo. Can you spot the difference?</text>
  <rect x="${W/4-56}" y="62" width="112" height="26" rx="4" fill="#1e293b"/>
  <text x="${W/4}" y="81" text-anchor="middle" font-size="14" font-weight="bold" font-family="Arial" fill="#94a3b8">ORIGINAL</text>
  <rect x="${W*3/4-56}" y="62" width="112" height="26" rx="4" fill="#134e4a"/>
  <text x="${W*3/4}" y="81" text-anchor="middle" font-size="14" font-weight="bold" font-family="Arial" fill="#2dd4bf">COMPRESSED</text>
  <line x1="${W/2}" y1="${iy}" x2="${W/2}" y2="${iy+ih}" stroke="#1e293b" stroke-width="2" stroke-dasharray="8,6"/>
  <text x="${W/4}" y="${H-44}" text-anchor="middle" font-size="30" font-weight="bold" font-family="Arial" fill="#f87171">${srcSizeKB} KB</text>
  <text x="${W/4}" y="${H-20}" text-anchor="middle" font-size="14" font-family="Arial" fill="#64748b">Original file</text>
  <text x="${W*3/4}" y="${H-44}" text-anchor="middle" font-size="30" font-weight="bold" font-family="Arial" fill="#4ade80">${compressedKB} KB</text>
  <text x="${W*3/4}" y="${H-20}" text-anchor="middle" font-size="14" font-family="Arial" fill="#64748b">Compressed file</text>
  <rect x="${W/2-90}" y="${H-72}" width="180" height="34" rx="17" fill="none" stroke="#059669" stroke-width="2"/>
  <text x="${W/2}" y="${H-50}" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial" fill="#4ade80">{ -${pct}% }</text>
  <text x="${W/2}" y="${H-6}" text-anchor="middle" font-size="12" font-family="Arial" fill="#475569">compressfast.site — 100% browser-side, zero uploads</text>
</svg>`;

  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 11, g: 20, b: 32, alpha: 1 } }
  })
    .composite([
      { input: await sharp({ create: { width: W, height: 3, channels: 4, background: { r: 6, g: 182, b: 212, alpha: 1 } } }).png().toBuffer(), top: 0, left: 0 },
      { input: leftBuf, top: iy, left: leftX },
      { input: rightBuf, top: iy, left: rightX },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .png()
    .toFile(OUT);

  console.log(`✅ ${OUT}`);
}

main().catch(console.error);
