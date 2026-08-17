/**
 * SEO Guide Pages — informational "how-to" landing pages
 * Each guide targets a high-volume informational keyword ("how to compress images",
 * "best image format for web") that tool pages don't rank for. They link out to the
 * interactive tool pages to capture the search intent and push users to convert.
 *
 * Guides are server-rendered (no interactive compressor) so crawlers see full content.
 */
export interface GuideSection {
  headingEn: string
  headingZh: string
  bodyEn: string   // multi-paragraph, split on \n\n
  bodyZh: string
}

export interface GuidePageData {
  slug: string
  titleEn: string
  titleZh: string
  descriptionEn: string
  descriptionZh: string
  keywords: string[]
  heroTitleEn: string
  heroTitleZh: string
  heroSubEn: string
  heroSubZh: string
  introEn: string
  introZh: string
  sections: GuideSection[]
  faqs: { qEn: string; qZh: string; aEn: string; aZh: string }[]
  relatedTools: string[]
}

export const GUIDES: Record<string, GuidePageData> = {
  'how-to-compress-images-for-web': {
    slug: 'how-to-compress-images-for-web',
    titleEn: 'How to Compress Images for Web Without Losing Quality | CompressFast',
    titleZh: '网页图片怎么压缩而不损失画质 | 极速压图',
    descriptionEn: 'A practical guide to compressing images for the web without visible quality loss. Covers PNG, JPEG, WebP, AVIF, resizing, and the tools that do it in your browser — no upload.',
    descriptionZh: '网页图片压缩实用指南：PNG/JPEG/WebP/AVIF 格式选择、尺寸调整、以及浏览器本地压缩工具，画质无可见损失，文件不上传。',
    keywords: ['how to compress images for web', 'compress image for website', 'optimize images for web', 'reduce image size for web', 'web image compression', 'compress images without losing quality', 'image compression for website speed'],
    heroTitleEn: 'How to Compress Images for the Web',
    heroTitleZh: '网页图片如何压缩',
    heroSubEn: 'The practical, no-fluff guide to shrinking images for faster websites — without visible quality loss.',
    heroSubZh: '实用干货指南：如何在画质无明显损失的前提下，把网页图片压到最小。',
    introEn: 'Images make up about 50% of the average web page\'s weight. Every kilobyte you trim is a faster load, a better Core Web Vitals score, and — according to Google — a higher ranking. But "compress" doesn\'t mean "make it look bad." Done right, you can cut file size by 50–80% while keeping images that are visually identical to the original.\n\nThis guide walks through exactly how: choosing the right format, resizing to what you actually need, and compressing without losing quality. Everything below works with CompressFast — a browser-based tool that never uploads your files.',
    introZh: '图片约占普通网页体积的 50%。每减少 1KB，加载就更快一点，Core Web Vitals 分数更高，Google 排名也更靠前。但"压缩"不等于"把图压糊"——做对了，你能把文件体积减小 50–80%，同时图片肉眼看起来和原图一模一样。\n\n本指南一步步讲清楚怎么做：选对格式、按需调整尺寸、无损压缩。下面所有方法都能用极速压图完成——一款纯浏览器工具，文件绝不上传。',
    sections: [
      {
        headingEn: 'Step 1: Pick the right format',
        headingZh: '第一步：选对格式',
        bodyEn: 'The biggest wins come before you ever touch a compression slider. Choose the wrong format and you\'re fighting an uphill battle.\n\n• JPEG — best for photographs and images with lots of color gradients. Not great for text or logos (it introduces artifacts around sharp edges).\n• PNG — best for screenshots, logos, UI elements, and anything with text or transparency. Lossless, but files are larger.\n• WebP — a modern format that\'s 25–35% smaller than JPEG at the same quality. Supported by 96%+ of browsers today.\n• AVIF — even smaller than WebP (typically 30–50% smaller than JPEG), but encodes slower and has slightly newer browser support.\n\nRule of thumb: photos → JPEG or WebP; graphics/screenshots → PNG; anything you can serve in a modern format → WebP or AVIF.',
        bodyZh: '最大的收益发生在你碰压缩滑块之前。格式选错，后面就是在逆风作战。\n\n• JPEG —— 最适合照片和色彩丰富的图片。不适合文字或 Logo（锐利边缘会产生噪点）。\n• PNG —— 最适合截图、Logo、UI 元素，以及任何带文字或透明的图片。无损，但文件更大。\n• WebP —— 现代格式，同等画质比 JPEG 小 25–35%，如今 96%+ 的浏览器都支持。\n• AVIF —— 比 WebP 更小（通常比 JPEG 小 30–50%），但编码更慢，浏览器支持略新。\n\n经验法则：照片 → JPEG 或 WebP；图形/截图 → PNG；能用现代格式就用 WebP 或 AVIF。',
      },
      {
        headingEn: 'Step 2: Resize to the size you actually need',
        headingZh: '第二步：按需调整尺寸',
        bodyEn: 'This is the single most underrated step. A 4000×3000 smartphone photo is 12 megapixels — but a website hero image only needs to be 1600–2000px wide, and a thumbnail needs 300px. Serving full-resolution images wastes 90%+ of their bytes.\n\nResize before you compress. For a blog or product page, 1200–1600px on the longest edge is usually plenty. For retina screens, double the CSS display size. This alone often cuts file size by 70% or more — before any compression.\n\nCompressFast\'s resize tool respects aspect ratio, never upscales small images, and offers one-click presets (50%, 75%, 1080p, 720p).',
        bodyZh: '这是最被低估的一步。一张 4000×3000 的手机照片是 1200 万像素——但网站 hero 图只需要 1600–2000px 宽，缩略图只需要 300px。直接提供全分辨率图片，90% 以上的字节都是浪费。\n\n压缩之前先调尺寸。博客或产品页，长边 1200–1600px 通常绰绰有余。Retina 屏就乘以 2。仅这一步，往往就能在压缩前把体积减小 70% 以上。\n\n极速压图的尺寸调整工具保持宽高比、从不会放大小图，还提供一键预设（50%、75%、1080p、720p）。',
      },
      {
        headingEn: 'Step 3: Compress without losing quality',
        headingZh: '第三步：无损压缩',
        bodyEn: 'Now you compress. The key is understanding the difference between lossless and lossy:\n\n• Lossless compression (PNG via oxipng, or WebP/AVIF lossless) re-encodes the file more efficiently with zero pixel change. Perfect for screenshots, logos, and graphics — typical savings 20–60%.\n• Lossy compression (JPEG, WebP, AVIF) discards data the human eye won\'t miss. At 75–85% quality, most people can\'t tell the difference, and you save 50–80%.\n\nFor JPEG, 75–85% is the "sweet spot" for web. Below 60% is only for thumbnails and previews. Always keep the original as your master — re-compressing an already-compressed JPEG causes generation loss.',
        bodyZh: '接下来才轮到压缩。关键是理解无损和有损的区别：\n\n• 无损压缩（基于 oxipng 的 PNG，或无损 WebP/AVIF）用更高效的方式重新编码文件，像素零变化。最适合截图、Logo、图形——通常减小 20–60%。\n• 有损压缩（JPEG、WebP、AVIF）丢弃人眼察觉不到的数据。75–85% 画质下，大多数人看不出差别，体积却能减小 50–80%。\n\nJPEG 用于网页，75–85% 是"甜点区"。低于 60% 只适合缩略图和预览图。始终保留原图作为母版——对已压缩的 JPEG 反复压缩会造成"世代损失"。',
      },
      {
        headingEn: 'Do it all in your browser — no upload',
        headingZh: '全部在浏览器里完成——不上传',
        bodyEn: 'Most online compressors make you upload files to their server, process them, then download the result. That\'s slow, and it puts your images on someone else\'s machine.\n\nA better approach is client-side compression: the tool loads in your browser, and every operation runs locally in a Web Worker. Your files never leave your device — you can even disconnect the internet after the page loads and it still works.\n\nThis is exactly how CompressFast works. Drop in up to 30 images at once (500 with Pro), compress them in parallel, and download a ZIP of the results. No account, no upload, no waiting on a server queue.',
        bodyZh: '大多数在线压缩工具要求你把文件上传到他们的服务器、处理、再下载结果。那样很慢，而且把你的图片放到了别人的机器上。\n\n更好的做法是客户端压缩：工具加载到浏览器里，每一步都在本地 Web Worker 中运行。文件从不出设备——加载页面后断网都能继续用。\n\n这正是极速压图的工作方式。一次拖入最多 30 张（Pro 版 500 张），并行压缩，一键下载 ZIP 结果。无需注册、无需上传、不用排队等服务器。',
      },
    ],
    faqs: [
      { qEn: 'How much can I compress a web image?', qZh: '网页图片能压缩多少？', aEn: 'Typical results: JPEG at 75–85% quality shrinks 50–80%; lossless PNG optimization saves 20–60%; resizing a full-resolution photo to web dimensions alone often cuts 70%+. Combined, a 4.5MB smartphone photo commonly becomes a 150KB web-ready image — a 97% reduction.', aZh: '典型结果：JPEG 在 75–85% 画质下减小 50–80%；无损 PNG 优化节省 20–60%；仅把全分辨率照片调到网页尺寸往往就能减小 70%+。三者结合，一张 4.5MB 的手机照片通常能变成 150KB 的网页图——减小 97%。' },
      { qEn: 'Does compressing images for web lose quality?', qZh: '压缩网页图片会损失画质吗？', aEn: 'Not if you do it right. Lossless compression changes zero pixels. Lossy compression at 75–85% quality is visually indistinguishable to most people. The visible quality loss comes from over-compressing (below 60%) or repeatedly re-compressing an already-compressed JPEG.', aZh: '做对了就不会。无损压缩像素零变化。有损压缩在 75–85% 画质下大多数人肉眼看不出差别。可见的画质损失来自过度压缩（低于 60%）或反复压缩已压缩过的 JPEG。' },
      { qEn: 'Should I use WebP or JPEG for my website?', qZh: '网站该用 WebP 还是 JPEG？', aEn: 'WebP is the better default in 2026: 25–35% smaller than JPEG at equal quality, supports transparency, and has 96%+ browser support. Use JPEG only if you need maximum compatibility with very old browsers. AVIF is even smaller but encodes slower — great for a build pipeline, overkill for one-off conversions.', aZh: '2026 年 WebP 是更好的默认选择：同等画质比 JPEG 小 25–35%，支持透明，浏览器支持率 96%+。只有在需要兼容极老浏览器时才用 JPEG。AVIF 更小但编码更慢——适合构建流水线，一次性转换有点杀鸡用牛刀。' },
      { qEn: 'What size should web images be?', qZh: '网页图片该用多大尺寸？', aEn: 'Match the image to its display size. Blog/hero images: 1200–1600px on the longest edge. Thumbnails: 300–400px. Multiply by 2 for retina displays. There is almost never a reason to serve a full-resolution 4000px photo on the web.', aZh: '图片尺寸要和显示尺寸匹配。博客/hero 图：长边 1200–1600px。缩略图：300–400px。Retina 屏乘以 2。在网页上几乎没有任何理由提供 4000px 的全分辨率照片。' },
      { qEn: 'Do I need to upload my images to compress them?', qZh: '压缩图片需要上传吗？', aEn: 'No — with a browser-based tool like CompressFast, everything runs locally. This is faster (no upload/download round trip) and more private (your images never touch a server).', aZh: '不需要——用极速压图这类浏览器工具，一切都在本地运行。更快（省去上传下载往返），也更私密（图片从不上服务器）。' },
    ],
    relatedTools: ['compress-images', 'compress-jpeg', 'compress-png', 'convert-to-webp', 'resize-image'],
  },

  'best-image-format-for-web': {
    slug: 'best-image-format-for-web',
    titleEn: 'Best Image Format for Web: JPEG vs PNG vs WebP vs AVIF (2026) | CompressFast',
    titleZh: '网页最佳图片格式：JPEG vs PNG vs WebP vs AVIF（2026）| 极速压图',
    descriptionEn: 'A data-driven comparison of JPEG, PNG, WebP, and AVIF for web use in 2026. Learn which format to use for photos, logos, screenshots, and how much smaller each one gets.',
    descriptionZh: '2026 年网页图片格式数据化对比：JPEG、PNG、WebP、AVIF。照片、Logo、截图分别该用哪种格式，各自能小多少，一文讲清。',
    keywords: ['best image format for web', 'jpeg vs png vs webp', 'webp vs avif', 'image formats for website', 'which image format to use', 'jpeg vs png', 'webp vs jpeg vs avif', 'best format for website images'],
    heroTitleEn: 'Best Image Format for the Web (2026)',
    heroTitleZh: '网页最佳图片格式（2026）',
    heroSubEn: 'JPEG vs PNG vs WebP vs AVIF — a plain-English comparison so you never pick the wrong format again.',
    heroSubZh: 'JPEG vs PNG vs WebP vs AVIF——通俗易懂的对比，让你再也不选错格式。',
    introEn: 'Pick the right image format and your pages get smaller and faster for free. Pick wrong and you\'re shipping 3× the bytes for the same picture.\n\nHere\'s the short version: photos are best as JPEG or WebP; graphics and screenshots as PNG; and when you want the absolute smallest files, WebP or AVIF wins. Below we break down each format with real numbers so you can choose with confidence.',
    introZh: '选对图片格式，页面免费变得又小又快；选错，同样一张图你要多花 3 倍的字节。\n\n先说结论：照片用 JPEG 或 WebP；图形和截图用 PNG；想要文件最小，就选 WebP 或 AVIF。下面我们用真实数据逐个拆解，让你选得有底气。',
    sections: [
      {
        headingEn: 'JPEG — the photographic workhorse',
        headingZh: 'JPEG——照片主力',
        bodyEn: 'JPEG has been the web\'s default photo format since 1992 for one reason: it compresses photographs extremely well using a lossy algorithm tuned to human vision. Gradients, shadows, and fine color detail survive at high quality settings.\n\nWhere it struggles: sharp edges and text. JPEG introduces "ringing" artifacts around high-contrast boundaries, which is why screenshots and logos look bad as JPEG.\n\nBest for: photographs, e-commerce product photos, social media images. Use 75–85% quality for the web.',
        bodyZh: 'JPEG 自 1992 年起就是网页照片的默认格式，原因只有一个：它用针对人眼调优的有损算法，把照片压缩得极好。渐变、阴影、细腻色彩在高画质下都能保留。\n\n它的短板：锐利边缘和文字。JPEG 在高对比边界周围会产生"振铃"伪影，所以截图和 Logo 存成 JPEG 会很难看。\n\n最适合：照片、电商产品图、社媒图片。网页用 75–85% 画质。',
      },
      {
        headingEn: 'PNG — lossless for graphics and text',
        headingZh: 'PNG——图形和文字的无损选择',
        bodyEn: 'PNG is lossless — every pixel is preserved perfectly. That makes it ideal for screenshots, logos, UI elements, icons, and any image containing text or hard edges.\n\nThe downside is size: a PNG screenshot can easily be 2–3MB, several times larger than the same image as a well-compressed WebP or JPEG. That\'s why lossless PNG optimizers (like oxipng) exist — they re-encode the file more efficiently without changing a single pixel, typically saving 20–60%.\n\nBest for: screenshots, logos, icons, diagrams, images with transparency. Always run PNGs through a lossless optimizer before shipping.',
        bodyZh: 'PNG 是无损格式——每个像素都完美保留。这让它成为截图、Logo、UI 元素、图标，以及任何含文字或硬边缘图片的理想选择。\n\n缺点是体积：一张 PNG 截图动辄 2–3MB，是同样图片压缩成 WebP 或 JPEG 的好几倍。所以才有 oxipng 这类无损 PNG 优化器——它们在像素零变化的前提下更高效地重编码，通常能省 20–60%。\n\n最适合：截图、Logo、图标、图表、带透明的图片。PNG 上线前一定要跑一遍无损优化。',
      },
      {
        headingEn: 'WebP — the modern default',
        headingZh: 'WebP——现代默认',
        bodyEn: 'WebP, developed by Google, delivers the best of both worlds: JPEG-quality lossy compression that\'s 25–35% smaller, plus lossless and transparency support (which JPEG lacks).\n\nAt equal visual quality, a WebP photo is roughly 25–35% smaller than the same JPEG. A 2.1MB JPEG commonly becomes a ~186KB WebP at the same quality. Browser support passed 96% years ago — every modern browser renders WebP.\n\nBest for: almost everything on the web today. Photos, product images, and graphics with transparency can all use WebP. Convert your PNG and JPEG to WebP and watch your page weight drop.',
        bodyZh: 'Google 开发的 WebP 兼顾两者：比 JPEG 小 25–35% 的同画质有损压缩，加上 JPEG 所没有的无损和透明支持。\n\n同等画质下，一张 WebP 照片比同款 JPEG 小 25–35%。一张 2.1MB 的 JPEG，同画质转 WebP 通常能到 186KB 左右。浏览器支持率多年前就超过 96%——所有现代浏览器都能渲染 WebP。\n\n最适合：如今网页上几乎一切。照片、产品图、带透明的图形都能用 WebP。把 PNG 和 JPEG 转成 WebP，页面体积立竿见影地下降。',
      },
      {
        headingEn: 'AVIF — smallest, but newer',
        headingZh: 'AVIF——最小，但更新',
        bodyEn: 'AVIF (AV1 Image File Format) is the newest contender and generally produces the smallest files — typically 30–50% smaller than JPEG, and smaller than WebP too. A 2.1MB JPEG can become a ~102KB AVIF.\n\nThe tradeoffs: encoding is slower (a few hundred milliseconds per image), and while Chrome, Firefox, and Safari all support it, support is a bit newer than WebP\'s.\n\nBest for: static assets in a build pipeline (Next.js, Vite, etc.) where you can batch-convert once and cache forever. For one-off manual conversions, WebP is usually the more practical choice.',
        bodyZh: 'AVIF（AV1 图片文件格式）是最新的竞争者，通常产出的文件最小——一般比 JPEG 小 30–50%，也比 WebP 更小。一张 2.1MB 的 JPEG 能变成约 102KB 的 AVIF。\n\n代价是：编码更慢（每张几百毫秒），而且虽然 Chrome、Firefox、Safari 都支持，但支持时间比 WebP 更晚。\n\n最适合：构建流水线（Next.js、Vite 等）里的静态资源，可以一次性批量转换、永久缓存。一次性手动转换的话，WebP 通常是更务实的选择。',
      },
      {
        headingEn: 'The verdict',
        headingZh: '结论',
        bodyEn: '• Photographs → WebP (or JPEG if you need maximum legacy compatibility).\n• Screenshots, logos, text, transparency → PNG, optimized losslessly.\n• Absolute smallest files in a pipeline → AVIF.\n\nYou can convert between all of these formats in your browser with CompressFast — no upload, no account. Pick the format, drop your files, download the result.',
        bodyZh: '• 照片 → WebP（或需要最大兼容性时用 JPEG）。\n• 截图、Logo、文字、透明 → PNG，无损优化。\n• 流水线里追求最小文件 → AVIF。\n\n你可以在浏览器里用极速压图在这几种格式之间自由转换——无需上传、无需注册。选好格式、拖入文件、下载结果。',
      },
    ],
    faqs: [
      { qEn: 'Is WebP better than JPEG?', qZh: 'WebP 比 JPEG 好吗？', aEn: 'For the web, yes in almost every case. WebP is 25–35% smaller at equal quality, supports transparency, and has 96%+ browser support. JPEG\'s only remaining advantage is compatibility with very old browsers.', aZh: '对网页而言，几乎任何情况下都是。WebP 同等画质小 25–35%，支持透明，浏览器支持率 96%+。JPEG 仅剩的优势是兼容极老的浏览器。' },
      { qEn: 'Is AVIF better than WebP?', qZh: 'AVIF 比 WebP 好吗？', aEn: 'AVIF produces smaller files (often 30–50% smaller than JPEG vs WebP\'s 25–35%), but encodes slower and has slightly newer browser support. For a build pipeline, AVIF wins; for quick manual conversion, WebP is more practical.', aZh: 'AVIF 文件更小（常比 JPEG 小 30–50%，WebP 是 25–35%），但编码更慢、浏览器支持略新。构建流水线选 AVIF；快速手动转换选 WebP 更实用。' },
      { qEn: 'Which format is best for logos and screenshots?', qZh: 'Logo 和截图用哪种格式最好？', aEn: 'PNG. It\'s lossless, so text and sharp edges stay crisp, and it supports transparency for logos. Always run PNGs through a lossless optimizer (like oxipng) to trim 20–60% before shipping.', aZh: 'PNG。它是无损格式，文字和锐利边缘保持清晰，还支持 Logo 所需的透明。上线前务必跑一遍无损优化（如 oxipng）省掉 20–60%。' },
      { qEn: 'Can I convert between formats in the browser?', qZh: '能在浏览器里转换格式吗？', aEn: 'Yes. Tools like CompressFast convert PNG → WebP, JPEG → WebP, PNG → JPEG, WebP → PNG, and more — all locally in your browser, with no upload.', aZh: '能。极速压图这类工具支持 PNG→WebP、JPEG→WebP、PNG→JPEG、WebP→PNG 等转换——全在浏览器本地完成，无需上传。' },
    ],
    relatedTools: ['convert-to-webp', 'compress-jpeg', 'compress-png', 'png-to-webp', 'jpg-to-webp'],
  },

  'reduce-image-file-size': {
    slug: 'reduce-image-file-size',
    titleEn: 'How to Reduce Image File Size Without Losing Quality | CompressFast',
    titleZh: '如何减小图片文件体积而不损失画质 | 极速压图',
    descriptionEn: 'Learn how to reduce image file size without losing quality. Covers lossless vs lossy compression, resizing, format conversion, and stripping metadata — all with real size numbers.',
    descriptionZh: '教你如何减小图片体积而不损失画质：无损 vs 有损压缩、尺寸调整、格式转换、清除元数据，附真实体积数据。',
    keywords: ['reduce image file size', 'reduce image size', 'make image smaller', 'shrink image file', 'compress image without losing quality', 'decrease image file size', 'smaller image file size', 'reduce photo file size'],
    heroTitleEn: 'How to Reduce Image File Size',
    heroTitleZh: '如何减小图片体积',
    heroSubEn: 'Five proven ways to shrink any image — without making it look worse.',
    heroSubZh: '五种经过验证的方法，让你缩小任何图片，而不牺牲观感。',
    introEn: 'A 4.5MB photo that should be 150KB is the most common performance mistake on the web. The fix isn\'t complicated — but it is a bit counterintuitive: the biggest savings usually come from resizing and format choice, not from the compression slider.\n\nHere are five proven ways to reduce image file size, ordered from biggest impact to smallest, with the real numbers you can expect.',
    introZh: '一张本该 150KB 的照片却有 4.5MB，这是网页上最常见的性能错误。解决办法不复杂，但有点反直觉：最大的节省往往来自调整尺寸和选择格式，而不是压缩滑块。\n\n下面按影响从大到小列出五种减小图片体积的可靠方法，并附上你实际能期待的数字。',
    sections: [
      {
        headingEn: '1. Resize to your actual display size',
        headingZh: '1. 调整到实际显示尺寸',
        bodyEn: 'This is the highest-impact lever and the most overlooked. A 4000×3000 photo (12MP) resized to 1600×1200 drops to about 2MP — a ~75% byte reduction before any compression. Resize to 1200–1600px on the longest edge for web, and 300–400px for thumbnails.\n\nAlways keep aspect ratio locked and never upscale a small image (it just adds blur and bytes).',
        bodyZh: '这是影响最大、也最常被忽视的杠杆。一张 4000×3000（1200 万像素）的照片调到 1600×1200（约 200 万像素）——还没压缩，字节就减少了约 75%。网页长边调到 1200–1600px，缩略图 300–400px。\n\n始终保持宽高比锁定，从不要放大小图（只会增加模糊和字节）。',
      },
      {
        headingEn: '2. Convert to a modern format',
        headingZh: '2. 转换成现代格式',
        bodyEn: 'Format choice is the second-biggest lever. Converting a JPEG to WebP typically saves 25–35% at identical quality; converting to AVIF saves 30–50%. A 2.1MB JPEG becomes ~186KB as WebP or ~102KB as AVIF.\n\nPNG files are the extreme case: a 2.5MB PNG screenshot often becomes a 300–500KB WebP, because PNG is lossless while WebP applies smart lossy compression.',
        bodyZh: '格式选择是第二大杠杆。JPEG 转 WebP 在相同画质下通常省 25–35%；转 AVIF 省 30–50%。一张 2.1MB 的 JPEG 转 WebP 约 186KB，转 AVIF 约 102KB。\n\nPNG 是极端情况：一张 2.5MB 的 PNG 截图常能变成 300–500KB 的 WebP，因为 PNG 是无损，而 WebP 会应用智能有损压缩。',
      },
      {
        headingEn: '3. Compress at the right quality',
        headingZh: '3. 用合适的画质压缩',
        bodyEn: 'Once you\'ve resized and picked a format, the compression slider fine-tunes the result. For JPEG/WebP:\n\n• 85–95% — near-lossless, save 20–40%.\n• 75–85% — the web "sweet spot," save 50–70%, visually indistinguishable.\n• 60–75% — aggressive, for thumbnails and previews.\n\nFor PNG, use lossless optimization (oxipng) instead of a quality slider — it saves 20–60% with zero pixel change.',
        bodyZh: '调好尺寸、选好格式后，压缩滑块做最后的微调。对 JPEG/WebP 而言：\n\n• 85–95% —— 接近无损，省 20–40%。\n• 75–85% —— 网页"甜点区"，省 50–70%，肉眼难辨。\n• 60–75% —— 激进，适合缩略图和预览。\n\n对 PNG 来说，用无损优化（oxipng）而不是画质滑块——像素零变化，省 20–60%。',
      },
      {
        headingEn: '4. Strip metadata you don\'t need',
        headingZh: '4. 清除不需要的元数据',
        bodyEn: 'Every photo carries hidden baggage: EXIF data with your GPS coordinates, camera model, lens, timestamp, and sometimes a thumbnail preview. Stripping this metadata is a privacy win and a size win — it can shave tens of kilobytes off each file.\n\nAlways strip metadata from images you publish publicly. You don\'t want strangers knowing where you took a photo.',
        bodyZh: '每张照片都带着隐藏包袱：包含 GPS 坐标、相机型号、镜头、时间戳，有时还有缩略图预览的 EXIF 数据。清除这些元数据既是隐私上的胜利，也是体积上的胜利——每张能省下几十 KB。\n\n公开发布的图片一定要清除元数据。你不会想让陌生人知道你在哪里拍的照片。',
      },
      {
        headingEn: '5. Do it in bulk, in your browser',
        headingZh: '5. 在浏览器里批量处理',
        bodyEn: 'All four steps above can be done at once, for up to 30 images at a time, entirely in your browser — no upload, no account. CompressFast combines resizing, format conversion, quality compression, and metadata stripping into a single drag-and-drop flow, then lets you download everything as a ZIP.\n\nFor a website launch or a batch of product photos, this turns a tedious hour of manual work into a 30-second job.',
        bodyZh: '以上四步可以一次性、最多 30 张图、完全在浏览器里完成——无需上传、无需注册。极速压图把尺寸调整、格式转换、画质压缩、元数据清除合并成一次拖拽流程，还能一键下载 ZIP。\n\n网站上线或一批产品图，这能把一小时的枯燥手工活变成 30 秒。',
      },
    ],
    faqs: [
      { qEn: 'What is the fastest way to reduce image file size?', qZh: '减小图片体积最快的方法是什么？', aEn: 'Resize first — a full-resolution photo resized to web dimensions typically drops 70%+ instantly. Then convert to WebP and compress at 75–85%. Combined, a 4.5MB photo becomes a ~150KB web image.', aZh: '先调尺寸——全分辨率照片调到网页尺寸，通常瞬间减小 70%+。然后转 WebP、用 75–85% 画质压缩。三者结合，4.5MB 的照片变成约 150KB 的网页图。' },
      { qEn: 'Can I reduce image size without any quality loss?', qZh: '能完全无损地减小图片吗？', aEn: 'Yes, up to a point. Lossless compression (PNG via oxipng, or lossless WebP/AVIF) re-encodes the file more efficiently with zero pixel change — typically saving 20–60%. For photos, you\'ll get much larger savings from lossy compression at high quality, which is visually indistinguishable to most people.', aZh: '在一定程度上可以。无损压缩（基于 oxipng 的 PNG，或无损 WebP/AVIF）在像素零变化的前提下更高效地重编码——通常省 20–60%。照片用高画质有损压缩能省更多，且大多数人肉眼难辨。' },
      { qEn: 'Why is my PNG file so large?', qZh: '为什么我的 PNG 文件这么大？', aEn: 'PNG is a lossless format, so it stores every pixel exactly — which is inherently larger than lossy JPEG/WebP. Screenshots and detailed graphics can easily hit 2–3MB. Convert to WebP for a dramatic size drop, or run it through a lossless PNG optimizer to trim 20–60% while keeping pixel-perfect quality.', aZh: 'PNG 是无损格式，逐像素精确存储——天然比有损的 JPEG/WebP 大。截图和细节丰富的图形动辄 2–3MB。转成 WebP 能大幅瘦身，或跑一遍无损 PNG 优化器，在像素级完美的前提下省 20–60%。' },
      { qEn: 'Does resizing an image reduce its file size?', qZh: '调整尺寸能减小文件体积吗？', aEn: 'Dramatically, yes. File size scales roughly with pixel count: halving the width and height cuts the pixel count to 1/4. Resizing a 4000×3000 photo to 1600×1200 reduces it by ~75% before any compression.', aZh: '能，而且很显著。文件大小大致和像素数成正比：宽高各减半，像素数就变成 1/4。把 4000×3000 的照片调到 1600×1200，还没压缩就减小了约 75%。' },
      { qEn: 'Is there a limit to how small I can make an image?', qZh: '图片能小到什么程度有极限吗？', aEn: 'There\'s a floor where more compression only adds visible artifacts. For JPEG/WebP that\'s around 60% quality; below that, blocky artifacts and banding appear. For PNG, lossless optimization has a hard mathematical limit. The practical goal is "as small as possible while still looking good," which is usually 75–85% quality for photos.', aZh: '有一个下限，超过它再压缩只会增加可见伪影。JPEG/WebP 大约在 60% 画质处；低于它就会出现色块和色带。PNG 的无损优化有硬性的数学极限。务实的目标是"在看起来还好的前提下尽可能小"，照片通常是 75–85% 画质。' },
    ],
    relatedTools: ['compress-images', 'compress-jpeg', 'compress-png', 'convert-to-webp', 'resize-image', 'remove-metadata'],
  },

  'compress-images-for-email': {
    slug: 'compress-images-for-email',
    titleEn: 'How to Compress Images for Email Attachments | CompressFast',
    titleZh: '如何压缩图片用于邮件附件 | 极速压图',
    descriptionEn: 'Gmail caps attachments at 25MB, and most recipients hate 10MB emails. Learn how to compress images for email — resize, convert, and shrink photos to a few hundred KB.',
    descriptionZh: 'Gmail 附件上限 25MB，收件人也讨厌 10MB 的邮件。教你压缩图片发邮件——调整尺寸、转换格式，把照片缩到几百 KB。',
    keywords: ['compress images for email', 'reduce image size for email', 'email attachment size', 'shrink images for email', 'compress photo for email', 'make pictures smaller for email', 'email large images', 'compress images for outlook'],
    heroTitleEn: 'How to Compress Images for Email',
    heroTitleZh: '如何压缩图片发邮件',
    heroSubEn: 'Shrink photos to a few hundred KB so they send fast and land in the inbox — not the spam folder.',
    heroSubZh: '把照片缩到几百 KB，发送快、不超限、稳稳进收件箱。',
    introEn: 'Email clients are terrible at handling large images. Gmail caps attachments at 25MB, Outlook at 20MB, and plenty of corporate servers reject anything over 10MB. Even when a big attachment does go through, it\'s slow to send and annoying to receive.\n\nThe good news: a phone photo is 4–8MB, but a perfectly good email photo only needs to be 300–800KB. Here\'s how to bridge that gap in under a minute.',
    introZh: '邮件客户端处理大图的能力很差。Gmail 附件上限 25MB，Outlook 20MB，很多企业服务器超过 10MB 直接拒收。就算大附件发出去了，发送慢、接收也烦。\n\n好消息是：手机照片 4–8MB，但一张完全够用的邮件照片只需要 300–800KB。下面教你在不到一分钟内完成这个瘦身。',
    sections: [
      {
        headingEn: 'Know your limits',
        headingZh: '先搞清楚上限',
        bodyEn: 'Before compressing, know your target. Gmail allows 25MB per message (including encoding overhead, so stay under ~20MB of actual files). Outlook caps at 20MB. Many corporate and government servers reject messages over 10MB.\n\nA safe target: keep each image under 1MB, and total attachments under 10MB. For sharing a batch of photos, that means roughly 10–20 images at 300–800KB each — far below the limit with room to spare.',
        bodyZh: '压缩之前先搞清楚目标。Gmail 每条消息允许 25MB（含编码开销，所以实际文件控制在 20MB 以内）。Outlook 上限 20MB。很多企业和政府服务器超过 10MB 直接拒收。\n\n一个安全的目标：单张控制在 1MB 以内，附件总计 10MB 以内。分享一批照片的话，大约 10–20 张、每张 300–800KB——远低于上限，还留有余量。',
      },
      {
        headingEn: 'Resize first — email doesn\'t need 12MP',
        headingZh: '先调尺寸——邮件不需要 1200 万像素',
        bodyEn: 'A 4000×3000 phone photo is 12 megapixels, but on screen it\'ll be viewed at maybe 800×600. Resizing to 1280×960 (or even 1600×1200 for a large monitor) preserves full on-screen quality while cutting file size by 75%+.\n\nThis single step usually takes a 5MB photo down to ~1MB before any compression.',
        bodyZh: '一张 4000×3000 的手机照片有 1200 万像素，但在屏幕上最多也就 800×600 地看。调到 1280×960（大屏也就 1600×1200）就能保留完整的屏幕显示画质，同时把体积减小 75% 以上。\n\n仅这一步，通常就能把 5MB 的照片降到约 1MB，还没开始压缩。',
      },
      {
        headingEn: 'Convert and compress',
        headingZh: '转换并压缩',
        bodyEn: 'If you\'re emailing photos, JPEG at 70–85% quality is the practical choice — universally openable and small. If the recipient is tech-savvy and you want even smaller files, WebP at 75% is a good option.\n\nFor screenshots and documents, PNG is fine but large; converting to JPEG or WebP will dramatically shrink them. Compress at 70–80% quality — for email, slight quality loss is completely acceptable and usually invisible.\n\nStrip the EXIF metadata too. You don\'t need to send your GPS coordinates with every photo.',
        bodyZh: '发照片的话，70–85% 画质的 JPEG 是最务实的选择——任何设备都能打开，体积还小。如果对方懂技术、你想要更小，75% 的 WebP 是不错的选择。\n\n截图和文档类，PNG 没问题但偏大；转成 JPEG 或 WebP 会大幅瘦身。用 70–80% 画质压缩——对邮件来说，轻微画质损失完全可接受，通常也看不出来。\n\n顺便清除 EXIF 元数据。你没必要把 GPS 坐标随每张照片一起发出去。',
      },
      {
        headingEn: 'Batch it and send a ZIP',
        headingZh: '批量处理，打包 ZIP 发送',
        bodyEn: 'Sharing 20 vacation photos? Don\'t attach 20 separate files — compress them all at once and download a single ZIP archive. One file is easier to send, easier to download, and (bonus) ZIP adds its own compression on top.\n\nWith a browser-based tool like CompressFast, this is a single drag-and-drop: up to 30 images in, one ZIP out, all processed locally without uploading your photos anywhere.',
        bodyZh: '要分享 20 张旅行照？别一张张附 20 个文件——一次性全压缩，下载一个 ZIP 压缩包。一个文件更好发、更好下载，而且（额外好处）ZIP 本身还会再压一道。\n\n用极速压图这类浏览器工具，一次拖拽即可：最多 30 张进，一个 ZIP 出，全程本地处理，照片哪里都不会上传。',
      },
    ],
    faqs: [
      { qEn: 'How do I make an image small enough to email?', qZh: '怎么把图片缩到能发邮件的大小？', aEn: 'Resize to 1280–1600px on the longest edge, convert to JPEG, compress at 70–85% quality, and strip metadata. A 5MB phone photo becomes ~500KB — well under any email limit.', aZh: '长边调到 1280–1600px，转 JPEG，70–85% 画质压缩，再清除元数据。5MB 的手机照片就变成约 500KB——远低于任何邮件限制。' },
      { qEn: 'What is the Gmail attachment size limit?', qZh: 'Gmail 附件大小限制是多少？', aEn: '25MB per message, but that includes encoding overhead, so aim to keep actual files under ~20MB. For larger files, Gmail will automatically offer to send via Google Drive instead.', aZh: '每条消息 25MB，但这包含编码开销，所以实际文件控制在 20MB 以内。更大的文件 Gmail 会自动建议改用 Google Drive 发送。' },
      { qEn: 'Should I compress photos before sending by email?', qZh: '发邮件前该压缩照片吗？', aEn: 'Almost always yes. It\'s faster to send, faster to receive, less likely to bounce, and the recipient can\'t tell the difference at screen resolution. The only exception is when the recipient needs the full-resolution original for printing or editing.', aZh: '几乎总是该压缩。发送快、接收快、不易被拒，收件人在屏幕分辨率下也看不出差别。唯一的例外是收件人需要全分辨率原图去打印或编辑。' },
      { qEn: 'How do I compress a batch of photos for email?', qZh: '怎么批量压缩照片发邮件？', aEn: 'Drag them all into a browser compressor (up to 30 at once with CompressFast), set resize + JPEG + 80% quality, and download a single ZIP. Then attach the one ZIP file to your email.', aZh: '把它们全部拖进浏览器压缩工具（极速压图一次最多 30 张），设置尺寸调整 + JPEG + 80% 画质，下载一个 ZIP，然后把这一个 ZIP 文件作为附件发出去。' },
      { qEn: 'Is WebP OK to send by email?', qZh: '用 WebP 发邮件可以吗？', aEn: 'Technically yes, but not every recipient\'s viewer opens WebP natively (some older Outlook versions don\'t). For maximum compatibility, JPEG is the safer email format. WebP is better reserved for the web.', aZh: '技术上可以，但不是每个收件人的看图软件都能原生打开 WebP（部分旧版 Outlook 不行）。为了最大兼容性，JPEG 是更稳妥的邮件格式。WebP 更适合网页使用。' },
    ],
    relatedTools: ['compress-images', 'compress-jpeg', 'resize-image', 'convert-to-webp', 'remove-metadata'],
  },
}

export const GUIDE_SLUGS = Object.keys(GUIDES)
