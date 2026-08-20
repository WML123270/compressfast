# How to Compress Images for the Web in 2026 (A Practical, No-Nonsense Guide)

Images are still the heaviest thing on almost every web page. According to the HTTP Archive, the median page now ships over **1 MB of images** — often half the total page weight. That's not just a speed problem. It's a bounce-rate problem, a Core Web Vitals problem, and (with image-heavy landing pages) a conversion problem.

The good news: compressing images properly is the single highest-leverage performance win you can make, and it doesn't require a design team. Here's the exact workflow I use, in order of impact.

---

## 1. Resize first (this is the 80/20 win)

Most people skip this step and go straight to "make the file smaller." Don't.

A 4000×3000 photo from your phone is ~12 megapixels. But it's almost certainly being displayed at 800px wide or less. If you resize it to the actual display size **before** compressing, you often cut 70–90% of the weight with zero visible quality loss — because you're throwing away pixels nobody can see.

Rule of thumb: never serve an image larger than 2× its display size (for retina screens).

## 2. Pick the right format

The format you choose matters as much as the compression. The short version:

- **Photos** → WebP (or AVIF if you can afford the encode time)
- **Logos, icons, screenshots** → PNG (or SVG for vector)
- **Animated content** → WebP or GIF
- **Compatibility-first** → JPEG still works everywhere

WebP is the safe default today — 25–35% smaller than JPEG with 96%+ browser support. AVIF is even smaller (30–50% vs JPEG) but slower to encode. If you want the full breakdown with real numbers, I wrote a [complete guide on choosing a web image format](https://compressfast.site/en/guides/best-image-format-for-web).

## 3. Compress with the right loss settings

There are two fundamentally different kinds of compression, and mixing them up is the #1 mistake:

- **Lossless** — no pixels change, ever. PNG via tools like oxipng. Expect 20–60% savings, and it's perfect when every pixel matters (screenshots, line art, logos).
- **Lossy** — throws away detail the eye can't see. JPEG/WebP at 75–85% quality typically saves 50–70% while looking identical at normal zoom.

For a deep dive on the difference — and how to choose — see [how to compress images for web](https://compressfast.site/en/guides/how-to-compress-images-for-web).

## 4. Strip metadata

Every photo from a camera or phone carries EXIF data — GPS coordinates, camera model, timestamp, sometimes a thumbnail. It's pure dead weight (often 10–50 KB per image) and, in the case of GPS, a genuine privacy leak if you serve originals. Strip it before publishing. Always.

## 5. Do it without uploading your files

One thing I wish more people knew: **you don't need to upload your images to a server to compress them.** Browser-side compression has been possible for years, and it's dramatically faster (no upload/download round-trip) and more private (your files never leave your device).

The test is simple: open a compression tool, disconnect your internet, and try compressing. If it still works, it's running locally in Web Workers — your images never touched a server.

That's the approach I took when I built [CompressFast](https://compressfast.site), a browser-based compressor that handles PNG, JPEG, WebP, AVIF, GIF, BMP, SVG and HEIC, batches up to 30 images, and downloads a ZIP — all on-device.

---

## The email-attachment special case

Compressing for email is a different beast from compressing for the web: you have a hard size ceiling (usually 25 MB, but many corporate servers cap at 10 MB), and the recipient might open it on anything from a 5K monitor to an old Android phone.

The fix is almost always the same two steps: resize the long edge to ~1600px (a 4000px photo is massive overkill for email) and export as JPEG at 75–85%. A 5 MB phone photo becomes ~500 KB. I wrote a dedicated walkthrough on [compressing images for email attachments](https://compressfast.site/en/guides/compress-images-for-email).

---

## Quick checklist

- [ ] Resize to actual display size (or 2× for retina)
- [ ] Photos → WebP/AVIF, logos → PNG/SVG
- [ ] Lossy 75–85% for photos, lossless for screenshots/line art
- [ ] Strip EXIF/GPS metadata
- [ ] Verify on slow 4G before shipping
- [ ] Prefer tools that process locally (no upload)

If you only remember one thing: **resize first, then compress.** Everything else is optimization on top of that.
