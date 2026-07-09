# Why Your Image Compressor Should Never Upload Files

> Every "free online compressor" is reading your images. Here's how to tell — and how to build one that doesn't.

---

You just exported 50 product photos from Lightroom. You google "compress images online." You drag them into the first result. Within seconds, "compressed" downloads appear.

But what actually happened?

## The Upload Problem

Every cloud-based image compressor — TinyPNG, iLoveIMG, Compressor.io — follows the same pattern:

```
Your Browser                    Their Server
    │                                │
    ├── POST /upload (50 images) ──►│  Your photos are now on their disk
    │                                │
    │                      ┌─────────┴──────────┐
    │                      │  Compress           │
    │                      │  Store?             │
    │                      │  Train AI on?       │
    │                      │  Sell metadata?     │
    │                      └─────────┬──────────┘
    │                                │
    │   ◄── GET /download ──────────┤
    │                                │
    │  Did they delete them? Who knows.
```

The privacy policy might say "we delete your files after processing." But you have exactly zero way to verify that.

## What's Actually in Your Images

Even a simple JPEG contains:

- **EXIF GPS coordinates** — exactly where the photo was taken (within meters)
- **Camera model + serial number** — uniquely identifies your device
- **Timestamp** — when you took it
- **Thumbnail** — a smaller embedded preview, often un-cropped
- **Software tags** — which version of Photoshop/Lightroom you use

Someone with access to 50 of your photos can determine:
- Where you live (cluster the GPS coordinates)
- What devices you own (camera serial numbers)
- Your daily routine (timestamps)
- Whether you use pirated software (software tags are surprisingly detailed)

This isn't theoretical. In 2023, a major "free compressor" was caught using uploaded images to train an AI upscaler. Their privacy policy was updated AFTER the outcry.

## The Local-Processing Alternative

**[CompressFast](https://compressfast.site)** — the tool I built — works differently:

```
Main Thread                 Web Worker
    │                           │
    ├─ User drops 30 images     │
    ├─ Read as ArrayBuffer      │
    ├─ postMessage(buffer) ────►│
    │                      decodeImage()
    │                      compress()
    │                      encodeImage()
    │   ◄── postMessage(result) │
    │                           │
    ├─ Create Blob              │
    ├─ saveAs() download        │
    │                           │
    │  Files NEVER leave        │
    │  the browser              │
```

Everything happens inside the browser's JavaScript engine:
- `createImageBitmap()` for decoding
- `OffscreenCanvas` for pixel manipulation
- `canvas.convertToBlob()` or WASM encoders for encoding
- `FileReader` + `Blob` for I/O

## The Technical Challenge

Building a local compressor is harder than a server-side one:

### 1. No native codec access
Servers can shell out to `libjpeg-turbo`, `pngquant`, or `cavif`. Browsers only give you Canvas API — which is JPEG/PNG/WebP only. For AVIF, I had to compile libavif to WASM (`@jsquash/avif`).

### 2. Memory constraints
Servers have 16GB+ RAM. Browsers have ~2GB per tab (less on mobile). Processing a 24MP photo creates multiple copies in memory: original Buffer → ImageData → OffscreenCanvas → compressed Buffer. You need to be disciplined about releasing references.

### 3. HEIC is a nightmare
iOS photos come in HEIC format. Safari can decode HEIC natively, but Chrome can't. The `heic2any` library solves this but requires `window` — it crashes in Web Workers. Solution: decode on main thread, pass result to Worker.

### 4. No filesystem access
You can't "save" to a folder. You can only trigger downloads. For batch output, I use JSZip to bundle everything client-side — no server round-trip needed.

## How to Verify a Tool is Actually Local

Don't trust marketing copy. Here's the real test:

1. **Open DevTools → Network tab**
2. Drag an image into the tool
3. If you see ANY network request with a payload larger than a few KB → it's uploading
4. **Bonus test:** Disconnect your internet. If the tool still works → it's legitimately local

Try this with TinyPNG, iLoveIMG, or any other popular compressor. The Network tab will light up immediately.

With CompressFast, the Network tab stays empty during compression. The only requests are optional analytics pings (which you can see in the source).

## EXIF Stripping: The Privacy Feature Nobody Talks About

CompressFast strips EXIF by default. Not because it's hard — Canvas API strips it automatically on re-encode — but because most users don't know their photos contain GPS data.

But there's a toggle to KEEP EXIF. Why? Some users want it:
- Photographers tracking camera settings per shot
- Archivists preserving metadata
- HDR workflows that need color profile info

The key is **default to safe, opt in to risky.** The opposite of what most tools do.

## The Business Model Question

"How do you make money if you don't sell data?"

CompressFast is freemium:
- **Free:** 30 images/batch, all formats except AVIF
- **Pro ($24.99 lifetime):** 500/batch, AVIF encoding, custom presets, watermark

No accounts. No subscriptions. No data collection. The activation code IS the "account" — stored locally, verified against Redis, up to 5 devices.

It turns out people WILL pay for privacy when it's paired with a great product.

## The Bigger Picture

We've normalized uploading everything to strangers' servers. "Free" tools that process your files, your photos, your documents — all in the cloud, all "for your convenience."

But browsers are powerful now. Web Workers. WASM. OffscreenCanvas. IndexedDB. You can build real, complex applications that run entirely on the client.

Your photos shouldn't leave your machine unless YOU decide they should.

---

**Try CompressFast:** [compressfast.site](https://compressfast.site) — free, no uploads, no accounts.

**Open source?** The core compression logic is shared in [Part 1 of this series](https://dev.to/). I'm happy to open-source the full project if there's interest — drop a comment.

---

*Tags: #privacy #webdev #security #images #browsers*
