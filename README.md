# CompressFast

**Browser-side image compression tool — 100% local processing, zero uploads.**

[![Live Demo](https://img.shields.io/badge/demo-compressfast.site-blue)](https://compressfast.site)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> Drop images → compress in browser → download. Nothing leaves your device. Works offline.

## Features

- 🔒 **100% Browser-Side** — All processing happens locally. Files never touch a server.
- 📦 **8 Formats** — PNG, JPEG, WebP, AVIF, GIF, BMP, SVG, HEIC
- ⚡ **Batch Processing** — Up to 20 images at once (500 for Pro)
- 🎯 **Target Size** — Compress to exact KB
- 🖼️ **Format Conversion** — Convert between formats in one click
- 📐 **Resize** — Set width/height while compressing
- 🔄 **Rotate & Flip** — Built-in image transforms
- 🏷️ **Watermark** — Text or image watermark support
- 🧹 **EXIF Stripping** — Remove GPS, camera data, metadata
- 🎨 **Quality Presets** — Low / Medium / High with live preview
- 📊 **Visual Comparison** — Side-by-side before/after
- 📥 **ZIP Download** — One-click download all compressed files
- 🌐 **Offline Ready** — Works without internet (PWA)

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js (App Router) |
| State | Zustand |
| Styling | Tailwind CSS |
| Compression | Canvas API + Web Workers + oxipng WASM |
| HEIC Decode | heic2any |
| ZIP | JSZip |

**Infra cost: $0/month** — no servers, no database, no cloud storage.

## Live Demo

👉 **[compressfast.site](https://compressfast.site)** — International (English)

👉 **[jisuyatu.com](https://jisuyatu.com)** — China (中文)

## Pro

- $24.99 lifetime (one-time payment)
- 500 images/batch, AVIF output, custom presets, watermark
- Pay via [Creem](https://creem.io)

## Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Architecture

```
app/          — Next.js pages (home, vs-tinypng, pro, tools/*)
components/   — React components (compressor, layout, seo, ui)
lib/          — Core logic (compression worker, store, i18n, stats)
scripts/      — Build & deployment scripts
public/       — Static assets (sw.js, manifest, robots.txt)
```

## License

MIT — see [LICENSE](LICENSE)
