# Reddit & Hacker News 发帖文案

> **前提**：开 VPN。
> 时区建议：美国东部时间上午 8-10 点发（北京时间晚上 8-10 点），流量最大。

---

## 一、Reddit r/webdev

**URL**: https://www.reddit.com/r/webdev/submit

**Title**:
```
I built a 100% local batch image compressor — files never leave your browser, AVIF output, one-time purchase for Pro
```

**Body**:
```
Hey r/webdev! I wanted to share a tool I built over the past couple months.

**What it is**: CompressFast — an image compression tool that runs entirely in your browser. No uploads, no servers processing your images, no accounts needed.

**Why I built it**: I work with a lot of client images and got tired of uploading sensitive design files to cloud tools just to compress them. Also, most tools either limit you to a few images or push subscriptions. I wanted something that's fast, private, and honest about pricing.

**Tech stack**: Next.js 14, React, Canvas API + Web Workers for compression, Zustand for state. All compression happens client-side via Canvas/ImageBitmap.

**Features**:
- Batch compress 30 images at a time (free)
- 7 input formats: PNG, JPEG, WebP, GIF, BMP, SVG, HEIC
- 5 output formats: PNG, JPEG, WebP, AVIF, BMP
- Resize, rotate, flip, strip EXIF metadata
- Before/after comparison slider
- ZIP download all results
- Dark mode, i18n (English + Chinese)

**Pricing**: Free tier (30 images/batch). Pro is **$24.99 lifetime** — no subscriptions, one activation code works on 5 devices.

**Why local processing matters**: Nothing touches a server. GDPR-friendly by default. No privacy policy headaches. Your images are your business.

Would love any feedback from the community — bugs, feature requests, or just thoughts on the UX. Thanks!

🔗 https://compressfast.site
```

---

## 二、Hacker News Show HN

**URL**: https://news.ycombinator.com/submit

**Title**:
```
Show HN: CompressFast — Local batch image compression with AVIF support
```

**URL**: `https://compressfast.site`

**Text**:
```
I built this because I needed to compress batches of client images without uploading them anywhere — most online tools require you to trust their servers with your files.

All processing is done locally in the browser using Canvas and Web Workers. The site is a static Next.js app hosted on Vercel. Nothing is uploaded to any server — there isn't even a backend for file processing.

Key points:
• 30 images/batch on the free tier, 500 for Pro
• 7 input formats (PNG/JPEG/WebP/GIF/BMP/SVG/HEIC)
• Outputs to PNG, JPEG, WebP, AVIF, BMP
• Built-in resize, rotate, flip, EXIF stripping, before/after comparison
• Pro is a one-time $24.99 purchase, not a subscription (I hate subscriptions too)
• License key system — no accounts, no login

The compression engine uses a mix of Canvas quality control, @jsquash/oxipng for lossless PNG, and @jsquash/avif for AVIF encoding. HEIC input is decoded client-side via heic2any.

Would appreciate any technical feedback on the compression quality or ideas for improvement!
```

---

## 发帖操作

1. **先发 Reddit**（审核快，立刻显示）
2. **再发 HN**（Show HN 需要一点运气上首页）
3. **发完后**：去 Product Hunt 帖子评论区，留一条评论说 "Also posted on Reddit and HN if you want to discuss there"

---

## 注意事项

- Reddit: 用 `r/webdev` 不是 `r/programming`，前者对工具分享更友好
- HN: Show HN 帖子标题必须以 `Show HN:` 开头
- 两个帖子都附上链接 `https://compressfast.site`
- 发完后 1 小时内回复评论，互动会提高排名
