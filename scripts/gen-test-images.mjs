import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const bases = [
  'C:/Users/Administrator/Desktop/4c0bd44d056c0a685be9e342a621b29f.jpg',
  'C:/Users/Administrator/Desktop/fc64f5bf5f9d5fb8709ae946a809bbc7.jpg',
  'C:/Users/Administrator/Desktop/微信图片_2026-07-09_110950_926.jpg',
  'C:/Users/Administrator/Desktop/微信图片_20260712132151_6_363.jpg',
].filter(f => fs.existsSync(f));

const dir = 'test-results/batch-test';
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

async function generate() {
  let count = 0;

  for (const base of bases) {
    const meta = await sharp(base).metadata();
    console.log(`Base: ${path.basename(base)} ${meta.width}x${meta.height}`);

    for (let v = 0; v < 8 && count < 30; v++) {
      const scale = 0.6 + Math.random() * 0.35;
      const w = Math.floor(meta.width * scale);
      const h = Math.floor(meta.height * scale);
      const brightness = 0.8 + Math.random() * 0.4;
      const saturation = 0.7 + Math.random() * 0.5;
      const hue = Math.floor((Math.random() - 0.5) * 30);

      const outName = `img-${String(count + 1).padStart(2, '0')}.jpg`;
      await sharp(base)
        .resize(w, h, { fit: 'cover', position: sharp.strategy.entropy })
        .modulate({ brightness, saturation, hue })
        .jpeg({ quality: 95 })
        .toFile(path.join(dir, outName));

      const stat = fs.statSync(path.join(dir, outName));
      console.log(`  ${outName}  ${w}x${h}  ${(stat.size / 1024).toFixed(0)}KB`);
      count++;
    }
  }
  console.log(`Done: ${count} images in ${dir}`);
}

generate().catch(console.error);
