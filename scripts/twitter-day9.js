const sharp = require('sharp');
const fs = require('fs');

const OUT = 'C:/Users/Administrator/png-compressor/test-results/twitter/day9-tech-stack.png';
const W = 1200, H = 900;

async function main() {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#162032"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="#0b1420"/>
  <rect width="${W}" height="3" fill="url(#cyan)"/>

  <!-- Title -->
  <text x="${W/2}" y="72" text-anchor="middle" font-size="40" font-weight="bold" font-family="Arial, sans-serif" fill="#f1f5f9">Stack for a $0/month Image Tool</text>
  <text x="${W/2}" y="112" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#94a3b8">The browser does everything. I just wrote the glue.</text>

  <!-- Tech Cards Row -->
  <g transform="translate(60, 170)">
    <!-- Next.js -->
    <rect x="0" y="0" width="200" height="210" rx="12" fill="#1a2332" stroke="#334155" stroke-width="1"/>
    <rect x="30" y="0" width="140" height="3" fill="#f8f9fa" rx="1.5"/>
    <text x="100" y="65" text-anchor="middle" font-size="42" font-family="Arial, sans-serif">⚡</text>
    <text x="100" y="110" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial, sans-serif" fill="#f8f9fa">Next.js</text>
    <text x="100" y="140" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#94a3b8">Free tier</text>
    <text x="100" y="162" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#64748b">App Router</text>

    <!-- Zustand -->
    <rect x="220" y="0" width="200" height="210" rx="12" fill="#1a2332" stroke="#334155" stroke-width="1"/>
    <rect x="250" y="0" width="140" height="3" fill="#f59e0b" rx="1.5"/>
    <text x="320" y="65" text-anchor="middle" font-size="42" font-family="Arial, sans-serif">🐻</text>
    <text x="320" y="110" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial, sans-serif" fill="#f59e0b">Zustand</text>
    <text x="320" y="140" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#94a3b8">Tiny state</text>
    <text x="320" y="162" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#64748b">No boilerplate</text>

    <!-- Tailwind -->
    <rect x="440" y="0" width="200" height="210" rx="12" fill="#1a2332" stroke="#334155" stroke-width="1"/>
    <rect x="470" y="0" width="140" height="3" fill="#06b6d4" rx="1.5"/>
    <text x="540" y="65" text-anchor="middle" font-size="42" font-family="Arial, sans-serif">🎨</text>
    <text x="540" y="110" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial, sans-serif" fill="#06b6d4">Tailwind</text>
    <text x="540" y="140" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#94a3b8">Dark theme</text>
    <text x="540" y="162" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#64748b">Out of the box</text>

    <!-- Web Workers -->
    <rect x="660" y="0" width="200" height="210" rx="12" fill="#1a2332" stroke="#334155" stroke-width="1"/>
    <rect x="690" y="0" width="140" height="3" fill="#10b981" rx="1.5"/>
    <text x="760" y="65" text-anchor="middle" font-size="42" font-family="Arial, sans-serif">⚙️</text>
    <text x="760" y="110" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial, sans-serif" fill="#10b981">Web Workers</text>
    <text x="760" y="140" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#94a3b8">Processing</text>
    <text x="760" y="162" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#64748b">Off main thread</text>

    <!-- oxipng WASM -->
    <rect x="880" y="0" width="200" height="210" rx="12" fill="#1a2332" stroke="#334155" stroke-width="1"/>
    <rect x="910" y="0" width="140" height="3" fill="#f97316" rx="1.5"/>
    <text x="980" y="65" text-anchor="middle" font-size="42" font-family="Arial, sans-serif">🦀</text>
    <text x="980" y="110" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial, sans-serif" fill="#f97316">oxipng WASM</text>
    <text x="980" y="140" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#94a3b8">Lossless</text>
    <text x="980" y="162" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#64748b">PNG optimization</text>
  </g>

  <!-- Divider -->
  <line x1="320" y1="430" x2="880" y2="430" stroke="#1e293b" stroke-width="1"/>

  <!-- Cost Highlight -->
  <rect x="300" y="470" width="600" height="110" rx="14" fill="#134e4a" stroke="#0d9488" stroke-width="1.5"/>
  <text x="${W/2}" y="522" text-anchor="middle" font-size="44" font-weight="bold" font-family="Arial, sans-serif" fill="#2dd4bf">$0 / month</text>
  <text x="${W/2}" y="555" text-anchor="middle" font-size="17" font-family="Arial, sans-serif" fill="#5eead4">Infra cost</text>

  <!-- Bottom message -->
  <text x="${W/2}" y="650" text-anchor="middle" font-size="21" font-family="Arial, sans-serif" fill="#e2e8f0">Domain + coffee = entire burn rate</text>
  <text x="${W/2}" y="682" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" fill="#94a3b8">No server costs. No database. No cloud bill.</text>

  <!-- CTA -->
  <line x1="480" y1="740" x2="720" y2="740" stroke="#1e293b" stroke-width="1"/>
  <text x="${W/2}" y="775" text-anchor="middle" font-size="14" font-weight="bold" font-family="Arial, sans-serif" fill="#06b6d4">compressfast.site</text>
  <text x="${W/2}" y="810" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#475569">100% browser-side · your images never leave your device</text>

  <!-- Hash tags -->
  <text x="${W/2}" y="855" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#334155">#buildinpublic #webdev</text>
</svg>`;

  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 11, g: 20, b: 32, alpha: 1 } }
  })
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .png()
    .toFile(OUT);

  console.log(`✅ Generated: ${OUT}`);
}

main().catch(console.error);
