# Twitter Day 17 — 5个图片压缩误区

> 教育型 Thread，容易引发讨论和转发。

---

## 主推文

5 image compression myths that cost you time and quality 🧵

(Myth #3 is the one most people get wrong)

---

## Thread

**1/6 — Myth: "Lossless compression always keeps perfect quality"**

Reality: True lossless preserves every pixel, but it's rarely the best choice.

A 5MB PNG → lossless → maybe 4.8MB. 
Same PNG → lossy at 85% quality → 400KB WebP.

The difference is invisible to the human eye. Lossy ≠ bad.

**2/6 — Myth: "I need to resize before compressing"**

Nope. Modern compression tools handle both in one step.

Set your max width (e.g., 1920px) + quality level → done.

A 6000×4000 photo compressed at 80% quality with width=1920 goes from 8MB → ~300KB. In one drag-and-drop.

**3/6 — Myth: "Online compressors are safe because they say so"**

This is the dangerous one.

Most "free online compressors" upload your images to a server. You have zero control over what happens next.

They could be:
- Storing your images forever
- Training AI on them
- Mining metadata (GPS location, device info)

Always check: does it say "processed locally" or "browser-based"?

**4/6 — Myth: "JPEG is always the best format for web"**

Not anymore. WebP is 25-35% smaller at the same quality. AVIF is even better (~50% smaller than JPEG).

Browser support for WebP: 96%+. 
Browser support for AVIF: 93%+.

Unless you're targeting IE11 users, use WebP.

**5/6 — Myth: "I need Photoshop to compress images properly"**

A browser tab can do it now. Seriously.

Modern Web APIs (Canvas, OffscreenCanvas, WASM) handle image processing entirely client-side.

No install. No upload. Just open a URL and drag files in.

**6/6 — The tool I built around these principles:**

→ compressfast.site

✅ All processing is local (browser-based)
✅ Batch compression (up to 20 files free, unlimited on Pro)
✅ Format conversion (WebP ↔ JPG ↔ PNG)
✅ Works on mobile and desktop

$24.99 lifetime for unlimited. No subscription. No AI training on your data.

---

## 配图建议
- 可以配一张对比图：lossless vs lossy 85% 的视觉差异（几乎看不出）
- 或者一个简单的 "Myths → Facts" 卡片图
