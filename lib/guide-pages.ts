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

  'compress-image-to-100kb': {
    slug: 'compress-image-to-100kb',
    titleEn: 'Compress Image to 100KB Online Free — Exact File Size | CompressFast',
    titleZh: '图片压缩到100KB——精确控制文件大小 | 极速压图',
    descriptionEn: 'Need an image at exactly 100KB, 50KB, or 200KB? Learn how to compress to a precise target file size — for websites, forums, and forms — without guessing with a quality slider.',
    descriptionZh: '需要图片正好 100KB、50KB 或 200KB？教你压缩到精确的目标文件大小，适配网站、论坛、表单上传要求，不用画质滑块瞎猜。',
    keywords: ['compress image to 100kb', 'compress image to 50kb', 'compress image to 200kb', 'reduce image to 100kb', 'compress image to exact size', 'compress image to 20kb', 'compress image to 10kb', 'compress photo to 100kb', 'image size reducer to 100kb'],
    heroTitleEn: 'Compress an Image to Exactly 100KB',
    heroTitleZh: '把图片精确压缩到 100KB',
    heroSubEn: 'Hit a precise file-size target — 100KB, 50KB, 200KB — instead of guessing with a quality slider.',
    heroSubZh: '精确命中目标体积——100KB、50KB、200KB——而不是用画质滑块瞎猜。',
    introEn: 'Most compressors give you a quality slider and hope for the best. But upload forms don\'t ask "what quality?" — they ask "must be under 100KB." Website speed checkers, forum avatars, job applications, and government forms all have hard file-size limits.\n\nThat\'s why "compress image to 100KB" is one of the most searched image tasks on the internet — and why a quality slider is the wrong tool for it. What you need is target-size compression: tell the tool the exact size you want, and it adjusts quality automatically until the file lands there. Here\'s how it works.',
    introZh: '大多数压缩工具给你一个画质滑块，然后听天由命。但上传表单不会问"画质多少"——它只问"必须小于 100KB"。网站测速、论坛头像、求职申请、政府表单，都有硬性的文件大小上限。\n\n所以"图片压缩到 100KB"是全网搜索量最高的图片任务之一——也正因为如此，画质滑块是做这件事的错误工具。你需要的是目标大小压缩：告诉工具你想要的确切大小，它自动调节画质，直到文件落在这个大小上。下面讲清楚怎么用。',
    sections: [
      {
        headingEn: 'Why a quality slider can\'t hit a size target',
        headingZh: '为什么画质滑块打不中目标大小',
        bodyEn: 'A quality slider controls compression strength, but the resulting file size depends on the image\'s content. A busy, detailed photo at 80% quality might be 400KB, while a simple graphic at the same 80% might be 40KB. There\'s no fixed "quality → size" mapping — every image is different.\n\nSo you end up in a frustrating loop: guess a quality, check the size, nudge the slider, check again, repeat. Target-size compression eliminates the guesswork: you input the size you need, and the tool automatically searches for the quality setting that produces it.',
        bodyZh: '画质滑块控制的是压缩强度，但最终文件大小取决于图片内容。一张细节丰富的照片在 80% 画质下可能是 400KB，而一张简单图形在同样 80% 下可能只有 40KB。画质和大小之间没有固定的映射——每张图都不一样。\n\n于是你陷入一个烦人的循环：猜个画质、看下大小、拨一下滑块、再看一下、反复重来。目标大小压缩消除了这种猜测：你输入想要的大小，工具自动寻找能产生这个大小的画质设置。',
      },
      {
        headingEn: 'How target-size compression works',
        headingZh: '目标大小压缩是怎么工作的',
        bodyEn: 'When you set a target (say, 100KB), the tool compresses the image and checks the result. If it\'s over the target, it lowers the quality slightly and tries again; if it\'s under, it raises the quality. It repeats this a few times to land as close to the target as possible — without ever going over.\n\nFor a 2MB photo targeting 100KB, this usually means a quality around 60–75%. The result is a file that\'s exactly under your limit, at the highest quality that still fits. No more manual trial and error.',
        bodyZh: '当你设置目标（比如 100KB）后，工具压缩图片并检查结果。如果超过目标，就稍微降低画质重试；如果低于目标，就提高画质。反复几次后，落点尽可能接近目标——而且绝不会超。\n\n一张 2MB 的照片要压到 100KB，通常意味着 60–75% 的画质。结果是：一个恰好低于上限的文件，而且在能装下的前提下画质最高。再也不用手动试来试去。',
      },
      {
        headingEn: 'Common file-size targets and where they come from',
        headingZh: '常见的文件大小目标从哪来',
        bodyEn: 'Different upload forms have different limits. Here are the most common targets you\'ll run into:\n\n• 10–20KB — email signatures, tiny icons, forum emotes.\n• 50KB — some avatar systems, thumbnail placeholders, low-bandwidth embeds.\n• 100KB — the most common web target: SEO recommendations, WordPress image guidelines, and many CMS upload caps.\n• 200KB — forum avatars, job-application portals, and government form uploads.\n• 500KB–1MB — social media posts, portfolio images, and print-adjacent uses.\n\nIf a form says "under 100KB," aim for 80–95KB to leave a small safety margin for encoding overhead.',
        bodyZh: '不同的上传表单有不同的限制。下面是你最常遇到的几个目标：\n\n• 10–20KB —— 邮件签名、小图标、论坛表情。\n• 50KB —— 部分头像系统、缩略图占位、低带宽嵌入。\n• 100KB —— 最常见的网页目标：SEO 建议、WordPress 图片规范、许多 CMS 的上传上限。\n• 200KB —— 论坛头像、求职申请门户、政府表单上传。\n• 500KB–1MB —— 社媒发帖、作品集图片、接近印刷的用途。\n\n如果表单写"小于 100KB"，建议压到 80–95KB，留一点安全余量给编码开销。',
      },
      {
        headingEn: 'If the target makes the image look bad, resize first',
        headingZh: '如果目标大小让图变糊，先调尺寸',
        bodyEn: 'There\'s a limit to how far you can compress an image before quality visibly collapses. Squeezing a 12-megapixel, 4MB photo down to 20KB will always look terrible — not because the tool is bad, but because you\'re asking the impossible.\n\nThe fix is to resize before you target. If a 4000×3000 photo can\'t reach 100KB without falling apart, first resize it to the size it\'ll actually be displayed at (say, 1200×900 or 800×600). Fewer pixels means less data to compress, so you can hit a small target at a much higher quality.\n\nRule of thumb: if hitting your target forces quality below ~60%, resize smaller and try again.',
        bodyZh: '在画质明显崩塌之前，图片能被压缩的程度是有极限的。把一张 1200 万像素、4MB 的照片硬塞到 20KB，永远都会很难看——不是工具不行，而是你在强人所难。\n\n解决办法是：先调尺寸，再定目标。如果一张 4000×3000 的照片压到 100KB 就散架，那就先把它调到实际显示大小（比如 1200×900 或 800×600）。像素越少，需要压缩的数据越少，就能在更高画质下命中小目标。\n\n经验法则：如果命中目标需要把画质压到 60% 以下，就先把尺寸调小再试。',
      },
      {
        headingEn: 'Do it in your browser — no upload',
        headingZh: '在浏览器里完成——不上传',
        bodyEn: 'You shouldn\'t have to upload a private photo to a server just to shrink it to 100KB. Browser-based tools like CompressFast run the whole target-size search locally in a Web Worker — your images never leave your device.\n\nDrop in an image, type your target size, and download the result in seconds. You can batch up to 30 images at once (500 with Pro), each hitting its own target, then grab everything as a ZIP. No account, no upload queue, no quality-slider guessing.',
        bodyZh: '不该为了把私人照片缩到 100KB 就把它上传到服务器。极速压图这类浏览器工具把整个目标大小搜索都放在本地 Web Worker 里运行——图片从不出设备。\n\n拖入图片、输入目标大小、几秒内下载结果。一次最多批量 30 张（Pro 版 500 张），每张各自命中目标，然后一键打包 ZIP。无需注册、无需排队上传、不用画质滑块瞎猜。',
      },
    ],
    faqs: [
      { qEn: 'How do I compress an image to exactly 100KB?', qZh: '怎么把图片压缩到正好 100KB？', aEn: 'Use a target-size compressor: upload the image, set the target to 100KB (or 95KB for a safety margin), and the tool automatically adjusts quality until the file lands under that size. No quality-slider trial and error needed.', aZh: '用目标大小压缩工具：上传图片，把目标设为 100KB（或留余量设 95KB），工具会自动调节画质，直到文件落在这个大小以下。不用画质滑块反复试。' },
      { qEn: 'Why won\'t my image compress below 100KB?', qZh: '为什么我的图片压不到 100KB 以下？', aEn: 'If an image is very large or very detailed, hitting a small target forces quality down to where it looks bad. Resize the image to its actual display dimensions first (fewer pixels = less data), then target the size again.', aZh: '如果图片很大或细节很多，要命中小目标就得把画质压到很难看。先把图片调到实际显示尺寸（像素少=数据少），再重新定目标大小。' },
      { qEn: 'Does compressing to a target size lose quality?', qZh: '压缩到目标大小会损失画质吗？', aEn: 'Some, yes — it\'s lossy compression. But the tool hits the target at the highest quality that still fits, so for typical targets (100KB+ for a web-sized image) the quality loss is barely visible. Below ~60% quality, artifacts become noticeable — resize first if that happens.', aZh: '会有一些——这是有损压缩。但工具会在"能装下"的前提下用最高画质命中目标，所以对典型目标（网页尺寸的图 100KB+）而言，画质损失几乎看不见。低于约 60% 画质时伪影就明显了——出现这种情况就先调尺寸。' },
      { qEn: 'What\'s the difference between a quality slider and target size?', qZh: '画质滑块和目标大小有什么区别？', aEn: 'A quality slider sets compression strength (resulting size varies by image). Target size sets the desired file size (quality auto-adjusts to hit it). If you have a hard upload limit, target size is what you want.', aZh: '画质滑块设置的是压缩强度（结果大小因图而异）。目标大小设置的是期望的文件大小（画质自动调节来命中它）。如果你有硬性的上传上限，你需要的是目标大小。' },
      { qEn: 'Can I compress a batch of images to the same size?', qZh: '能批量把图片压到相同大小吗？', aEn: 'Yes. With a browser tool like CompressFast, drop up to 30 images, set one target size, and each image is compressed to hit that target. Download everything as a single ZIP.', aZh: '能。用极速压图这类浏览器工具，一次拖入最多 30 张，设置一个目标大小，每张图都会被压缩到命中该目标。最后打包成一个 ZIP 下载。' },
    ],
    relatedTools: ['compress-images', 'compress-jpeg', 'compress-png', 'resize-image', 'convert-to-webp'],
  },

  'webp-vs-png': {
    slug: 'webp-vs-png',
    titleEn: 'WebP vs PNG: Which Should You Use? (2026) | CompressFast',
    titleZh: 'WebP vs PNG：到底该用哪个？（2026）| 极速压图',
    descriptionEn: 'WebP vs PNG explained: size, transparency, and quality compared with real numbers. See why WebP is up to 90% smaller for photos — and when lossless PNG still wins.',
    descriptionZh: '一文讲清 WebP vs PNG：体积、透明、画质，附真实数据对比。为什么照片用 WebP 能小 90%——以及无损 PNG 在何时仍是最优解。',
    keywords: ['webp vs png', 'webp or png', 'difference between webp and png', 'when to use webp vs png', 'webp vs png quality', 'webp vs png transparency', 'png vs webp size', 'convert png to webp', 'is webp better than png'],
    heroTitleEn: 'WebP vs PNG: Which Format Should You Use?',
    heroTitleZh: 'WebP vs PNG：该用哪个格式？',
    heroSubEn: 'One is up to 90% smaller for photos; the other keeps every pixel perfect. Here\'s how to choose.',
    heroSubZh: '一个能把照片压小 90%，另一个能保住每一个像素。看完这篇你就知道怎么选。',
    introEn: 'WebP vs PNG looks like a format war, but it\'s really a question of what you\'re trying to do. PNG is lossless — every pixel is stored exactly, at the cost of a big file. WebP is a modern format that can be lossy (much smaller, visually identical) or lossless (still smaller than PNG).\n\nThe short answer: for photos and most web images, WebP wins by a mile — often 90% smaller than the same image as PNG. For graphics that must stay pixel-perfect (logos, screenshots, icons), PNG\'s lossless guarantee still matters. Below we break it down with real numbers.',
    introZh: 'WebP vs PNG 看起来像一场格式之争，但其实取决于你想做什么。PNG 是无损格式——每个像素都精确存储，代价是文件大。WebP 是现代格式，可以有损（体积小得多、肉眼无差）也可以无损（仍比 PNG 小）。\n\n先说结论：照片和大多数网页图片，WebP 完胜——同样一张图常比 PNG 小 90%。而必须逐像素完美保留的图形（Logo、截图、图标），PNG 的无损保证仍然重要。下面用真实数据拆解。',
    sections: [
      {
        headingEn: 'Size: WebP crushes PNG',
        headingZh: '体积：WebP 碾压 PNG',
        bodyEn: 'This is the whole ballgame. PNG compresses images losslessly, which means a photograph — full of gradients and fine color detail — barely shrinks at all. A 4MB photo saved as PNG stays around 4MB.\n\nThe same photo as a lossy WebP? Roughly 300–400KB — about 90% smaller, and visually indistinguishable at normal viewing sizes. Even lossless WebP is typically 20–30% smaller than the same PNG, because WebP\'s lossless encoder is simply more efficient.\n\nPut another way: if you\'re serving photos on a website, choosing PNG over WebP means shipping 10× the bytes for the same picture.',
        bodyZh: '这是问题的全部。PNG 用无损方式压缩图片，这意味着照片——充满渐变和细腻色彩细节——几乎压不动。一张 4MB 的照片存成 PNG 还是 4MB 左右。\n\n同样一张照片存成有损 WebP 呢？大约 300–400KB——小 90%，在正常观看尺寸下肉眼几乎无差。就连无损 WebP 通常也比同款 PNG 小 20–30%，因为 WebP 的无损编码器效率更高。\n\n换句话说：如果你在网站上发照片，选 PNG 而不选 WebP，等于同样一张图多传 10 倍的字节。',
      },
      {
        headingEn: 'Transparency: both do it, differently',
        headingZh: '透明：两者都支持，方式不同',
        bodyEn: 'A common myth is that PNG is the only format that supports transparency. Not true — WebP supports transparency too (8-bit alpha), and it can carry it in lossy mode, which PNG cannot.\n\nThe real difference is fidelity. PNG\'s alpha channel is lossless and has been the de-facto standard for two decades, so it\'s rock-solid everywhere. WebP\'s lossy transparency can introduce slight edge artifacts on high-contrast transparent graphics.\n\nRule of thumb: for logos and icons where a crisp transparent edge matters, keep PNG. For photos or large graphics that happen to need transparency, WebP is fine and far smaller.',
        bodyZh: '一个常见误区是"PNG 是唯一支持透明的格式"。并非如此——WebP 也支持透明（8 位 alpha），而且能在有损模式下携带透明，这点 PNG 做不到。\n\n真正的差别在保真度。PNG 的 alpha 通道是无损的，二十年来一直是事实标准，到处都稳如磐石。WebP 的有损透明在高对比度的透明图形上可能产生轻微的边缘伪影。\n\n经验法则：需要清晰透明边缘的 Logo 和图标，保留 PNG。恰好需要透明的照片或大图，WebP 没问题，而且小得多。',
      },
      {
        headingEn: 'Quality and artifacts',
        headingZh: '画质与伪影',
        bodyEn: 'PNG\'s quality story is simple: it\'s lossless, so quality is always 100% — but you pay for it in file size.\n\nWebP\'s quality story is a tradeoff you control. At a lossless setting, WebP is also 100% quality and still smaller than PNG. At a lossy setting (say, quality 80), a photo is visually indistinguishable to almost everyone, and the file shrinks dramatically.\n\nThe one place PNG genuinely wins on quality is sharp edges and text. Lossy WebP — like lossy JPEG — introduces slight "ringing" around high-contrast boundaries. So a screenshot or diagram with small text is better as lossless PNG (or lossless WebP).',
        bodyZh: 'PNG 的画质故事很简单：它是无损的，所以画质永远是 100%——但你得在文件大小上付出代价。\n\nWebP 的画质故事是一个你可控的权衡。无损设置下，WebP 也是 100% 画质，而且仍比 PNG 小。有损设置下（比如画质 80），照片对几乎所有人来说肉眼无差，体积却急剧缩小。\n\nPNG 在画质上真正胜出的唯一场景是锐利边缘和文字。有损 WebP——如同有损 JPEG——会在高对比边界周围产生轻微的"振铃"。所以带小字的截图或图表，用无损 PNG（或无损 WebP）更好。',
      },
      {
        headingEn: 'When to use which — the verdict',
        headingZh: '何时用哪个——结论',
        bodyEn: '• Photos on a website → WebP. You\'ll cut 80–90% off the file size with no visible loss.\n• Screenshots, diagrams, text-heavy images → lossless PNG (or lossless WebP). Sharp text and hard edges stay crisp.\n• Logos and icons with transparency → PNG. Lossless alpha is the safe, universally-compatible choice.\n• Anything you\'re not sure about → WebP lossless. It\'s strictly smaller than PNG at identical quality.\n\nYou can convert between these in your browser with CompressFast — no upload, no account. Convert PNG to WebP (or back) in seconds and compare the sizes yourself.',
        bodyZh: '• 网站上的照片 → WebP。能砍掉 80–90% 的体积，画质无损。\n• 截图、图表、文字密集的图 → 无损 PNG（或无损 WebP）。锐利文字和硬边缘保持清晰。\n• 带透明的 Logo 和图标 → PNG。无损 alpha 是安全且普遍兼容的选择。\n• 拿不准的 → 无损 WebP。相同画质下严格比 PNG 小。\n\n你可以在浏览器里用极速压图在这些格式之间自由转换——无需上传、无需注册。几秒内把 PNG 转成 WebP（或转回来），亲自比较体积。',
      },
    ],
    faqs: [
      { qEn: 'Is WebP better than PNG?', qZh: 'WebP 比 PNG 好吗？', aEn: 'For most web images, yes. Lossy WebP is typically 80–90% smaller than PNG for photos with no visible quality loss, and even lossless WebP is 20–30% smaller than PNG at identical quality. PNG\'s edge is its rock-solid lossless transparency for logos and icons.', aZh: '对大多数网页图片来说是的。照片用有损 WebP 通常比 PNG 小 80–90% 且画质无损，就连无损 WebP 在相同画质下也比 PNG 小 20–30%。PNG 的优势在于它对 Logo 和图标来说稳定可靠的无损透明。' },
      { qEn: 'Is WebP or PNG better for transparency?', qZh: '透明图用 WebP 还是 PNG 更好？', aEn: 'Both support transparency, but PNG\'s lossless alpha is more universally compatible and artifact-free. For logos and icons with crisp transparent edges, use PNG. For photos or large graphics that just happen to need transparency, lossy WebP is fine and much smaller.', aZh: '两者都支持透明，但 PNG 的无损 alpha 更普遍兼容、无伪影。需要清晰透明边缘的 Logo 和图标用 PNG。恰好需要透明的照片或大图，有损 WebP 即可，而且小得多。' },
      { qEn: 'Does converting PNG to WebP lose quality?', qZh: 'PNG 转 WebP 会损失画质吗？', aEn: 'Not if you use lossless WebP — it re-encodes with zero pixel change and is typically 20–30% smaller. If you use lossy WebP for a photo, the quality loss is invisible at normal viewing sizes while the file shrinks by ~90%.', aZh: '用无损 WebP 就不会——像素零变化地重编码，通常还小 20–30%。如果照片用有损 WebP，正常观看尺寸下画质损失不可见，体积却缩约 90%。' },
      { qEn: 'Should I use WebP or PNG for screenshots?', qZh: '截图用 WebP 还是 PNG？', aEn: 'Screenshots contain text and sharp UI edges, which lossy compression tends to artifact. Use lossless PNG, or lossless WebP if you want a smaller file with identical quality.', aZh: '截图包含文字和锐利的 UI 边缘，有损压缩容易产生伪影。用无损 PNG，或者想要更小体积、相同画质就用无损 WebP。' },
      { qEn: 'Can I convert PNG to WebP in the browser?', qZh: '能在浏览器里把 PNG 转成 WebP 吗？', aEn: 'Yes. Tools like CompressFast convert PNG → WebP (and WebP → PNG) entirely in your browser — no upload, no account. Drop the file, pick the format, download the result.', aZh: '能。极速压图这类工具完全在浏览器本地完成 PNG→WebP（以及 WebP→PNG）转换——无需上传、无需注册。拖入文件、选格式、下载结果。' },
    ],
    relatedTools: ['convert-to-webp', 'png-to-webp', 'webp-to-png', 'compress-png'],
  },

  'avif-vs-webp': {
    slug: 'avif-vs-webp',
    titleEn: 'AVIF vs WebP vs JPEG: Which Is Smallest in 2026? | CompressFast',
    titleZh: 'AVIF vs WebP vs JPEG：2026 年哪个最小？| 极速压图',
    descriptionEn: 'AVIF vs WebP vs JPEG compared: compression size, quality, browser support, and encoding speed. See which modern format is smallest — and when JPEG still wins.',
    descriptionZh: 'AVIF vs WebP vs JPEG 全面对比：压缩体积、画质、浏览器支持、编码速度。看看哪个现代格式最小——以及 JPEG 在何时仍是赢家。',
    keywords: ['avif vs webp', 'avif vs webp vs jpeg', 'avif vs jpeg', 'is avif better than webp', 'webp vs jpeg', 'avif vs webp quality', 'smallest image format', 'avif vs webp file size', 'best lossy image format'],
    heroTitleEn: 'AVIF vs WebP vs JPEG: Which Is Smallest?',
    heroTitleZh: 'AVIF vs WebP vs JPEG：哪个最小？',
    heroSubEn: 'Three lossy formats, one goal: the smallest file that still looks great. Here\'s the real comparison.',
    heroSubZh: '三种有损格式，同一个目标：在画质仍佳的前提下文件最小。这才是真正的对比。',
    introEn: 'If your site serves photos, you\'re almost certainly using one of three lossy formats: JPEG (the 1992 classic), WebP (Google\'s modern workhorse), or AVIF (the newest, smallest contender). Each claims to shrink images better — but the differences are real and measurable.\n\nThe short version: AVIF produces the smallest files, WebP is the best all-around practical choice, and JPEG remains the compatibility fallback. A 2.1MB JPEG, for instance, becomes about 186KB as WebP and about 102KB as AVIF. Let\'s break down exactly how they compare.',
    introZh: '如果你的网站发照片，你几乎一定在用三种有损格式之一：JPEG（1992 年的经典）、WebP（Google 的现代主力）、或 AVIF（最新、最小的竞争者）。每一种都号称压缩得更好——而它们的差异是真实且可度量的。\n\n先说结论：AVIF 产出的文件最小，WebP 是最全面的务实选择，JPEG 则是兼容性兜底。比如一张 2.1MB 的 JPEG，转成 WebP 约 186KB，转成 AVIF 约 102KB。下面逐项拆解它们的差异。',
    sections: [
      {
        headingEn: 'Compression size: AVIF wins',
        headingZh: '压缩体积：AVIF 胜',
        bodyEn: 'Measured at equal visual quality, here\'s how the three stack up:\n\n• JPEG — the baseline. 100% of its size is your starting point.\n• WebP — 25–35% smaller than JPEG at the same quality. A 2.1MB JPEG becomes ~186KB.\n• AVIF — 30–50% smaller than JPEG (and roughly 20–30% smaller than WebP). The same 2.1MB image becomes ~102KB.\n\nSo AVIF is the clear size champion. But smaller isn\'t the only thing that matters — the next two sections explain why AVIF hasn\'t simply replaced everything.',
        bodyZh: '在相同视觉画质下衡量，三者的排位如下：\n\n• JPEG —— 基准线。它的体积就是你的起点。\n• WebP —— 同画质比 JPEG 小 25–35%。2.1MB 的 JPEG 变成约 186KB。\n• AVIF —— 比 JPEG 小 30–50%（比 WebP 再小约 20–30%）。同样 2.1MB 的图变成约 102KB。\n\n所以 AVIF 是当之无愧的体积冠军。但"更小"不是唯一重要的——下面两节解释为什么 AVIF 还没有简单取代一切。',
      },
      {
        headingEn: 'Browser support: WebP is the sweet spot',
        headingZh: '浏览器支持：WebP 是甜点区',
        bodyEn: 'A format only helps if your visitors\' browsers can render it.\n\n• JPEG — 100% support, everywhere, forever. This is why it refuses to die.\n• WebP — 96%+ support. Every modern browser renders it, and it\'s been safe for years. This is why WebP is the practical default.\n• AVIF — solid but newer. Chrome, Firefox, and Safari all support it today, but support only matured around 2023–2024, and some older embedded webviews lag behind.\n\nIf you control your delivery (a build pipeline with fallbacks), AVIF is great. If you need a single format that "just works," WebP is the safer bet.',
        bodyZh: '一种格式只有在访问者的浏览器能渲染它时才有意义。\n\n• JPEG —— 100% 支持，无处不在，永不淘汰。这就是它拒绝消亡的原因。\n• WebP —— 96%+ 支持。所有现代浏览器都能渲染，安全了好几年。这就是 WebP 成为务实默认的原因。\n• AVIF —— 支持良好但更新。Chrome、Firefox、Safari 现在都支持，但支持是 2023–2024 年才成熟的，部分老旧的内嵌 webview 还跟不上。\n\n如果你能控制交付（带回退的构建流水线），AVIF 很棒。如果你需要一种"开箱即用"的格式，WebP 更稳妥。',
      },
      {
        headingEn: 'Encoding speed: JPEG is still fastest',
        headingZh: '编码速度：JPEG 仍然最快',
        bodyEn: 'Smaller files come at a cost: encoding time.\n\n• JPEG — encodes in milliseconds. Practically free.\n• WebP — fast, but a bit slower than JPEG.\n• AVIF — noticeably slower, often a few hundred milliseconds per image (AV1 is a heavy codec).\n\nFor one-off manual conversions in a browser, this difference is a non-issue. But in a build pipeline converting thousands of images, AVIF\'s slower encode can add up — which is why many teams encode AVIF once and cache it forever.',
        bodyZh: '更小的文件是有代价的：编码时间。\n\n• JPEG —— 毫秒级编码，几乎零成本。\n• WebP —— 快，但比 JPEG 略慢。\n• AVIF —— 明显更慢，每张常要几百毫秒（AV1 是重量级编解码器）。\n\n在浏览器里做一次性手动转换，这个差异无关紧要。但在转换成千上万张图的构建流水线里，AVIF 更慢的编码会累积——所以很多团队只编一次 AVIF 并永久缓存。',
      },
      {
        headingEn: 'The verdict',
        headingZh: '结论',
        bodyEn: '• Absolute smallest files (build pipeline, cached forever) → AVIF.\n• Best practical default for the web → WebP.\n• Maximum compatibility, zero surprises → JPEG.\n\nFor most people reading this, WebP is the answer: it\'s 25–35% smaller than JPEG, universally supported, and converts instantly. You can convert JPEG → WebP → AVIF (and back) in your browser with CompressFast — no upload, no account — and see the exact size difference for yourself.',
        bodyZh: '• 追求最小文件（构建流水线、永久缓存）→ AVIF。\n• 网页最佳务实默认 → WebP。\n• 最大兼容、零意外 → JPEG。\n\n对大多数读者而言，答案就是 WebP：比 JPEG 小 25–35%、普遍支持、转换即时。你可以在浏览器里用极速压图完成 JPEG→WebP→AVIF（以及反向）转换——无需上传、无需注册——亲眼看到确切的体积差异。',
      },
    ],
    faqs: [
      { qEn: 'Is AVIF better than WebP?', qZh: 'AVIF 比 WebP 好吗？', aEn: 'AVIF produces smaller files (often 30–50% smaller than JPEG, vs WebP\'s 25–35%), but it encodes slower and has slightly newer browser support. For a build pipeline, AVIF wins; for quick manual conversion, WebP is more practical.', aZh: 'AVIF 文件更小（常比 JPEG 小 30–50%，WebP 是 25–35%），但编码更慢、浏览器支持略新。构建流水线选 AVIF；快速手动转换选 WebP 更实用。' },
      { qEn: 'Is AVIF smaller than WebP?', qZh: 'AVIF 比 WebP 小吗？', aEn: 'Yes, typically 20–30% smaller than WebP at equal visual quality. A 2.1MB JPEG becomes ~186KB as WebP but only ~102KB as AVIF. The tradeoff is slower encoding and slightly newer browser support.', aZh: '是的，相同视觉画质下通常比 WebP 再小 20–30%。2.1MB 的 JPEG 转 WebP 约 186KB，转 AVIF 只有约 102KB。代价是编码更慢、浏览器支持略新。' },
      { qEn: 'Should I still use JPEG in 2026?', qZh: '2026 年还用 JPEG 吗？', aEn: 'Only as a compatibility fallback. JPEG has 100% universal support but is the largest of the three. If you don\'t need to support very old browsers, WebP (or AVIF in a pipeline) is a strictly better choice.', aZh: '只作为兼容性兜底。JPEG 有 100% 的普遍支持，但它是三者里最大的。如果你不需要兼容极老的浏览器，WebP（或流水线里的 AVIF）是严格更好的选择。' },
      { qEn: 'Can I convert WebP to AVIF (or JPEG) in the browser?', qZh: '能在浏览器里把 WebP 转成 AVIF（或 JPEG）吗？', aEn: 'Yes. Tools like CompressFast convert between JPEG, WebP, AVIF, and more — all locally in your browser with no upload. Drop the file, pick the target format, download the result.', aZh: '能。极速压图这类工具支持 JPEG、WebP、AVIF 等格式之间的互转——全部在浏览器本地完成，无需上传。拖入文件、选目标格式、下载结果。' },
      { qEn: 'Which is the smallest image format?', qZh: '最小的图片格式是哪个？', aEn: 'Among the common lossy web formats, AVIF is the smallest — typically 30–50% smaller than JPEG and 20–30% smaller than WebP. For lossless images, WebP lossless and AVIF lossless are both smaller than PNG.', aZh: '在常见的有损网页格式里，AVIF 最小——通常比 JPEG 小 30–50%，比 WebP 再小 20–30%。无损图片方面，无损 WebP 和无损 AVIF 都比 PNG 小。' },
    ],
    relatedTools: ['convert-to-webp', 'avif-to-webp', 'jpg-to-webp', 'compress-images'],
  },
}

export const GUIDE_SLUGS = Object.keys(GUIDES)
