# How I Built a Privacy-First Image Compressor with Next.js + Web Workers

> Zero uploads. 100% browser-side. Here's the architecture behind CompressFast.

---

I recently shipped **[CompressFast](https://compressfast.site)** — a browser-based image compression tool that processes everything locally. No files ever touch a server. Here's how I built it, what went wrong, and what I'd do differently.

## The Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | SSG for landing pages, API routes for licensing |
| State | Zustand | Lightweight, no boilerplate, works great with Workers |
| Compression | Web Worker + OffscreenCanvas | Non-blocking UI, multi-threaded processing |
| AVIF Encoder | `@jsquash/avif` (WASM) | Browser Canvas API can't encode AVIF |
| Lossless PNG | `@jsquash/oxipng` (WASM) | True lossless optimization |
| Styling | TailwindCSS | Productivity, dark mode via `class` strategy |
| i18n | Custom 200+ key dictionary | Lightweight, no runtime overhead |
| Payments | Creem + Upstash Redis | License key model, no user accounts |

## Architecture: The Compression Pipeline

The core is a **Web Worker** that handles everything heavy:

```
Main Thread                    Web Worker
    │                              │
    ├─ User drops 30 images        │
    ├─ postMessage(buffer, opts) ──►
    │                          decodeImage()
    │                          (createImageBitmap → OffscreenCanvas)
    │                              │
    │                          resize? (calcResizeDims + high-quality scaling)
    │                              │
    │                          applyTransform? (rotation + flip via canvas matrix)
    │                              │
    │                          applyWatermark? (text or image overlay)
    │                              │
    │                          compressRegular() or compressToTarget()
    │                              │
    │                     ┌───────┴────────┐
    │                     │                │
    │                encodeImage()    encodeAvif()
    │                (canvas API)     (@jsquash WASM)
    │                     │                │
    │                     └───────┬────────┘
    │                             │
    │              EXIF injection? (JPEG only, optional)
    │                             │
    │   ◄── postMessage({ type:'done', buffer, size })
    │
    ├─ Create Blob → saveAs() download
```

### Speed Tiers

Instead of a single quality slider, I built a **speed-based adaptive pipeline**:

```typescript
// Speed → compression level mapping
function sp2level(s: number): number {
  if (s <= 2) return 4   // Best: 8 quality tiers, 4 scale steps
  if (s <= 5) return 2   // Balanced: 4 tiers, 2 scale steps
  return 1               // Fast: 2 tiers, no scaling
}

// For large images, pre-scale before compression at low speed tiers
function getPreScale(speed: number, pxCount: number): number {
  if (pxCount > 2_000_000) return 0.8   // >2MP: scale to 80%
  if (pxCount > 1_000_000) return 0.6   // >1MP: scale to 60%
  return 1
}
```

This means "Fast" mode skips expensive operations — it pre-scales large images and tries fewer quality levels. "Best" mode does 8 quality iterations with 4 scale steps, finding the optimal balance.

## Target KB Mode: Binary Search Over Quality

The trickiest feature was "compress to exactly N KB." It's essentially an optimization problem:

```typescript
async function compressToTarget(img, targetBytes, speed, mime) {
  const qualities = getKBQualityLevels(speed)  // [95,90,80,70,50,30,15,5]
  const scales = getKBScales(speed)            // [1, 0.75, 0.5, 0.25]

  let bestBuf, bestSize = Infinity

  for (const scale of scales) {
    const src = scale === 1 ? img : scaleImageFast(img, scale)
    for (const q of qualities) {
      const buf = await encodeImage(src, mime, q)
      // Keep whichever is closest to target size
      if (Math.abs(buf.size - targetBytes) < Math.abs(bestSize - targetBytes)) {
        bestBuf = buf; bestSize = buf.size
      }
      // Within 10% tolerance → good enough
      if (buf.size <= targetBytes * 1.1 && buf.size >= targetBytes * 0.9) break
    }
    if (bestSize <= targetBytes * 1.15) break
  }
  return { buf: bestBuf, size: bestSize }
}
```

## The HEIC Problem

HEIC (iPhone photos) was a headache. The `heic2any` library requires `window` — it crashes in Workers. Solution: decode HEIC on the main thread, then pass the decoded PNG buffer to the Worker:

```typescript
// Main thread only
async function decodeHEICOnMain(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const heic2any = (await import('heic2any')).default
  const blob = new Blob([buffer], { type: 'image/heic' })
  const result = await heic2any({ blob, toType: 'image/png' })
  const pngBlob = Array.isArray(result) ? result[0] : result
  return pngBlob.arrayBuffer()
}
```

This was one of those bugs that took 2 hours to debug and 5 lines to fix. Classic.

## Pro Features Without a Database

I didn't want to build auth. So I used a **license key model**:

1. User pays on Creem → webhook fires
2. Server generates `XXXX-XXXX-XXXX` code → stores in Upstash Redis
3. Email with code sent via Resend
4. User enters code → verified against Redis, device fingerprint tracked
5. Max 5 devices per code

No passwords. No sessions. No user tables. The activation code IS the account.

## AVIF: The Secret Weapon

AVIF encoding isn't available via Canvas API, so I use `@jsquash/avif` — a WASM encoder compiled from libavif. The results are staggering:

```
Same visual quality:
  JPEG: 100KB
  WebP:  70KB  
  AVIF:  50KB ← 50% smaller than JPEG
```

I gated AVIF behind Pro — it's a clear value proposition. Users can SEE the size difference in the comparison slider.

## What I Learned

1. **Workers can't access `window`.** Seems obvious. Still tripped me up 3 times.
2. **Canvas `.convertToBlob('image/avif')` doesn't exist.** You need a WASM encoder.
3. **OffscreenCanvas is amazing** but `createImageBitmap` with `resizeQuality: 'high'` gives better scaling than manual pixel manipulation.
4. **i18n doesn't need a library.** A 200-key dictionary with `useContext` is simpler and faster.
5. **License keys > user accounts** for simple tools. No password resets, no GDPR headaches.

## Try It

**[compressfast.site](https://compressfast.site)** — free for 30 images/batch, Pro for $24.99 lifetime.

Source available on request. Happy to answer questions in the comments!

---

*Tags: #nextjs #webdev #javascript #tutorial #architecture*
