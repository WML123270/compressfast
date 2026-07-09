# CompressFast — $24.99 Lifetime, Privacy-First Image Compressor

## The Product

**CompressFast** is a browser-side image compression tool. No uploads. No accounts. No subscriptions.

- PNG / JPEG / WebP / AVIF / GIF / BMP / SVG / HEIC
- Up to 500 images/batch (Pro)
- Quality slider + speed control + target KB mode
- Batch rename, watermark, scene presets
- 100% local processing — files never leave the browser

**Stack:** Next.js 14 + React 18 + TailwindCSS + Zustand + Web Workers + WASM codecs

## The Numbers (Week 1)

| Metric | Value |
|--------|-------|
| Price | $24.99 lifetime (not subscription) |
| Payment | Creem (supports Visa/MC) |
| Activation | License key model (no accounts) |
| Product Hunt | Launched 2026-07-07 |
| Deploy | Vercel (free tier) + custom domain |
| Tech stack costs | $0/month (Vercel free + Upstash Redis free) |

## Why I Built This

Every "free online compressor" uploads your images to a server. They claim to delete them after processing, but:

1. You can't verify that
2. EXIF data (GPS, camera serial, timestamps) gets exposed
3. Several tools have been caught training AI on user uploads

I wanted a tool where you can disconnect your internet and it still works. Try that with TinyPNG.

## What's Working

- **Word of mouth** — the privacy angle resonates. People share it specifically because "it doesn't upload."
- **HEIC support** — iPhone users desperately need this and most tools don't handle it well
- **The comparison slider** — before/after preview that users can drag to see the difference. High engagement.
- **License key model** — no password resets, no GDPR headaches. The code IS the account.
- **AVIF gated behind Pro** — clear value proposition. Users can SEE the 50% size reduction.

## What's Not Working (Yet)

- **AVIF encoding is slow** (200-500ms per image via WASM). Users on "Best" speed setting wait ~4s per image. Need to optimize or set expectations.
- **Creem still in KYC review** for the production checkout URL. Currently using test mode redirect.
- **China market waiting on ICP filing** (government approval for web hosting). 2-3 week process.
- **Reddit karma too low** to post in most subreddits. New account problems.

## Revenue Model

```
$24.99 one-time purchase
    ├── Activation key (XXXX-XXXX-XXXX)
    ├── Up to 5 devices
    ├── Stored in Upstash Redis ($0 on free tier)
    └── Email delivery via Resend ($0 on free tier)

Total monthly cost: $0
Profit on first sale: $24.99 - Creem fees (~3%)
```

The math works because:
- No server costs (client-side processing + Vercel free tier)
- No support overhead (no accounts = no password resets)
- Creem handles all payment/vat/tax complexity

## What I'd Do Differently

1. **Launch with AVIF from day 1.** It's the #1 Pro conversion feature.
2. **Ship the comparison slider earlier.** Users love it, it builds trust instantly.
3. **Prepare marketing materials BEFORE Product Hunt launch.** I scrambled to write copy the day of.
4. **Create social proof before launching.** A few testimonials would have gone a long way.

## Ask the Community

- Has anyone succeeded with the license key → Creem model long-term? How's churn?
- Any tips for Reddit promotion without getting flagged as spam?
- What's the best channel for reaching web developers who care about image optimization?

**Try it:** [compressfast.site](https://compressfast.site)
