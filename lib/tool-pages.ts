/**
 * SEO Landing Pages — tool definitions
 * Each tool targets a specific search keyword with unique content.
 */
export interface ToolPageData {
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
  targetFormat: string  // 'png' | 'jpeg' | 'webp' | 'original'
  defaultSettings?: {
    quality?: number
    outputFormat?: string
    speed?: number
    resizeWidth?: number
    resizeHeight?: number
    lossless?: boolean
    stripMetadata?: boolean
  }
  benefits: { icon: string; titleEn: string; titleZh: string; descEn: string; descZh: string }[]
  howTo: { step: number; titleEn: string; titleZh: string; descEn: string; descZh: string }[]
  faqs: { qEn: string; qZh: string; aEn: string; aZh: string }[]
  detailedGuideEn?: string   // ~500-800 word usage guide, rendered as rich text
  detailedGuideZh?: string
  relatedTools: string[]
}

export const TOOLS: Record<string, ToolPageData> = {
  'compress-png': {
    slug: 'compress-png',
    titleEn: 'Compress PNG Online Free — No Upload | CompressFast',
    titleZh: '在线PNG压缩 — 免费无损 | 极速压图',
    descriptionEn: 'Compress PNG images online for free. 100% browser-based — files never uploaded. Reduce PNG file size by up to 80% without quality loss. Batch compression supported.',
    descriptionZh: '免费在线压缩PNG图片，100%浏览器本地处理，文件不上传。最高减小80%体积，画质无损失。支持批量压缩。',
    keywords: ['compress png', 'png compressor', 'compress png online', 'reduce png size', 'png compression', 'compress png without losing quality', 'free png compressor'],
    heroTitleEn: 'Compress PNG Images Online',
    heroTitleZh: '在线压缩PNG图片',
    heroSubEn: 'Free, private, no upload. Reduce PNG file size by up to 80% — right in your browser.',
    heroSubZh: '免费、隐私安全、不上传。在浏览器中直接压缩，最高减小80%体积。',
    targetFormat: 'png',
    defaultSettings: { quality: 70, outputFormat: 'png', speed: 3, lossless: true, stripMetadata: true },
    benefits: [
      { icon: '🔒', titleEn: '100% Private', titleZh: '100%隐私保护', descEn: 'Your PNG files never leave your device. All compression happens locally in your browser.', descZh: 'PNG文件不会离开你的设备，所有压缩在浏览器本地完成。' },
      { icon: '⚡', titleEn: 'Lossless Compression', titleZh: '无损压缩', descEn: 'Powered by oxipng WASM — achieve up to 80% size reduction without any quality loss.', descZh: '基于oxipng WASM引擎，最高减小80%体积，画质完全无损。' },
      { icon: '📦', titleEn: 'Batch 30 Images', titleZh: '批量30张', descEn: 'Compress up to 30 PNG images at once. ZIP download all results in one click.', descZh: '同时压缩最多30张PNG图片，一键ZIP打包下载。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop or Select PNG Files', titleZh: '拖入或选择PNG文件', descEn: 'Drag PNG images into the upload area, click to browse, or paste from clipboard with Ctrl+V.', descZh: '将PNG图片拖入上传区、点击选择、或Ctrl+V粘贴。' },
      { step: 2, titleEn: 'Choose Compression Settings', titleZh: '选择压缩设置', descEn: 'Select "Lossless" for maximum quality preservation, or adjust the quality slider for smaller files.', descZh: '选择"无损模式"保留最佳画质，或调节画质滑块获取更小体积。' },
      { step: 3, titleEn: 'Download Compressed PNGs', titleZh: '下载压缩后的PNG', descEn: 'Click download on each image, or use "Download All" to get a ZIP file of all compressed PNGs.', descZh: '逐张下载或一键打包ZIP下载所有压缩结果。' },
    ],
    faqs: [
      { qEn: 'Does PNG compression lose quality?', qZh: 'PNG压缩会损失画质吗？', aEn: 'No — CompressFast offers lossless PNG compression powered by oxipng WASM. Your PNG images will be visually identical to the original while being up to 80% smaller.', aZh: '不会——极速压图提供基于oxipng WASM的无损压缩，PNG图片压缩后画质与原始完全一致，体积最多减小80%。' },
      { qEn: 'Are my PNG files uploaded to a server?', qZh: 'PNG文件会被上传到服务器吗？', aEn: 'Never. All compression happens locally in your browser using Web Workers. You can disconnect from the internet and it still works.', aZh: '绝不会。所有压缩在浏览器本地通过Web Worker完成，断开网络照样能使用。' },
      { qEn: 'Can I compress multiple PNG files at once?', qZh: '可以同时压缩多个PNG文件吗？', aEn: 'Yes — compress up to 30 PNGs at once for free (500 with Pro). All processed in parallel for maximum speed.', aZh: '可以——免费版同时压缩最多30张PNG（Pro版500张），并行处理，速度极快。' },
      { qEn: 'What is oxipng and how does it work?', qZh: 'oxipng是什么？怎么工作的？', aEn: 'oxipng is a lossless PNG optimizer that runs as WebAssembly (WASM) in your browser. It trial-runs multiple compression strategies — zlib, Zopfli, filter combinations — and picks the smallest result. Unlike lossy compression, oxipng guarantees pixel-perfect output every time.', aZh: 'oxipng是一款无损PNG优化器，通过WebAssembly在浏览器中运行。它会尝试多种压缩策略——zlib、Zopfli、不同滤镜组合——并选择体积最小的结果。与有损压缩不同，oxipng每次都保证像素级完美输出。' },
      { qEn: 'Can I resize PNG images while compressing?', qZh: '压缩PNG的同时可以调整尺寸吗？', aEn: 'Yes. CompressFast includes a resize feature — set target width and height in pixels, or use one-click presets like 50%, 75%, 1080p, or 720p. The resize respects aspect ratio and never upscales small images, preserving quality.', aZh: '可以。极速压图内置尺寸调整功能——设置像素宽高，或用一键预设（50%、75%、1080p、720p）。等比缩放，不会放大小图，确保画质不受损。' },
      { qEn: 'What file size can I expect after PNG compression?', qZh: 'PNG压缩后文件能减小多少？', aEn: 'Results vary by content: screenshots and UI images typically compress 30-60%, while photographs as PNG may see 10-30% reduction. Images with large solid-color areas (logos, icons) can achieve up to 80% savings. The oxipng engine automatically finds the best strategy for each image.', aZh: '压缩效果因图片内容而异：截图和UI图片通常减小30-60%，照片类PNG可能减小10-30%。大面积纯色的图片（Logo、图标）最高可减小80%。oxipng引擎会为每张图片自动找到最佳策略。' },
      { qEn: 'Is there a file size limit for PNG compression?', qZh: 'PNG压缩有文件大小限制吗？', aEn: 'Free users can compress PNG files up to 10MB each and 20 files per batch. Pro users get 50MB per file and 500 files per batch. There is also a monthly quota of 400 free compressions — reset at the start of each month.', aZh: '免费用户单文件上限10MB，每次最多20张。Pro用户单文件50MB，每次500张。此外免费用户每月有400次压缩配额，月初重置。' },
      { qEn: 'Can I add watermarks to my PNG images?', qZh: '可以给PNG图片加水印吗？', aEn: 'Yes — CompressFast supports both text and image watermarks. Position them anywhere in a 9-grid layout, adjust opacity, rotation, and scale. All watermark rendering happens locally in your browser.', aZh: '可以——极速压图支持文字和图片两种水印。九宫格任意定位，可调透明度、旋转角度和大小。所有水印渲染都在浏览器本地完成。' },
    ],
    detailedGuideEn: `PNG (Portable Network Graphics) is the go-to format when you need lossless quality — screenshots, logos, UI elements, and any image with text or sharp edges. But PNG files are notoriously large. A single screenshot can easily exceed 2-3MB, which slows down your website and eats storage.

CompressFast's PNG compressor tackles this with a two-pronged approach:

1. Lossless optimization via oxipng WASM — This is the star of the show. oxipng runs entirely in your browser as WebAssembly, trying multiple compression strategies (different zlib levels, Zopfli, PNG filter combinations) and automatically picking the smallest result. The output is pixel-perfect — every single pixel matches the original. Typical savings range from 20% to 60% for screenshots and UI images.

2. Lossy compression with color quantization — For cases where you're willing to trade a tiny bit of quality for dramatic size savings, we offer color bit-depth reduction (down to 2 bits per channel) and PNG quantization. A 24-bit PNG with millions of colors can become an 8-bit PNG with virtually no visible difference, slashing the file size by 50-80%.

When you combine these with our built-in resize tool, you can take a 1920×1080 screenshot at 2.5MB and turn it into a 1280×720 optimized PNG at 400KB — that's an 84% reduction, all without uploading a single byte to any server.

Privacy is baked in: every compression, every resize, every watermark runs inside a Web Worker in your browser. You can literally disconnect your internet after loading the page and everything still works. No server ever sees your files.`,

    detailedGuideZh: `PNG（便携式网络图形）是处理需要无损画质的图片时的首选格式——截图、Logo、UI元素、任何包含文字或锐利边缘的图像。但PNG文件通常很大，一张截图动辄2-3MB，拖慢网站速度，占用存储空间。

极速压图的PNG压缩工具采用双管齐下的策略来解决这个问题：

1. 基于oxipng WASM的无损优化——这是核心亮点。oxipng以WebAssembly形式直接在浏览器中运行，尝试多种压缩策略（不同zlib级别、Zopfli算法、PNG滤镜组合），自动选择体积最小的结果。输出结果像素级完美——每一个像素点都与原图完全一致。截图和UI图片通常可减小20%-60%的体积。

2. 色彩量化的有损压缩——如果你愿意用极微小的画质换巨大的体积缩减，我们提供色彩位深降低（最低每通道2比特）和PNG量化功能。一张24位百万色的PNG可以变成8位PNG，肉眼几乎看不出差异，体积却减少50-80%。

结合内置的尺寸调整工具，你可以将一张1920×1080、2.5MB的截图，变成1280×720、400KB的优化PNG——体积减少84%，整个过程无需上传任何文件到任何服务器。

隐私是内建特性：每一次压缩、每一次尺寸调整、每一次水印渲染都在浏览器的Web Worker中完成。加载页面后你可以断网，一切仍然正常工作。任何服务器都无法接触到你的文件。`,
    relatedTools: ['compress-jpeg', 'convert-to-webp', 'compress-images'],
  },

  'compress-jpeg': {
    slug: 'compress-jpeg',
    titleEn: 'Compress JPEG Online Free — Reduce Image Size | CompressFast',
    titleZh: '在线JPEG压缩 — 免费减小图片体积 | 极速压图',
    descriptionEn: 'Compress JPEG images online for free. No upload required — all processing happens in your browser. Reduce JPEG size by up to 90% with adjustable quality. Batch support.',
    descriptionZh: '免费在线压缩JPEG图片，无需上传，浏览器本地处理。可调节画质，最高减小90%体积，支持批量处理。',
    keywords: ['compress jpeg', 'jpeg compressor', 'compress jpg online', 'reduce jpeg size', 'jpg compression', 'compress jpeg without losing quality', 'free jpg compressor', 'compress jpg to smaller size'],
    heroTitleEn: 'Compress JPEG Images Online',
    heroTitleZh: '在线压缩JPEG图片',
    heroSubEn: 'Reduce JPEG file size by up to 90%. Adjustable quality, batch processing, no upload.',
    heroSubZh: '最高减小90%体积，可调画质，批量处理，无需上传。',
    targetFormat: 'jpeg',
    defaultSettings: { quality: 65, outputFormat: 'jpeg', speed: 5, stripMetadata: true },
    benefits: [
      { icon: '🎯', titleEn: 'Adjustable Quality', titleZh: '可调画质', descEn: 'Fine-tune compression from 10% to 100% quality. Live preview shows estimated output size as you adjust.', descZh: '画质10%-100%自由调节，实时预览估算输出大小。' },
      { icon: '📉', titleEn: 'Up to 90% Smaller', titleZh: '最高减小90%', descEn: 'Aggressive compression at lower quality settings can reduce JPEG size by up to 90% — perfect for web use.', descZh: '低画质设置下最高可减小90%体积，非常适合网页使用。' },
      { icon: '🛡️', titleEn: 'Strip EXIF Data', titleZh: '清除EXIF数据', descEn: 'Automatically remove GPS location, camera model, and shooting parameters for privacy.', descZh: '自动清除GPS定位、相机型号、拍摄参数等隐私数据。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload JPEG/JPG Files', titleZh: '上传JPEG/JPG文件', descEn: 'Drag and drop JPEG images, click to select, or paste from clipboard.', descZh: '拖入JPEG图片、点击选择、或Ctrl+V粘贴。' },
      { step: 2, titleEn: 'Adjust Quality Slider', titleZh: '调节画质滑块', descEn: 'Lower quality = smaller file. 65-85% is the sweet spot — great compression with barely visible quality loss.', descZh: '画质越低体积越小。65-85%是性价比最高的区间——体积大幅减小，肉眼几乎看不出差异。' },
      { step: 3, titleEn: 'Download Compressed JPEGs', titleZh: '下载压缩结果', descEn: 'Download each image individually or batch download as ZIP. Compare before/after sizes instantly.', descZh: '逐张下载或批量ZIP打包下载，即时对比压缩前后体积。' },
    ],
    faqs: [
      { qEn: 'What quality setting should I use for JPEG?', qZh: 'JPEG压缩用什么画质参数好？', aEn: 'For web images, 65-85% is recommended — files become 50-80% smaller with minimal visual difference. For photography, use 85-95%. For thumbnails, 50-70% is fine.', aZh: '网页图片建议65-85%，体积减小50-80%，肉眼几乎无差异。摄影作品用85-95%，缩略图50-70%即可。' },
      { qEn: 'Can I convert other formats to JPEG?', qZh: '能把其他格式转成JPEG吗？', aEn: 'Yes — upload PNG, WebP, GIF, BMP, SVG, or HEIC files and set output format to JPEG. All conversion happens locally.', aZh: '可以——上传PNG、WebP、GIF、BMP、SVG、HEIC等格式，输出格式选JPEG即可，本地转换。' },
      { qEn: 'Will compression remove my photo metadata?', qZh: '压缩会删除照片元数据吗？', aEn: 'You control this. Enable "Strip Photo Info" to remove EXIF/GPS/camera data for privacy. Disable it to preserve metadata.', aZh: '可以选择开启"清除照片信息"来删除EXIF/GPS/相机数据以保护隐私，也可以关闭以保留元数据。' },
      { qEn: 'What\'s the difference between JPEG and JPG?', qZh: 'JPEG和JPG有什么区别？', aEn: 'Nothing — they are the same format. JPG is simply a 3-letter extension from the DOS/Windows era when file extensions were limited to 3 characters. CompressFast handles both identically.', aZh: '没有任何区别——它们是同一种格式。JPG只是DOS/Windows时代文件名只能有3个字符扩展名时的缩写。极速压图对两者一视同仁。' },
      { qEn: 'Does repeated JPEG compression degrade quality?', qZh: '反复压缩JPEG会损失画质吗？', aEn: 'Yes — JPEG is a lossy format, so each save-recompress cycle introduces new artifacts. This is called "generation loss." CompressFast helps avoid this by letting you compress once at the right quality setting, and we recommend keeping original files as masters.', aZh: '会——JPEG是有损格式，每次保存-再压缩循环都会产生新的失真痕迹，这叫做"世代损失"。极速压图让你一次性压到合适画质，建议保留原始文件作为母版。' },
      { qEn: 'What file size can I expect after JPEG compression?', qZh: 'JPEG压缩后文件能减小多少？', aEn: 'At 85% quality, typical JPEG photos compress 40-60%. At 65%, you can achieve 60-80% reduction. The exact savings depend on image complexity — photos with lots of detail compress less than simple graphics. CompressFast shows live size estimates as you adjust the quality slider.', aZh: '85%画质下，典型JPEG照片能减小40-60%。65%画质下可达60-80%。具体效果取决于图片复杂程度——细节丰富的照片压缩率低于简单图形。极速压图在调节画质滑块时会实时显示估算大小。' },
      { qEn: 'Can I compress JPEG images in bulk?', qZh: '可以批量压缩JPEG图片吗？', aEn: 'Absolutely. Free users can batch compress up to 20 JPEGs at once (30 for mixed formats). Pro users can process up to 500 files per batch. Use "Download All" to get everything in a single ZIP file.', aZh: '当然可以。免费用户单次最多批量压缩20张JPEG（混合格式30张）。Pro用户每批最多500张。点击"下载全部"一键获取ZIP包。' },
      { qEn: 'Is there a file size limit for JPEG compression?', qZh: 'JPEG压缩有文件大小限制吗？', aEn: 'Free users can compress JPEG files up to 10MB each. Pro users get 50MB per file. Most smartphone JPEGs are 2-8MB, well within the free tier limit.', aZh: '免费用户每张JPEG最大10MB，Pro用户50MB。大多数手机拍的JPEG照片在2-8MB之间，完全在免费版限制内。' },
    ],
    detailedGuideEn: `JPEG (Joint Photographic Experts Group) is the most widely used image format on the web and in digital photography. It's been around since 1992, and for good reason — JPEG offers excellent compression ratios with adjustable quality, making it the default choice for photographs, social media posts, e-commerce product images, and any scenario where file size matters more than pixel-perfect reproduction.

    CompressFast's JPEG compressor gives you precise control over the compression-quality tradeoff:

    1. Quality slider (10-100%) — This is your main control. At 85-100%, compression is gentle — file size drops 20-40% and the visual difference is essentially invisible. At 65-85% (the "web sweet spot"), you get 50-70% savings with barely perceptible quality loss — perfect for blog posts, e-commerce listings, and social media. Below 60%, compression becomes aggressive — ideal for thumbnails, email attachments, and preview images where small file size is the priority.

    2. Chroma subsampling — JPEG encodes brightness (luma) at full resolution but color (chroma) at reduced resolution, because human eyes are far more sensitive to brightness changes than color changes. CompressFast applies optimal chroma subsampling automatically based on your quality setting — no need to understand the technical details.

    3. Progressive vs baseline — At higher quality settings, our encoder produces progressive JPEGs that load in waves (blurry → sharp) rather than top-to-bottom. This improves perceived loading speed on websites and gives users instant feedback that an image is loading.

    Combine compression with our built-in resizer and you can take a 4000×3000 smartphone photo at 4.5MB down to a 1200×900 web-ready JPEG at 150KB — a 97% reduction. The resize step is often more impactful than compression alone, especially for images destined for the web where full-resolution files are rarely needed.

    Privacy note: every JPEG you drop into CompressFast stays on your device. The compression runs in a Web Worker — a separate browser thread — so the main page stays responsive. You can compress 20 photos simultaneously without any lag. Disconnect your internet after loading the page and everything still works. We never see your photos, and we never want to.`,

    detailedGuideZh: `JPEG（联合图像专家组）是网页和数码摄影中使用最广泛的图像格式。它自1992年问世以来一直长盛不衰是有原因的——JPEG以可调节的画质提供出色的压缩比，成为照片、社交媒体帖子、电商产品图以及任何文件体积优先于像素级完美复现的场景下的默认选择。

    极速压图的JPEG压缩工具让你精确掌控压缩与画质的平衡：

    1. 画质滑块（10-100%）——这是你的主控开关。85-100%区间，压缩温和——文件体积减小20-40%，视觉差异基本不可见。65-85%区间（"网页甜点区"），体积减小50-70%，画质损失肉眼几乎察觉不到——非常适合博客文章、电商列表和社交媒体。60%以下，压缩变得更激进——适合缩略图、邮件附件和预览图，优先追求小体积。

    2. 色度子采样——JPEG以全分辨率编码亮度信息，但以降低的分辨率编码色彩信息，因为人眼对亮度变化的敏感度远高于色彩变化。极速压图根据你的画质设置自动应用最优色度子采样——你不需要理解这些技术细节。

    3. 渐进式 vs 基线式——在较高画质设置下，我们的编码器生成渐进式JPEG，图片以波浪式加载（模糊→清晰）而非从上到下逐行显示。这能改善网站的感知加载速度，让用户立即知道有图片正在加载。

    将压缩与内置尺寸调整结合，你可以将一张4000×3000、4.5MB的手机照片变成1200×900、150KB的网页级JPEG——体积减小97%。特别是对于网页用途、几乎不需要原始分辨率的场景，尺寸调整往往比单纯压缩效果更显著。

    隐私说明：你拖入极速压图的每一张JPEG都不会离开你的设备。压缩在Web Worker（浏览器独立线程）中运行，主页面保持流畅响应。你可以同时压缩20张照片而没有任何卡顿。加载页面后断开网络，一切仍然正常工作。我们永远看不到你的照片，我们也永远不想看到。`,
    relatedTools: ['compress-png', 'convert-to-webp', 'compress-images'],
  },

  'convert-to-webp': {
    slug: 'convert-to-webp',
    titleEn: 'Convert to WebP Online Free — PNG/JPEG to WebP | CompressFast',
    titleZh: '在线转WebP格式 — PNG/JPEG免费转WebP | 极速压图',
    descriptionEn: 'Convert PNG, JPEG, and other images to WebP format online for free. WebP files are 25-35% smaller than JPEG with same quality. No upload, batch conversion supported.',
    descriptionZh: '免费在线将PNG、JPEG等图片转换为WebP格式。WebP比JPEG小25-35%，画质相同。无需上传，支持批量转换。',
    keywords: ['convert to webp', 'webp converter', 'png to webp', 'jpeg to webp', 'convert image to webp', 'free webp converter', 'online webp converter', 'jpg to webp'],
    heroTitleEn: 'Convert Images to WebP',
    heroTitleZh: '图片转WebP格式',
    heroSubEn: '25-35% smaller than JPEG at the same quality. Free, instant, no upload.',
    heroSubZh: '同等画质比JPEG小25-35%。免费、即时、无需上传。',
    targetFormat: 'webp',
    defaultSettings: { quality: 75, outputFormat: 'webp', speed: 5 },
    benefits: [
      { icon: '📦', titleEn: '25-35% Smaller', titleZh: '体积小25-35%', descEn: 'WebP delivers the same visual quality as JPEG at a significantly smaller file size — faster websites, less bandwidth.', descZh: '同等画质下WebP比JPEG小25-35%，网站加载更快，节省带宽。' },
      { icon: '🔍', titleEn: 'Transparency Support', titleZh: '支持透明通道', descEn: 'Unlike JPEG, WebP supports alpha transparency. Perfect for logos, icons, and UI elements.', descZh: '与JPEG不同，WebP支持透明通道，非常适合Logo、图标和UI元素。' },
      { icon: '🌐', titleEn: '96% Browser Support', titleZh: '96%浏览器支持', descEn: 'All modern browsers support WebP: Chrome, Firefox, Safari, Edge. Safe to use on production websites.', descZh: '所有现代浏览器都支持WebP：Chrome、Firefox、Safari、Edge，生产环境可以放心使用。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload Your Images', titleZh: '上传图片', descEn: 'Drop PNG, JPEG, or any supported format into the upload area. Batch up to 30 files at once.', descZh: '将PNG、JPEG等格式图片拖入上传区，一次最多30张。' },
      { step: 2, titleEn: 'Select WebP as Output', titleZh: '选择WebP输出', descEn: 'Choose WebP from the output format selector. Adjust quality slider — 75% is recommended for web.', descZh: '在输出格式中选择WebP，调节画质滑块——网页推荐75%。' },
      { step: 3, titleEn: 'Download WebP Files', titleZh: '下载WebP文件', descEn: 'Download individual WebP files or batch download as ZIP. Ready to use on your website.', descZh: '逐张下载WebP文件或批量ZIP打包，直接可用于网站。' },
    ],
    faqs: [
      { qEn: 'Why should I convert to WebP?', qZh: '为什么要转成WebP？', aEn: 'WebP files are 25-35% smaller than JPEG at the same quality level. For websites, this means faster page loads, better SEO rankings, and lower bandwidth costs.', aZh: '同等画质下WebP比JPEG小25-35%。对网站来说意味着加载更快、SEO排名更好、带宽成本更低。' },
      { qEn: 'Do all browsers support WebP?', qZh: '所有浏览器都支持WebP吗？', aEn: 'All modern browsers support WebP (Chrome, Firefox, Safari 14+, Edge). For older browsers, use the <picture> tag to provide JPEG fallbacks.', aZh: '所有现代浏览器都支持WebP（Chrome、Firefox、Safari 14+、Edge）。为兼容老旧浏览器，建议用<picture>标签提供JPEG降级方案。' },
      { qEn: 'Can I convert WebP back to PNG or JPEG?', qZh: '能把WebP转回PNG或JPEG吗？', aEn: 'Yes — just upload your WebP file and select PNG or JPEG as the output format. All format conversions are supported.', aZh: '可以——上传WebP文件，输出格式选PNG或JPEG即可，支持所有格式互转。' },
      { qEn: 'What image formats can I convert to WebP?', qZh: '哪些格式可以转成WebP？', aEn: 'PNG, JPEG, GIF, BMP, SVG, HEIC, AVIF — essentially any common image format. CompressFast supports 8 input formats. For animated GIFs, WebP supports animation too (animated WebP), which is typically 60-80% smaller.', aZh: 'PNG、JPEG、GIF、BMP、SVG、HEIC、AVIF——几乎所有常见图片格式都可以。极速压图支持8种输入格式。GIF动图也可以转成动态WebP，通常体积减小60-80%。' },
      { qEn: 'Does converting to WebP reduce image quality?', qZh: '转WebP会降低画质吗？', aEn: 'At the default 75% quality setting, the quality loss is virtually invisible to the naked eye while file size drops dramatically. For archival purposes, use 90-100% quality. For web use, 70-80% is the sweet spot — smallest file with great visuals. CompressFast shows you a live preview so you can judge for yourself.', aZh: '75%画质设置下，肉眼几乎看不出差异，体积却大幅减小。用于存档可选90-100%，网页使用70-80%是最佳区间——文件最小、观感很好。极速压图提供实时预览，你可以自己判断。' },
      { qEn: 'Can I batch convert multiple images to WebP?', qZh: '可以批量转WebP吗？', aEn: 'Yes — convert up to 30 images to WebP at once for free (500 with Pro). All files are processed in parallel. Use "Download All" to get a single ZIP file of all converted WebP images.', aZh: '可以——免费版一次转换最多30张为WebP（Pro版500张），全部并行处理。点击"下载全部"一键获取所有WebP的ZIP包。' },
      { qEn: 'What quality setting should I use for WebP conversion?', qZh: '转WebP用什么画质参数合适？', aEn: '75% is the recommended default — it delivers excellent compression with no visible quality loss. For photos on a portfolio site, 85% gives near-lossless appearance. For blog post images, 65-75% is ideal. For product images where every detail matters, use 90%. The "sweet spot" for most web use is 70-80%.', aZh: '推荐默认75%——压缩率优秀且无可见画质损失。作品集网站的照片用85%，近乎无损。博客配图65-75%即可。产品图细节重要时用90%。大多数网页场景"甜点区间"是70-80%。' },
      { qEn: 'How much smaller will my images be after converting to WebP?', qZh: '转成WebP后图片能小多少？', aEn: 'Typical results: PNG→WebP: 40-80% smaller (especially with transparency). JPEG→WebP: 25-35% smaller at the same visual quality. The exact savings depend on image content — photos with lots of texture compress less than flat-color graphics. CompressFast shows real-time size estimates.', aZh: '典型效果：PNG→WebP 减小40-80%（尤其带透明通道时）。JPEG→WebP 同等画质减小25-35%。具体效果取决于图片内容——纹理丰富的照片压缩率低于纯色图形。极速压图实时显示大小估算。' },
    ],
    detailedGuideEn: `WebP is Google's modern image format designed to replace JPEG, PNG, and GIF with a single, more efficient format. Released in 2010, it's now supported by 96%+ of browsers worldwide and is the default format for most performance-conscious websites.

    CompressFast's WebP converter makes the transition painless:

    1. One-click format conversion — Upload any image (PNG, JPEG, GIF, BMP, SVG, HEIC, AVIF) and select WebP as the output format. That's it. No software to install, no command line to learn. The conversion happens instantly in your browser.

    2. Smart quality control — The quality slider (10-100%) lets you dial in the exact balance you need. At 75-85%, WebP delivers JPEG-equivalent quality at 25-35% smaller file sizes. Unlike JPEG, WebP also supports lossless compression and alpha transparency — features previously exclusive to PNG.

    3. Lossless WebP option — Need pixel-perfect preservation? Enable lossless mode. This is ideal for logos, icons, screenshots of text, and any image with sharp edges or transparency. Lossless WebP files are still 26% smaller than PNG on average, according to Google's own benchmarks.

    4. Animated WebP — Have an animated GIF? WebP supports animation too, and animated WebP files are typically 60-80% smaller than the equivalent GIF. Same animation, fraction of the file size. CompressFast preserves animation frames when converting from GIF.

    The real power of WebP shows in bulk. Converting a website's entire image library from PNG/JPEG to WebP can cut total image payload by 40-60% — that's faster page loads, better Core Web Vitals scores, and improved SEO rankings. Google explicitly uses page speed as a ranking factor.

    Privacy note: all conversions happen in your browser. Your original files and converted WebP images never touch a server. Even if you're converting sensitive design mockups or unreleased product photos, everything stays on your device.`,

    detailedGuideZh: `WebP 是 Google 推出的现代图像格式，旨在用单一、更高效的格式替代 JPEG、PNG 和 GIF。自 2010 年发布以来，全球 96%+ 的浏览器已支持 WebP，它已成为大多数注重性能的网站的默认图像格式。

    极速压图的 WebP 转换器让格式迁移变得轻松简单：

    1. 一键格式转换——上传任意图片（PNG、JPEG、GIF、BMP、SVG、HEIC、AVIF），选择 WebP 为输出格式，完成。无需安装软件，无需学习命令行。转换在浏览器中即时完成。

    2. 智能画质控制——画质滑块（10-100%）让你精确掌控平衡点。75-85% 画质下，WebP 以 JPEG 同等观感但体积减小 25-35%。与 JPEG 不同，WebP 还支持无损压缩和透明通道——这些之前只有 PNG 才有。

    3. 无损 WebP 模式——需要像素级保真？开启无损模式。这非常适合 Logo、图标、文字截图及任何有锐利边缘或透明度的图片。根据 Google 官方基准测试，无损 WebP 平均仍比 PNG 小 26%。

    4. 动态 WebP——有 GIF 动图？WebP 同样支持动画，且动态 WebP 通常比等效 GIF 小 60-80%。同样的动画效果，零头大小的文件。极速压图在从 GIF 转换时保留动画帧。

    WebP 在批量场景下的威力才真正展现。将网站整个图片库从 PNG/JPEG 转为 WebP，图片总负载可减少 40-60%——这意味着更快的页面加载、更好的 Core Web Vitals 评分和改善的 SEO 排名。Google 明确将页面速度作为搜索排名因素。

    隐私说明：所有转换在浏览器中完成。原始文件和转换后的 WebP 永远不会触及任何服务器。即使你在转换敏感的设计稿或未发布的产品照片，一切数据都留在你的设备上。`,
    relatedTools: ['compress-png', 'compress-jpeg', 'webp-to-png'],
  },

  'compress-images': {
    slug: 'compress-images',
    titleEn: 'Compress Images Online Free — Batch Image Compressor | CompressFast',
    titleZh: '在线图片压缩 — 免费批量压缩工具 | 极速压图',
    descriptionEn: 'Free online image compression for PNG, JPEG, WebP, AVIF, and more. Batch up to 30 images. 100% browser-based, no upload. Compress images without losing quality.',
    descriptionZh: '免费在线图片压缩，支持PNG、JPEG、WebP、AVIF等多种格式。批量30张，纯浏览器处理，文件不上传。无损压缩图片。',
    keywords: ['compress images', 'compress images online', 'image compressor', 'online image compression', 'batch image compressor', 'compress image online free', 'reduce image size online'],
    heroTitleEn: 'Compress Images Online',
    heroTitleZh: '在线压缩图片',
    heroSubEn: 'Free batch image compression. PNG, JPEG, WebP, AVIF — all processed locally, no upload.',
    heroSubZh: '免费批量图片压缩。PNG、JPEG、WebP、AVIF全覆盖，本地处理，无需上传。',
    targetFormat: 'original',
    defaultSettings: { quality: 70, speed: 5, stripMetadata: true },
    benefits: [
      { icon: '📦', titleEn: 'Batch Processing', titleZh: '批量处理', descEn: 'Compress up to 30 images at once — all formats supported. ZIP download all results in one click.', descZh: '一次压缩最多30张图片，支持所有格式，一键ZIP打包下载。' },
      { icon: '🔒', titleEn: '100% Private & Secure', titleZh: '隐私安全', descEn: 'Your images never leave your device. All compression happens locally in your browser. No server upload, no data collection.', descZh: '图片不会离开你的设备，所有压缩在浏览器本地完成。不上传服务器，不收集数据。' },
      { icon: '🎨', titleEn: 'All Major Formats', titleZh: '全格式支持', descEn: 'Input: PNG, JPEG, WebP, AVIF, GIF, BMP, SVG, HEIC. Output: PNG, JPEG, WebP, AVIF. Format conversion included.', descZh: '输入8种格式，输出4种格式。支持格式互转，一站式处理。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop Your Images', titleZh: '拖入图片', descEn: 'Drag and drop any number of images, click to browse, or paste from clipboard with Ctrl+V. All common formats supported.', descZh: '拖入任意数量图片、点击选择、或Ctrl+V粘贴，支持所有常见格式。' },
      { step: 2, titleEn: 'Choose Settings & Compress', titleZh: '选择设置并压缩', descEn: 'Pick a preset (Max/Balanced/Best), adjust quality slider, or set a target file size. Click Compress All.', descZh: '选择预设（极限/均衡/最佳）、调节画质滑块、或设定目标文件大小。点击压缩全部。' },
      { step: 3, titleEn: 'Download Results', titleZh: '下载结果', descEn: 'Download individual compressed images or get everything in a single ZIP file. Compare before/after sizes instantly.', descZh: '逐张下载或一键ZIP打包，即时对比压缩前后体积变化。' },
    ],
    faqs: [
      { qEn: 'Is this image compressor really free?', qZh: '这个图片压缩工具真的免费吗？', aEn: 'Yes — completely free. No hidden fees, no watermarks, no usage limits. Pro version ($24.99 lifetime) adds 500 images/batch, AVIF, and custom presets.', aZh: '是的——完全免费。无隐藏收费、无水印、无使用次数限制。Pro版（$24.99买断）增加500张/次、AVIF输出、自定义预设。' },
      { qEn: 'Do I need to install anything?', qZh: '需要安装吗？', aEn: 'No — CompressFast works entirely in your browser. No download, no installation, no registration required. Even works offline as a PWA.', aZh: '不需要——极速压图完全在浏览器中运行。无需下载、无需安装、无需注册。支持PWA，可安装到桌面离线使用。' },
      { qEn: 'Will my image quality be affected?', qZh: '会影响画质吗？', aEn: 'You control the quality setting (0-100%). At 85%+, the difference is invisible to the naked eye. Lossless mode is also available for PNG compression.', aZh: '画质由你控制（0-100%）。85%以上肉眼几乎看不出差异。PNG还支持无损压缩模式。' },
      { qEn: 'What image formats can CompressFast compress?', qZh: '极速压图支持压缩哪些图片格式？', aEn: 'Input: PNG, JPEG, WebP, AVIF, GIF, BMP, SVG, HEIC (8 formats). Output: PNG, JPEG, WebP, AVIF (4 formats). Each format uses a different compression engine optimized for that specific type — oxipng WASM for PNG, browser-native codecs for others.', aZh: '输入：PNG、JPEG、WebP、AVIF、GIF、BMP、SVG、HEIC（8种格式）。输出：PNG、JPEG、WebP、AVIF（4种格式）。每种格式使用针对该类型优化的不同压缩引擎——PNG用oxipng WASM，其他格式用浏览器原生编解码器。' },
      { qEn: 'How does browser-based compression work?', qZh: '浏览器压缩是怎么实现的？', aEn: 'CompressFast uses Web Workers (background threads) and WebAssembly to run compression engines directly in your browser. Images are decoded with the browser\'s built-in codecs, processed in a worker thread (so the UI stays responsive), and re-encoded at your chosen quality. No data ever leaves your device — you can disconnect from the internet and everything still works.', aZh: '极速压图使用Web Worker（后台线程）和WebAssembly直接在浏览器中运行压缩引擎。图片通过浏览器内置编解码器解码，在Worker线程中处理（UI保持流畅），再以你选择的画质重新编码。所有数据不离开你的设备——断网后一切功能照常使用。' },
      { qEn: 'Can I compress images to a specific file size?', qZh: '能压缩到指定的文件大小吗？', aEn: 'Not directly — compression results depend on image content, so a fixed target size isn\'t always achievable. However, you can use the quality slider with live size estimation to dial in your desired balance. The before/after comparison shows exact byte savings for each image.', aZh: '不能直接指定——压缩结果取决于图片内容，固定目标大小不一定总能实现。但你可以通过画质滑块的实时大小估算来找到理想的平衡点。前后对比会显示每张图片精确的字节节省量。' },
      { qEn: 'Is there a limit on how many images I can compress?', qZh: '压缩图片有数量限制吗？', aEn: 'Free users can compress up to 30 images per batch (20 for single-format modes) and 400 total compressions per month (resets on the 1st). Pro users get 500 per batch with no monthly limits — $24.99 once, lifetime access.', aZh: '免费用户每批最多30张（单格式模式20张），每月400次压缩（月初重置）。Pro用户每批500张且无月度限制——$24.99一次性买断，终身使用。' },
      { qEn: 'How does CompressFast compare to other online compressors?', qZh: '极速压图和其他在线压缩工具有什么区别？', aEn: 'Three key differences: (1) Privacy — your files are never uploaded to a server. Most competitors process images in the cloud, meaning they have access to your files. (2) Format coverage — 8 input and 4 output formats, more than most free tools. (3) Pricing — free tier is generous (30/batch, 400/month), Pro is a one-time $24.99, not a subscription like TinyPNG ($25/year).', aZh: '三个关键区别：(1) 隐私——你的文件从不上传服务器。大多数竞品在云端处理图片，意味着它们能访问你的文件。(2) 格式覆盖——8种输入4种输出，比多数免费工具多。(3) 定价——免费版很大方（30张/批，400次/月），Pro版$24.99一次性买断，不像TinyPNG那样$25/年订阅。' },
    ],
    detailedGuideEn: `CompressFast is a universal image compression tool — drop in any common image format and get a smaller, web-ready file in seconds. Unlike single-format compressors that only handle PNG or JPEG, CompressFast automatically detects your image type and applies the optimal compression strategy for that format.

    Here's how the all-in-one approach works:

    1. Smart format detection — Each image is identified by its actual file signature, not just the extension. This means we catch mislabeled files (e.g., a PNG saved as .jpg) and apply the correct compression engine. No configuration needed on your part.

    2. Format-specific compression engines — PNG gets lossless oxipng WASM optimization. JPEG gets quality-based re-encoding with chroma subsampling. WebP gets both lossy and lossless modes. GIF gets per-frame palette optimization. AVIF (Pro) gets the latest AV1-based compression. Each engine is tuned for that format's strengths.

    3. Cross-format conversion built in — Compressing and converting are the same step. Want to turn your PNG into a WebP? Select WebP output and the compression engine handles both tasks simultaneously. No need for a separate converter tool.

    4. Batch everything — The universal compressor shines brightest in batch mode. Mix PNGs, JPEGs, and WebPs in the same upload. Each gets its own optimal compression. Download results as a single ZIP — every file correctly compressed, every format preserved (or converted if you chose a different output format).

    The universal tool is ideal when you have a folder of mixed images — product photos, screenshots, logos, social media graphics — and just want everything smaller without thinking about formats. For format-specific deep optimization, use the dedicated tool pages (compress-png, compress-jpeg, etc.).

    Privacy remains absolute: whether you compress 1 image or 500, nothing ever leaves your browser. The Web Workers hum away on background threads while you continue browsing or switch tabs. No uploads, no queues, no waiting on a server.`,

    detailedGuideZh: `极速压图是一款通用图片压缩工具——拖入任何常见图片格式，几秒内获得更小、更适合网页的文件。与只处理 PNG 或 JPEG 的单格式压缩器不同，极速压图自动检测你的图片类型，并为该格式应用最优压缩策略。

    以下是"全家桶"方案的工作原理：

    1. 智能格式检测——每张图片通过实际文件签名而非扩展名来识别。这意味着我们能发现标记错误的文件（如一个 PNG 却被保存成 .jpg 的文件），并应用正确的压缩引擎。你无需任何手动配置。

    2. 格式专属压缩引擎——PNG 使用无损 oxipng WASM 优化。JPEG 使用基于画质的重编码配合色度子采样。WebP 同时支持有损和无损模式。GIF 使用逐帧调色板优化。AVIF（Pro 专属）使用最新的 AV1 压缩。每个引擎都针对该格式的优势进行了调优。

    3. 内置跨格式转换——压缩和转换是同一个步骤。想把 PNG 变成 WebP？选 WebP 输出，压缩引擎同时完成压缩和转换两项任务。不需要单独打开转换工具。

    4. 批量全家桶——通用压缩器在批量模式下最为好用。同一批上传中可以混合 PNG、JPEG 和 WebP。每种格式获得各自最优压缩。一键 ZIP 下载所有结果——每个文件正确压缩，每种格式保留（或按你选择的输出格式统一转换）。

    当你的文件夹里图片格式五花八门——产品照片、截图、Logo、社交媒体素材混杂在一起——只想让它们全部变小而不用操心格式，通用工具就是最佳选择。如果需要针对特定格式的深度优化，请使用专属工具页（compress-png、compress-jpeg 等）。

    隐私始终如铁：无论压缩 1 张还是 500 张，没有任何数据离开你的浏览器。Web Worker 在后台线程默默工作，你可以继续浏览或切换标签页。没有上传、没有排队、不用等服务器响应。`,
    relatedTools: ['compress-png', 'compress-jpeg', 'convert-to-webp'],
  },

  'compress-gif': {
    slug: 'compress-gif',
    titleEn: 'Compress GIF Online Free — Reduce GIF Size | CompressFast',
    titleZh: '在线GIF压缩 — 免费减小GIF体积 | 极速压图',
    descriptionEn: 'Compress GIF images online for free. 100% browser-based — no upload. Reduce GIF file size without losing animation. Batch support, quality control, frame optimization.',
    descriptionZh: '免费在线压缩GIF动图，100%浏览器本地处理，无需上传。减小GIF体积保留动画效果。支持批量处理、画质调节。',
    keywords: ['compress gif', 'gif compressor', 'compress gif online', 'reduce gif size', 'compress animated gif', 'gif optimizer', 'free gif compressor'],
    heroTitleEn: 'Compress GIF Images Online',
    heroTitleZh: '在线压缩GIF动图',
    heroSubEn: 'Reduce GIF file size without breaking animations. Free, private, no upload.',
    heroSubZh: '减小GIF体积、保留动画效果。免费、隐私安全、无需上传。',
    targetFormat: 'original',
    defaultSettings: { quality: 60, speed: 5, stripMetadata: true },
    benefits: [
      { icon: '🎞️', titleEn: 'Keep Animations', titleZh: '保留动画', descEn: 'Unlike converting to MP4, our compression keeps your GIF animations intact — just smaller.', descZh: '不像转MP4会丢失动图效果，我们的压缩完整保留GIF动画——只是变小了。' },
      { icon: '📉', titleEn: 'Up to 70% Smaller', titleZh: '最高减小70%', descEn: 'Smart color reduction and frame optimization can shrink GIFs by up to 70% with minimal visual difference.', descZh: '智能色彩缩减和帧优化最高可减小GIF 70%体积，视觉效果几乎没有差别。' },
      { icon: '🔒', titleEn: 'No Upload Needed', titleZh: '无需上传', descEn: 'GIFs stay on your device. All compression happens locally in your browser via Web Workers.', descZh: 'GIF文件留在你的设备上，所有压缩在浏览器本地通过Web Worker完成。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop Your GIF Files', titleZh: '拖入GIF文件', descEn: 'Drag animated GIFs into the upload area, click to browse, or Ctrl+V paste from clipboard.', descZh: '将GIF动图拖入上传区、点击选择、或Ctrl+V粘贴。' },
      { step: 2, titleEn: 'Adjust Compression', titleZh: '调节压缩强度', descEn: 'Use the quality slider to balance file size and visual quality. Lower quality = smaller file, higher quality = better visuals.', descZh: '用画质滑块平衡文件大小和视觉效果。低画质=更小体积，高画质=更好观感。' },
      { step: 3, titleEn: 'Download Compressed GIFs', titleZh: '下载压缩后的GIF', descEn: 'Download each GIF individually or batch ZIP all results. Compare before/after with the built-in slider.', descZh: '逐张下载或批量ZIP打包。用内置对比滑块查看压缩前后效果。' },
    ],
    faqs: [
      { qEn: 'Will compression break my GIF animation?', qZh: '压缩会破坏GIF动画吗？', aEn: 'No — CompressFast preserves GIF animations while reducing file size. Your GIFs will still move after compression.', aZh: '不会——极速压图在减小体积的同时保留GIF动画效果。压缩后你的GIF照样能动。' },
      { qEn: 'How much can GIF files be reduced?', qZh: 'GIF文件能减小多少？', aEn: 'Typically 30-70% reduction depending on the GIF. Simple GIFs with fewer colors compress better. You can preview the result before downloading.', aZh: '通常能减小30-70%，取决于GIF本身。颜色少的简单GIF压缩效果更好。下载前可以预览结果。' },
      { qEn: 'Is there a file size limit for GIFs?', qZh: 'GIF文件有大小限制吗？', aEn: 'Free users can compress GIFs up to 25MB each. Pro users get 50MB per file. No limits on the number of GIFs you can process (within batch limits).', aZh: '免费用户每张GIF最大25MB，Pro用户50MB。GIF数量无限制（在批量限制内）。' },
      { qEn: 'Why are my GIF files so large?', qZh: '为什么我的GIF文件这么大？', aEn: 'GIF is a 1987 format with no real compression — it stores every frame as a full bitmap with a 256-color palette. A 5-second GIF at 30fps has 150 frames, each potentially a full image. Modern alternatives like animated WebP or MP4 can be 80-90% smaller with better quality.', aZh: 'GIF是1987年的格式，没有真正的压缩——每帧都是完整的位图，只有256色调色板。一个5秒30fps的GIF有150帧，每帧都可能是一张完整图片。现代替代方案如动态WebP或MP4可比GIF小80-90%，画质还更好。' },
      { qEn: 'Should I compress GIF or convert to WebP/MP4?', qZh: '应该压缩GIF还是转成WebP/MP4？', aEn: 'For screen recordings and video clips: convert to MP4 — up to 90% smaller. For short reaction GIFs and memes: compress the GIF or convert to animated WebP — 60-80% smaller with wider compatibility than MP4. For logos and simple animations: animated WebP is ideal, often 70%+ smaller than GIF.', aZh: '录屏和视频片段：转MP4——可小90%。短反应动图和表情包：压缩GIF或转动态WebP——小60-80%，兼容性比MP4好。Logo和简单动画：动态WebP最佳，通常比GIF小70%+。' },
      { qEn: 'Can I compress multiple GIFs at once?', qZh: '能同时压缩多个GIF吗？', aEn: 'Yes — batch compress up to 20 GIFs at once for free (500 with Pro). All GIFs are processed in parallel Web Workers. Use ZIP download to get all compressed GIFs in one file.', aZh: '可以——免费版一次批量压缩最多20个GIF（Pro版500个）。所有GIF通过Web Worker并行处理。一键ZIP打包下载所有结果。' },
      { qEn: 'Does GIF compression reduce colors?', qZh: 'GIF压缩会减少颜色吗？', aEn: 'Yes — color reduction is the primary compression technique for GIFs. Most GIFs use far fewer than 256 colors. CompressFast analyzes each frame and optimizes the color palette per frame, often cutting colors from 256 to 64-128 with no visible difference. You control the quality slider to balance colors vs file size.', aZh: '会——色彩缩减是GIF最主要的压缩技术。大多数GIF实际使用的颜色远少于256种。极速压图分析每帧并逐帧优化调色板，通常将颜色从256减至64-128种，肉眼无差异。你可以通过画质滑块控制颜色和体积的平衡。' },
      { qEn: 'What\'s the difference between GIF and animated WebP?', qZh: 'GIF和动态WebP有什么区别？', aEn: 'Animated WebP supports 24-bit color (16.7 million colors vs GIF\'s 256), better transparency (alpha channel vs binary), and modern compression. At the same visual quality, animated WebP is 60-80% smaller. The trade-off: Safari only added animated WebP support in 2023, so very old devices may not render it.', aZh: '动态WebP支持24位色（1670万色 vs GIF的256色）、更好的透明度（alpha通道 vs 二值透明）和现代压缩算法。同等观感下动态WebP小60-80%。代价是：Safari 2023年才支持动态WebP，非常老的设备可能无法渲染。' },
    ],
    detailedGuideEn: `GIF (Graphics Interchange Format) turned 38 years old in 2025 — but it's still everywhere. From reaction memes to product demos, GIFs remain the internet's default animation format. The problem? They're huge. A single 10-second GIF can easily hit 15-20MB, slowing down pages and eating mobile data.

    CompressFast's GIF compressor tackles this with smart, lossy optimization that preserves the animation experience:

    1. Per-frame color optimization — GIFs are limited to 256 colors per frame. Our compressor analyzes each frame individually and builds the optimal palette, often reducing the palette to 64-128 colors with zero visible difference. Fewer colors = smaller file.

    2. Frame timing optimization — Many GIFs duplicate frames with different delay timings. We detect identical consecutive frames and merge them, adjusting the delay accordingly. This can cut frame count by 20-40% without changing how the animation looks.

    3. Transparency optimization — GIFs use binary transparency (a pixel is either fully transparent or fully opaque). We optimize transparent areas across frames, reducing redundant pixel data.

    4. Quality slider control — The quality slider gives you direct control over the color reduction aggressiveness. At 80%+, colors remain rich and the file is 20-40% smaller. At 50-70%, you get 50-70% size reduction with noticeably fewer colors — fine for simple animations, less ideal for photorealistic GIFs.

    Pro tip: If your "GIF" is actually a screen recording of a UI or video clip, consider converting it to MP4 or animated WebP instead. You'll get dramatically smaller files with better quality. Use GIF compression for actual GIFs — memes, reaction clips, and simple looping animations where GIF compatibility is essential.`,

    detailedGuideZh: `GIF（图形交换格式）到 2025 年已经 38 岁了——但它仍然无处不在。从表情包到产品演示，GIF 依然是互联网的默认动图格式。问题呢？它们太大了。一个 10 秒的 GIF 动辄 15-20MB，拖慢页面加载，烧掉手机流量。

    极速压图的 GIF 压缩工具通过智能的有损优化来解决这个问题，同时保留完整的动画体验：

    1. 逐帧色彩优化——GIF 每帧限制 256 色。我们的压缩器逐帧分析并构建最优调色板，通常将颜色减至 64-128 种而肉眼完全看不出差异。颜色越少=文件越小。

    2. 帧时序优化——很多 GIF 存在重复帧配上不同延迟时间的冗余。我们检测相同的连续帧并合并它们，同时调整延迟时间。这可以减少 20-40% 的帧数，动画观感完全不变。

    3. 透明度优化——GIF 使用二值透明度（像素要么完全透明要么完全不透明）。我们跨帧优化透明区域，减少冗余像素数据。

    4. 画质滑块控制——画质滑块让你直接控制色彩缩减的激进程度。80%+ 时色彩保持丰富，体积减小 20-40%。50-70% 时体积减小 50-70%，颜色明显减少——适合简单动图，不太适合照片级 GIF。

    小贴士：如果你的"GIF"其实是录屏或视频片段，建议转成 MP4 或动态 WebP。你会得到体积小得多、画质更好的文件。GIF 压缩留给真正的 GIF——表情包、反应动图和简单的循环动画，这些场景下 GIF 兼容性仍然不可或缺。`,
    relatedTools: ['compress-png', 'compress-jpeg', 'convert-to-webp'],
  },

  'resize-image': {
    slug: 'resize-image',
    titleEn: 'Resize Image Online Free — Change Image Dimensions | CompressFast',
    titleZh: '在线调整图片尺寸 — 免费修改图片大小 | 极速压图',
    descriptionEn: 'Resize images online for free. Change width and height in pixels or percentage. Batch resize up to 30 images at once. Common presets: 1080p, 720p, 50%, 75%. No upload, 100% private.',
    descriptionZh: '免费在线调整图片尺寸。按像素或百分比修改宽高。批量同时处理30张。常用预设：1080p、720p、50%、75%。无需上传，完全隐私。',
    keywords: ['resize image', 'resize image online', 'image resizer', 'change image size', 'resize jpg', 'resize png', 'bulk resize images', 'free image resizer'],
    heroTitleEn: 'Resize Images Online',
    heroTitleZh: '在线调整图片尺寸',
    heroSubEn: 'Change image dimensions in seconds. Pixels or percentage. Batch 30. Free & private.',
    heroSubZh: '秒改图片尺寸。像素或百分比任意选。批量30张。免费、隐私安全。',
    targetFormat: 'original',
    defaultSettings: { quality: 85, speed: 5, resizeWidth: 1080, resizeHeight: 1080, stripMetadata: true },
    benefits: [
      { icon: '📏', titleEn: 'Pixels or Percentage', titleZh: '像素/百分比双模式', descEn: 'Resize by exact pixel dimensions or by percentage. 50% to shrink, 200% to enlarge. Full control.', descZh: '精确像素尺寸或百分比缩放任选。50%缩小、200%放大，完全掌控。' },
      { icon: '🎯', titleEn: 'Common Presets', titleZh: '常用预设', descEn: 'One-click presets for 1080p (social media), 720p, 50%, and 75%. No math required.', descZh: '一键预设：1080p（社交媒体）、720p、50%、75%。不用自己算。' },
      { icon: '📦', titleEn: 'Batch Resize 30', titleZh: '批量30张', descEn: 'Resize up to 30 images at once with the same dimensions. ZIP download all results.', descZh: '同时调整最多30张图片为相同尺寸，一键ZIP下载。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload Your Images', titleZh: '上传你的图片', descEn: 'Drag images into the upload area. Supports PNG, JPEG, WebP, GIF, BMP, SVG and more.', descZh: '将图片拖入上传区。支持PNG、JPEG、WebP、GIF、BMP、SVG等格式。' },
      { step: 2, titleEn: 'Set New Dimensions', titleZh: '设置新尺寸', descEn: 'Enter width and height in pixels, choose a percentage preset, or pick from 1080p/720p quick options.', descZh: '输入像素宽高、选择百分比预设、或用1080p/720p快捷选项。' },
      { step: 3, titleEn: 'Download Resized Images', titleZh: '下载调整后的图片', descEn: 'Download each image individually or batch ZIP. Original quality preserved — just different dimensions.', descZh: '逐张下载或批量ZIP。画质不变——只改尺寸。' },
    ],
    faqs: [
      { qEn: 'Does resizing reduce image quality?', qZh: '调整尺寸会降低画质吗？', aEn: 'Minimally. Resizing down (making smaller) preserves quality well. Resizing up (enlarging) may show some softness — CompressFast uses browser-native high-quality scaling to minimize this.', aZh: '影响很小。缩小图片时画质保持良好。放大时可能会有轻微模糊——极速压图使用浏览器原生高质量缩放算法来最小化影响。' },
      { qEn: 'Can I resize images to exact social media sizes?', qZh: '能调到社交媒体需要的精确尺寸吗？', aEn: 'Yes — use the 1080p preset for Instagram/Facebook, 720p for Twitter/X, or enter custom dimensions for any platform.', aZh: '可以——用1080p预设适配Instagram/Facebook，720p适配Twitter/X，或者手动输入任意平台的尺寸要求。' },
      { qEn: 'Is my image data safe during resizing?', qZh: '调整尺寸过程中图片数据安全吗？', aEn: 'Completely. All processing happens in your browser. Your images never leave your device. You can resize offline.', aZh: '绝对安全。所有处理在浏览器中完成，图片不离开你的设备。断网也能正常使用。' },
      { qEn: 'Can I resize images by percentage instead of pixels?', qZh: '能按百分比而不是像素来调整尺寸吗？', aEn: 'Yes — CompressFast supports both modes. Use 50% to halve dimensions, 75% for a moderate shrink, or 200% to double. The percentage mode is great when you want to scale proportionally without calculating pixel values.', aZh: '可以——极速压图支持两种模式。50%缩小一半、75%适度缩小、200%放大一倍。百分比模式非常适合等比缩放，不用算像素值。' },
      { qEn: 'What is the maximum image size I can resize?', qZh: '最大能调整多大的图片？', aEn: 'Free users can resize images up to 10MB each (25MB for Pro). Resolution-wise, modern browsers handle images up to 100+ megapixels. CompressFast never upscales small images to avoid quality loss — if you request a larger size than the original, it keeps the original dimensions.', aZh: '免费用户每张最大10MB（Pro版25MB）。分辨率方面，现代浏览器支持高达1亿+像素的图片。极速压图不会放大小图以避免画质损失——如果你要求的尺寸比原图大，它会保持原始尺寸。' },
      { qEn: 'Can I batch resize multiple images to different sizes?', qZh: '能批量把多张图片调成不同尺寸吗？', aEn: 'Batch resize applies the same dimensions to all selected images. If you need different sizes per image, process them in separate batches — it only takes seconds per batch. For mixed-size needs, the preset buttons (1080p, 720p, etc.) make switching quick.', aZh: '批量调整对所有选中图片应用相同尺寸。如果需要每张不同尺寸，分批处理——每批只需几秒。需要混搭尺寸时，预设按钮（1080p、720p等）让切换很快。' },
      { qEn: 'What image formats can be resized?', qZh: '支持调整哪些图片格式的尺寸？', aEn: 'PNG, JPEG, WebP, GIF, BMP, SVG, HEIC, AVIF — all 8 input formats. The output format can be the same as the original or converted to a different format during resize. For example, resize a PNG and output as WebP in one step.', aZh: 'PNG、JPEG、WebP、GIF、BMP、SVG、HEIC、AVIF——全部8种输入格式。输出格式可以保持原样，也可以在调整尺寸的同时转换格式。比如把PNG缩小并输出为WebP，一步完成。' },
      { qEn: 'Does resizing also compress the image?', qZh: '调整尺寸的同时也会压缩图片吗？', aEn: 'Yes — resize and compression happen together. After resizing, the image is re-encoded at your chosen quality setting. This dual optimization often produces the biggest file size reductions: a 4000px JPEG at 4MB resized to 1200px can become 150KB — a 96% reduction from resize + compression combined.', aZh: '是的——尺寸调整和压缩同时进行。调整尺寸后，图片以你选择的画质重新编码。这种双重优化往往能带来最大的体积缩减：一张4000px、4MB的JPEG调到1200px后可能只有150KB——尺寸调整加压缩，体积总共减少96%。' },
      { qEn: 'Can I lock aspect ratio when resizing?', qZh: '调整尺寸时能锁定宽高比吗？', aEn: 'Yes — CompressFast maintains aspect ratio by default. When you change either width or height, the other dimension adjusts automatically. You can also unlock it for free-form dimensions if you intentionally want to stretch or squash an image.', aZh: '可以——极速压图默认保持宽高比。你改宽度或高度时，另一个维度自动调整。也可以解锁自由输入，如果你有意拉伸或压扁图片的话。' },
    ],
    detailedGuideEn: `Image resizing is one of the most impactful optimizations you can make — often more effective than compression alone. A 4000×3000 smartphone photo at 4MB, when resized to 1200×900 (perfect for a blog post), becomes just ~150KB after mild compression. That's a 96% reduction, and on a 1920px screen, the resized version looks just as sharp.

    CompressFast's resize tool gives you multiple ways to dial in the perfect dimensions:

    1. Pixel mode — Enter exact width and height. Great when you know your target: 1920×1080 for desktop wallpapers, 1080×1080 for Instagram, 1200×630 for Open Graph meta images, 800×600 for email embeds. The aspect ratio lock keeps proportions correct by default.

    2. Percentage mode — Think "I want this at half the size" instead of calculating pixels. 50% halves both dimensions (resulting in 1/4 the total pixels), 75% is a moderate shrink, 25% is aggressively small. Perfect for creating thumbnails or downsizing entire photo albums.

    3. Preset buttons — One-click shortcuts for the most common sizes: 1080p (social media standard), 720p (Twitter/X optimal), 50% (quick half-size), 75% (moderate shrink). No typing, no math.

    4. Combine with compression — The resize and compression sliders work together. Resize from 4000px to 1200px, then compress at 80% quality. The combination routinely achieves 90%+ file size reduction for web-bound images. This is the secret behind fast-loading portfolio sites and e-commerce product pages.

    5. Format conversion in the same step — Resizing a PNG but need WebP output for your website? Select WebP as the output format and the resize + conversion happen in one pass. No need for separate tools or steps.

    Why resize matters: most images on the web are displayed at 300-1200px wide, but uploaded at 3000-6000px (full camera resolution). The extra pixels consume bandwidth and slow page loads without improving what users see. Resizing before upload is the single highest-ROI optimization for web images.`,
    detailedGuideZh: `图片尺寸调整是最有效的优化手段之一——往往比单纯压缩效果更显著。一张4000×3000、4MB的手机照片，调到1200×900（适合博客配图），再轻度压缩后只有约150KB。体积减少96%，而在1920px屏幕上，调整后的版本看起来一样清晰。

    极速压图的尺寸调整工具提供多种方式精确设定理想尺寸：

    1. 像素模式——输入精确的宽高值。适合你知道目标尺寸：1920×1080桌面壁纸、1080×1080 Instagram方形、1200×630 Open Graph链接预览图、800×600邮件插图。宽高比锁定默认开启，保持比例正确。

    2. 百分比模式——不用算像素，直接想"我要一半大小"。50%宽高各减半（总像素变为1/4），75%适度缩小，25%激进缩小。非常适合创建缩略图或批量缩小整个相册。

    3. 快捷预设——一键常用尺寸：1080p（社交媒体标准）、720p（Twitter/X最佳）、50%（快速半尺寸）、75%（适度缩小）。不用打字，不用心算。

    4. 与压缩联动——尺寸和压缩滑块协同工作。从4000px调到1200px，再以80%画质压缩。组合拳通常能为网页图片实现90%+的体积缩减。这就是快速加载的作品集网站和电商产品页背后的秘密。

    5. 同一步骤完成格式转换——调整PNG尺寸但需要WebP用于网站？选WebP作为输出格式，尺寸调整和格式转换一次完成。不需要单独的工具或步骤。

    为什么尺寸调整如此重要：网页上大多数图片以300-1200px宽显示，但上传时却是3000-6000px（全相机分辨率）。多余像素消耗带宽、拖慢页面加载，却不改善用户看到的视觉效果。上传前调整尺寸是网页图片投资回报率最高的单项优化。`,
    relatedTools: ['compress-png', 'compress-jpeg', 'convert-jpg-to-png'],
  },

  'convert-jpg-to-png': {
    slug: 'convert-jpg-to-png',
    titleEn: 'Convert JPG to PNG Online Free — No Upload | CompressFast',
    titleZh: '在线JPG转PNG — 免费格式转换 | 极速压图',
    descriptionEn: 'Convert JPG to PNG online for free. No upload, 100% browser-based. Batch convert up to 30 images at once. Also works: PNG to JPG, WebP to PNG, and more format conversions.',
    descriptionZh: '免费在线JPG转PNG，无需上传，100%浏览器本地处理。批量同时转换30张。还支持PNG转JPG、WebP转PNG等更多格式转换。',
    keywords: ['convert jpg to png', 'jpg to png converter', 'convert jpg to png online', 'jpg to png free', 'jpeg to png converter', 'image format converter', 'change jpg to png'],
    heroTitleEn: 'Convert JPG to PNG Online',
    heroTitleZh: '在线JPG转PNG',
    heroSubEn: 'Convert JPG to PNG instantly. No upload, batch 30, free forever.',
    heroSubZh: 'JPG瞬间转PNG。无需上传、批量30张、永久免费。',
    targetFormat: 'png',
    defaultSettings: { quality: 90, outputFormat: 'png', speed: 5, stripMetadata: true },
    benefits: [
      { icon: '🔄', titleEn: 'One-Click Conversion', titleZh: '一键转换', descEn: 'Select PNG as output format and your JPGs are converted automatically. No extra steps, no software to install.', descZh: '选PNG为输出格式，JPG自动转换。无需额外步骤，不用装软件。' },
      { icon: '🎨', titleEn: 'Multiple Format Support', titleZh: '多格式互转', descEn: 'Not just JPG to PNG — also convert between JPEG, WebP, AVIF, and more. One tool, all conversions.', descZh: '不止JPG转PNG——还支持JPEG、WebP、AVIF等格式互转。一个工具搞定所有转换。' },
      { icon: '📦', titleEn: 'Batch Convert 30', titleZh: '批量转换30张', descEn: 'Convert up to 30 JPGs to PNG at once. All processed in parallel. ZIP download all results.', descZh: '同时转换最多30张JPG为PNG，并行处理。一键ZIP下载全部结果。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload JPG Files', titleZh: '上传JPG文件', descEn: 'Drag JPG images into the upload area or click to browse. Batch up to 30 files at once.', descZh: '将JPG图片拖入上传区或点击选择，一次最多30张。' },
      { step: 2, titleEn: 'Select PNG as Output', titleZh: '选择PNG输出', descEn: 'In the format selector, choose PNG. Your JPGs will be converted to PNG format during compression.', descZh: '在格式选择器中选PNG。压缩过程中JPG会自动转为PNG格式。' },
      { step: 3, titleEn: 'Download PNG Files', titleZh: '下载PNG文件', descEn: 'Each converted file downloads as .png. Use batch download for a ZIP of all converted images.', descZh: '每张转换后的文件以.png格式下载。批量下载可一次性获取所有转换结果的ZIP包。' },
    ],
    faqs: [
      { qEn: 'Is JPG to PNG conversion lossless?', qZh: 'JPG转PNG是无损的吗？', aEn: 'PNG is a lossless format, but JPG source files already have compression artifacts from their original encoding. Converting to PNG preserves the current quality without adding new artifacts — your PNG will look exactly like the JPG you uploaded.', aZh: 'PNG是无损格式，但JPG源文件本身已有压缩痕迹。转换为PNG保留当前画质、不会新增失真——PNG看起来和你上传的JPG一模一样。' },
      { qEn: 'Will the file size increase when converting JPG to PNG?', qZh: 'JPG转PNG文件会变大吗？', aEn: 'Usually yes — PNG is a lossless format so files tend to be larger than compressed JPGs. But you get better quality for editing, screenshots, and images with text or sharp edges.', aZh: '通常会——PNG是无损格式，文件往往比压缩过的JPG大。但你能获得更好的编辑质量，特别适合截图、带文字或锐利边缘的图片。' },
      { qEn: 'Can I convert other formats too?', qZh: '能转换其他格式吗？', aEn: 'Yes — CompressFast supports conversion between PNG, JPEG, WebP, AVIF (Pro), GIF, BMP, and SVG. Use the format selector in the controls panel to choose your output format.', aZh: '可以——极速压图支持PNG、JPEG、WebP、AVIF（Pro专属）、GIF、BMP、SVG之间的互相转换。在控制面板的格式选择器中选输出格式即可。' },
      { qEn: 'Why would I convert JPG to PNG instead of keeping JPG?', qZh: '为什么要把JPG转成PNG而不是保留JPG？', aEn: 'PNG is better when you need: (1) lossless editing — JPG degrades every time you save, PNG doesn\'t. (2) Transparency — JPG doesn\'t support it, PNG does. (3) Sharp text/graphics — JPG creates fuzzy artifacts around edges, PNG keeps them crisp. (4) Screenshots — text in JPG gets blurry, PNG stays razor-sharp.', aZh: '以下场景PNG更好：(1) 需要反复编辑——JPG每次保存都会劣化，PNG不会。(2) 透明背景——JPG不支持，PNG支持。(3) 文字/图形——JPG在边缘产生模糊伪影，PNG保持锐利。(4) 截图——JPG里的文字会模糊，PNG保持清晰。' },
      { qEn: 'Can I batch convert multiple JPGs to PNG?', qZh: '能批量把多个JPG转成PNG吗？', aEn: 'Yes — convert up to 30 JPGs to PNG at once for free (500 with Pro). All files are processed in parallel. Use "Download All" to get a ZIP file of all converted PNGs.', aZh: '可以——免费版一次转最多30张JPG为PNG（Pro版500张），全部并行处理。点击"下载全部"获取所有PNG的ZIP包。' },
      { qEn: 'Does JPG to PNG conversion work offline?', qZh: 'JPG转PNG可以离线使用吗？', aEn: 'Yes — like all CompressFast features, format conversion runs entirely in your browser. Load the page once (or install as PWA) and you can convert JPG to PNG without internet access.', aZh: '可以——和极速压图所有功能一样，格式转换完全在浏览器中运行。加载一次页面（或安装为PWA）后，断网也能转换JPG为PNG。' },
      { qEn: 'Can I compress the PNG during conversion?', qZh: '转换过程中能同时压缩PNG吗？', aEn: 'Yes — the quality slider works during conversion too. Set quality to 80-90% for a good balance between file size and visual quality. For lossless PNG output, enable lossless mode (uses oxipng WASM) — you\'ll get a smaller PNG than a straight conversion.', aZh: '可以——转换过程中画质滑块同样生效。设80-90%画质可获得体积和观感的良好平衡。如需无损PNG输出，开启无损模式（使用oxipng WASM）——你会得到比直接转换更小的PNG文件。' },
      { qEn: 'What\'s the difference between converting JPG→PNG vs JPG→WebP?', qZh: 'JPG转PNG和JPG转WebP有什么区别？', aEn: 'JPG→PNG: lossless output, larger file, universal compatibility, supports transparency. Best for editing, archiving, or when you need guaranteed compatibility everywhere. JPG→WebP: smaller file (25-35% less than PNG), still supports transparency, 96% browser support. Best for web use, faster page loads, better SEO. Choose based on your end goal.', aZh: 'JPG→PNG：无损输出、文件较大、通用兼容性、支持透明。适合编辑、存档或需要确保任何地方都能打开的场合。JPG→WebP：文件更小（比PNG小25-35%）、同样支持透明、96%浏览器支持。适合网页使用、更快的页面加载、更好的SEO。根据最终用途选择。' },
    ],
    detailedGuideEn: `Converting JPG to PNG is one of the most common format conversions — and for good reason. JPG is great for photos on the web, but PNG is essential when you need lossless quality, transparency, or sharp text and graphics.

    CompressFast's JPG to PNG converter handles this in your browser with zero uploads:

    1. Direct conversion — Upload your JPG, select PNG as the output format, and download. The conversion preserves every visible detail from the original. Any compression artifacts present in the JPG source remain as-is (converting to PNG won't magically remove them), but no new artifacts are added.

    2. Quality control during conversion — The quality slider affects how the PNG is encoded. At 90-100%, you get a visually lossless PNG that's pixel-for-pixel identical to the source JPG. At lower settings, the PNG encoder applies its own optimizations (color quantization, PNG filter selection) to produce a smaller file — still PNG, but more aggressively optimized.

    3. Lossless mode for ultimate PNG compression — Enable lossless mode and the oxipng WASM engine kicks in. It trial-runs multiple PNG compression strategies (different zlib levels, Zopfli, filter combinations) and picks the smallest result. The output is mathematically identical to a straight conversion — every pixel matches — but the file is 20-60% smaller than a naive PNG save.

    4. Batch workflow — Drop 30 JPGs, select PNG output, click compress. All files convert in parallel. ZIP download bundles everything. The before/after slider lets you verify each conversion.

    When should you convert JPG to PNG? For logos and icons that need transparency. For screenshots with text (JPG makes text fuzzy). For images you plan to edit further (PNG doesn't accumulate generation loss). For archival copies where you want zero additional compression artifacts. For everything else — especially web use — consider converting to WebP instead for smaller files.`,
    detailedGuideZh: `JPG 转 PNG 是最常见的格式转换之一——这是有充分理由的。JPG 适合网页照片，但当你需要无损画质、透明背景或锐利的文字与图形时，PNG 不可或缺。

    极速压图的 JPG 转 PNG 转换器在浏览器中完成，零上传：

    1. 直接转换——上传 JPG，选择 PNG 作为输出格式，下载。转换保留原始图片的所有可见细节。JPG 源文件中已有的压缩痕迹保持不变（转 PNG 不会神奇地消除它们），但不会新增任何失真。

    2. 转换过程中的画质控制——画质滑块影响 PNG 的编码方式。90-100% 可获得视觉无损的 PNG，与源 JPG 逐像素一致。较低设置下，PNG 编码器应用自身优化（色彩量化、PNG 滤镜选择）来产生更小的文件——仍然是 PNG，但优化更激进。

    3. 无损模式实现终极 PNG 压缩——开启无损模式，oxipng WASM 引擎启动。它尝试多种 PNG 压缩策略（不同 zlib 级别、Zopfli 算法、滤镜组合），选择体积最小的结果。输出与直接转换数学上完全一致——每个像素都相同——但文件比朴素的 PNG 保存小 20-60%。

    4. 批量工作流——拖入 30 张 JPG，选 PNG 输出，点压缩。所有文件并行转换。ZIP 打包一键下载全部。前后对比滑块让你验证每张转换效果。

    什么时候应该把 JPG 转 PNG？需要透明背景的 Logo 和图标。带文字的截图（JPG 会让文字模糊）。计划继续编辑的图片（PNG 不会累积世代损失）。想要零额外压缩痕迹的存档副本。其他场景——特别是网页使用——建议考虑转 WebP 以获得更小的文件体积。`,
    relatedTools: ['compress-jpeg', 'compress-png', 'webp-to-png'],
  },

  'webp-to-png': {
    slug: 'webp-to-png',
    titleEn: 'Convert WebP to PNG Online Free — No Upload | CompressFast',
    titleZh: '在线WebP转PNG — 免费格式转换 | 极速压图',
    descriptionEn: 'Convert WebP to PNG online for free. No upload, 100% browser-based. Batch convert up to 30 WebP images at once. Also supports WebP to JPG and other format conversions.',
    descriptionZh: '免费在线WebP转PNG，无需上传，100%浏览器本地处理。批量同时转换30张WebP图片。还支持WebP转JPG等更多格式转换。',
    keywords: ['webp to png', 'convert webp to png', 'webp to png converter', 'webp to png online', 'free webp to png converter', 'change webp to png', 'save webp as png', 'webp to jpg'],
    heroTitleEn: 'Convert WebP to PNG Online',
    heroTitleZh: '在线WebP转PNG',
    heroSubEn: 'Convert WebP to PNG instantly. No upload, batch 30, free forever — works offline too.',
    heroSubZh: 'WebP瞬间转PNG。无需上传、批量30张、永久免费——断网也能用。',
    targetFormat: 'png',
    defaultSettings: { quality: 90, outputFormat: 'png', speed: 5, stripMetadata: true },
    benefits: [
      { icon: '🔓', titleEn: 'Universal Compatibility', titleZh: '通用兼容性', descEn: 'PNG works everywhere — in Photoshop, Word, PowerPoint, and all image viewers. WebP often doesn\'t open in desktop apps.', descZh: 'PNG到处都能用——Photoshop、Word、PPT、所有看图软件。WebP在桌面软件里经常打不开。' },
      { icon: '🎨', titleEn: 'Lossless Quality', titleZh: '无损画质', descEn: 'PNG is a lossless format. Converting WebP to PNG at 90%+ quality preserves all the detail — no new compression artifacts.', descZh: 'PNG是无损格式。90%+画质转换保留所有细节——不会产生新的压缩痕迹。' },
      { icon: '📦', titleEn: 'Batch Convert 30', titleZh: '批量转换30张', descEn: 'Convert up to 30 WebP images to PNG at once. All processed in parallel. ZIP download all results in one click.', descZh: '同时转换最多30张WebP为PNG，并行处理。一键ZIP下载全部结果。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload WebP Files', titleZh: '上传WebP文件', descEn: 'Drag WebP images into the upload area or click to browse. Batch up to 30 files. You can also paste from clipboard with Ctrl+V.', descZh: '将WebP图片拖入上传区或点击选择，一次最多30张。还支持Ctrl+V粘贴。' },
      { step: 2, titleEn: 'Select PNG as Output', titleZh: '选择PNG输出', descEn: 'Choose PNG from the output format selector. Adjust quality slider — 90% or higher is recommended for best results.', descZh: '在输出格式中选PNG。调节画质滑块——推荐90%以上以获得最佳效果。' },
      { step: 3, titleEn: 'Download PNG Files', titleZh: '下载PNG文件', descEn: 'Each converted file downloads as .png. Use batch ZIP download for all results. Compare before/after with the built-in slider.', descZh: '每张转换后以.png格式下载。批量ZIP一键下载全部，用内置对比滑块查看效果。' },
    ],
    faqs: [
      { qEn: 'Why would I convert WebP to PNG?', qZh: '为什么要把WebP转成PNG？', aEn: 'WebP is great for websites but many desktop applications, image editors, and older software don\'t support it. Converting to PNG ensures your image works everywhere — in documents, presentations, social media, and photo editors.', aZh: 'WebP在网页上很好用，但很多桌面软件、图片编辑器和老旧程序不支持它。转成PNG后你的图片在任何地方都能用——文档、PPT、社交媒体、照片编辑器都可以。' },
      { qEn: 'Does converting WebP to PNG reduce quality?', qZh: 'WebP转PNG会降画质吗？', aEn: 'No — PNG is a lossless format, so converting at 90%+ quality preserves all visible detail. The PNG will look exactly like the original WebP. Note that the file size will likely be larger because PNG doesn\'t use lossy compression.', aZh: '不会——PNG是无损格式，90%+画质转换保留所有可见细节。PNG看起来和原始WebP一模一样。注意文件体积可能会变大，因为PNG不使用有损压缩。' },
      { qEn: 'Can I convert WebP to JPG instead?', qZh: '能把WebP转成JPG吗？', aEn: 'Yes — CompressFast supports all format conversions. Just select JPEG as the output format instead of PNG. JPG files will be smaller than PNG but without transparency support.', aZh: '可以——极速压图支持所有格式互转。在输出格式中选JPEG即可。JPG文件比PNG小，但不支持透明背景。' },
      { qEn: 'Is WebP to PNG conversion free?', qZh: 'WebP转PNG免费吗？', aEn: 'Yes — completely free, no limits. Convert WebP to PNG as many times as you want, up to 30 images per batch. No account needed, no watermarks, no hidden fees. Pro ($24.99 lifetime) increases batch to 500.', aZh: '是的——完全免费，无限制。WebP转PNG想转多少次就转多少次，每批最多30张。无需注册、无水印、无隐藏费用。Pro版（$24.99买断）可批量500张。' },
      { qEn: 'Can I batch convert WebP to PNG?', qZh: '能批量把WebP转PNG吗？', aEn: 'Yes — convert up to 30 WebP files to PNG at once for free. All conversions run in parallel via Web Workers. Use "Download All" for a single ZIP file of all converted PNGs.', aZh: '可以——免费版一次最多转30张WebP为PNG。所有转换通过Web Worker并行运行。点击"下载全部"获取包含所有PNG的单个ZIP文件。' },
      { qEn: 'Does WebP to PNG conversion preserve transparency?', qZh: 'WebP转PNG会保留透明背景吗？', aEn: 'Yes — both WebP and PNG support alpha channel transparency. When converting a WebP with transparency to PNG, the transparent areas are perfectly preserved. This is a key advantage over converting to JPG, which doesn\'t support transparency.', aZh: '会——WebP和PNG都支持alpha通道透明。将带透明背景的WebP转PNG时，透明区域完美保留。这是相比转JPG（不支持透明）的关键优势。' },
      { qEn: 'Why are my converted PNG files larger than the original WebP?', qZh: '为什么转换后的PNG比原始WebP大？', aEn: 'WebP uses modern lossy compression (similar to JPEG but better), while PNG uses lossless compression. A WebP that\'s 500KB may become 2-3MB as PNG — this is normal. The trade-off: larger file, but universal compatibility and zero compression artifacts. If you need smaller files for web use, keep it as WebP.', aZh: 'WebP使用现代有损压缩（类似JPEG但更好），而PNG使用无损压缩。一张500KB的WebP转PNG后可能变成2-3MB——这是正常的。代价是文件更大，换来的是通用兼容性和零压缩痕迹。如果需要用于网页的小文件，保持WebP就好。' },
      { qEn: 'Can I edit a WebP file directly without converting to PNG?', qZh: '不转PNG能直接编辑WebP文件吗？', aEn: 'Many image editors now support WebP natively: Photoshop (2022+), GIMP, Paint.NET, and macOS Preview. But if your software doesn\'t open WebP, converting to PNG is the fastest workaround — and with CompressFast you can do it instantly without installing anything.', aZh: '很多图片编辑器现在已经原生支持WebP：Photoshop（2022+）、GIMP、Paint.NET、macOS预览。但如果你的软件打不开WebP，转PNG是最快的变通方案——用极速压图瞬间完成，无需安装任何东西。' },
    ],
    detailedGuideEn: `WebP is the web's modern image format — smaller than JPEG, supports transparency like PNG, and now works in 96%+ of browsers. But the offline world hasn't fully caught up. If you've ever tried to open a WebP in an older version of Photoshop, insert one into a Word document, or upload one to a platform that doesn't accept WebP, you know the frustration.

    CompressFast's WebP to PNG converter solves this: instant, browser-based conversion with no upload required.

    1. Direct, lossless-quality conversion — Upload any WebP image (including animated WebP and transparent WebP) and get a PNG that looks identical. The conversion preserves transparency, color depth, and all visible detail. For lossless WebP sources, the output PNG is essentially a format container swap.

    2. Quality-adjustable output — The quality slider (10-100%) controls PNG encoding. At 90-100%, you get visual transparency — no perceptible quality difference from the source. For maximum compatibility with desktop apps, stick with 90%+. If file size matters more, use 70-85% and let the PNG encoder optimize.

    3. Lossless mode for archival — Enable lossless mode and the oxipng WASM engine finds the smallest possible mathematically-lossless PNG. Ideal for archiving WebP images that you need to preserve perfectly. Expect 20-40% smaller files than a straight PNG save.

    4. Batch conversion workflow — Got 30 WebP images from a website export or design handoff? Drop them all at once, select PNG output, and download as a ZIP. Everything runs locally — no upload queue, no server processing delays.

    Common use cases: (a) Designers receiving WebP assets that need to go into Photoshop. (b) Content creators inserting images into Word/PowerPoint documents. (c) Anyone needing to upload an image to a platform that only accepts PNG/JPEG. (d) Archiving WebP images in a universally compatible lossless format.`,
    detailedGuideZh: `WebP 是网页的现代图像格式——比 JPEG 更小、像 PNG 一样支持透明、96%+ 的浏览器已支持。但离线世界还没有完全跟上。如果你曾尝试在旧版 Photoshop 中打开 WebP、将 WebP 插入 Word 文档、或上传到不接受 WebP 的平台，你就知道这种挫败感。

    极速压图的 WebP 转 PNG 转换器解决了这个问题：即时、浏览器内转换、无需上传。

    1. 直接、无损质量转换——上传任何 WebP 图片（包括动态 WebP 和透明 WebP），获得外观完全相同的 PNG。转换保留透明度、色彩深度和所有可见细节。对于无损 WebP 源文件，输出的 PNG 本质上只是格式容器的切换。

    2. 可调画质的输出——画质滑块（10-100%）控制 PNG 编码。90-100% 时获得视觉透明——与源文件无感知质量差异。为最大化桌面软件兼容性，保持在 90%+。如果文件大小更重要，使用 70-85% 让 PNG 编码器进行优化。

    3. 无损模式用于存档——开启无损模式，oxipng WASM 引擎找到最小的数学上无损的 PNG。非常适合需要完美保存的 WebP 图片归档。通常比直接 PNG 保存小 20-40%。

    4. 批量转换工作流——有 30 张来自网站导出或设计交接的 WebP 图片？一次性全部拖入，选 PNG 输出，以 ZIP 下载。一切本地运行——没有上传队列、没有服务器处理延迟。

    常见场景：(a) 设计师收到需要放入 Photoshop 的 WebP 素材。(b) 内容创作者将图片插入 Word/PPT 文档。(c) 需要上传图片到只接受 PNG/JPEG 的平台。(d) 以通用兼容的无损格式归档 WebP 图片。`,
    relatedTools: ['convert-to-webp', 'convert-jpg-to-png', 'compress-png'],
  },

  'remove-metadata': {
    slug: 'remove-metadata',
    titleEn: 'Remove Metadata from Photos Online Free — EXIF, GPS, Location | CompressFast',
    titleZh: '在线清除照片元数据 — EXIF/GPS/位置信息 | 极速压图',
    descriptionEn: 'Remove EXIF, GPS location, camera info, and all metadata from your photos online for free. 100% browser-based — your photos never leave your device. Batch strip metadata from 30 photos at once.',
    descriptionZh: '免费在线清除照片中的EXIF、GPS定位、相机信息等所有元数据。100%浏览器本地处理——照片不会离开你的设备。支持批量30张同时处理。',
    keywords: ['remove metadata from photo', 'exif remover', 'remove exif data', 'strip metadata', 'remove gps from photo', 'exif cleaner', 'photo metadata remover', 'remove location data', 'clean photo info', 'privacy photo tool'],
    heroTitleEn: 'Remove Metadata from Photos',
    heroTitleZh: '清除照片元数据',
    heroSubEn: 'Strip EXIF, GPS location, camera info & all hidden data. 100% private — your photos never leave your device.',
    heroSubZh: '清除EXIF、GPS定位、相机信息等所有隐藏数据。100%隐私——照片不离开你的设备。',
    targetFormat: 'original',
    defaultSettings: { quality: 100, outputFormat: 'original', speed: 10, stripMetadata: true },
    benefits: [
      { icon: '📍', titleEn: 'Remove GPS Location', titleZh: '清除GPS定位', descEn: 'Every smartphone photo embeds GPS coordinates. Strip location data before sharing to protect your home address and travel patterns.', descZh: '每张手机照片都嵌入了GPS坐标。分享前清除定位数据，保护你的家庭地址和行踪轨迹。' },
      { icon: '📸', titleEn: 'Strip EXIF Camera Info', titleZh: '清除相机信息', descEn: 'Remove camera model, lens type, ISO, aperture, and timestamp. Your photo looks the same — without the hidden data trail.', descZh: '清除相机型号、镜头类型、ISO、光圈、时间戳。照片看起来一样——只是去掉了隐藏的数据痕迹。' },
      { icon: '🔒', titleEn: '100% Private & Local', titleZh: '100%隐私本地处理', descEn: 'Unlike online metadata removers that upload your photos to a server, everything happens in your browser. Works offline too.', descZh: '不同于那些把照片上传到服务器的元数据清除工具，一切都在你的浏览器里完成。断网也能用。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload Your Photos', titleZh: '上传照片', descEn: 'Drag and drop your photos — up to 30 at once. Supports JPEG, PNG, WebP, HEIC, and all common formats. Pasted from clipboard also works.', descZh: '拖入你的照片——一次最多30张。支持JPEG、PNG、WebP、HEIC及所有常见格式。Ctrl+V粘贴也行。' },
      { step: 2, titleEn: 'Auto-Strip Metadata', titleZh: '自动清除元数据', descEn: 'CompressFast automatically removes all EXIF, GPS, camera, and timestamp data. "Strip Photo Info" is enabled by default — just click compress.', descZh: '极速压图自动清除所有EXIF、GPS、相机和时间戳数据。"清除照片信息"默认开启——点压缩即可。' },
      { step: 3, titleEn: 'Download Clean Photos', titleZh: '下载干净的照片', descEn: 'Your photos look exactly the same — just without hidden metadata. Download individually or batch ZIP. Original quality preserved.', descZh: '照片看起来和原来一模一样——只是没了隐藏的元数据。逐张下载或批量ZIP，原始画质保留。' },
    ],
    faqs: [
      { qEn: 'What metadata is removed from my photos?', qZh: '会清除哪些元数据？', aEn: 'Everything: GPS coordinates (latitude/longitude/altitude), camera model and manufacturer, lens type, exposure settings (ISO, aperture, shutter speed), date/time taken, software used, author/copyright fields, and all other EXIF/IPTC/XMP metadata. Your photo pixels stay exactly the same.', aZh: '所有：GPS坐标（经纬度/海拔）、相机型号和制造商、镜头类型、曝光参数（ISO/光圈/快门）、拍摄时间、使用软件、作者/版权字段、所有其他EXIF/IPTC/XMP元数据。照片像素完全不变。' },
      { qEn: 'Will removing metadata reduce photo quality?', qZh: '清除元数据会影响画质吗？', aEn: 'No — metadata stripping only removes invisible text data attached to your photo file. The actual image pixels and quality are completely untouched. Your photo will look pixel-perfect identical while the file may even become slightly smaller.', aZh: '不会——元数据清除只删除附加在照片文件中的不可见文本数据。实际图像像素和画质完全不受影响。照片像素级别完全一致，文件甚至可能稍微变小。' },
      { qEn: 'Why should I remove metadata before sharing photos online?', qZh: '为什么分享照片前要清除元数据？', aEn: 'Social media, forums, and messaging apps may preserve and expose your photo metadata. GPS coordinates can reveal your home, workplace, or current location. Camera serial numbers can be used for tracking. Stripping metadata before sharing protects your privacy and safety.', aZh: '社交媒体、论坛和聊天应用可能会保留和暴露你的照片元数据。GPS坐标可能泄露你的家庭地址、工作地点或当前位置。相机序列号可能被用于追踪。分享前清除元数据保护你的隐私和安全。' },
      { qEn: 'Do social media platforms remove metadata automatically?', qZh: '社交媒体平台会自动清除元数据吗？', aEn: 'Most major platforms (Facebook, Instagram, Twitter/X) claim to strip EXIF on upload, but this varies by platform and changes over time. Messaging apps like WhatsApp and Telegram often preserve metadata. The safest approach: strip it yourself before uploading anywhere. CompressFast makes this a one-click step.', aZh: '大多数主流平台（Facebook、Instagram、Twitter/X）声称上传时清除EXIF，但这因平台而异且随时变化。WhatsApp和Telegram等聊天应用通常保留元数据。最安全的做法：上传到任何地方之前先自己清除。极速压图让这变成一键搞定。' },
      { qEn: 'Can I batch remove metadata from multiple photos?', qZh: '能批量清除多张照片的元数据吗？', aEn: 'Yes — batch up to 30 photos at once for free (500 with Pro). "Strip Photo Info" is on by default. All photos are processed in parallel and downloadable as a ZIP. Perfect for cleaning an entire photo album before sharing.', aZh: '可以——免费版一次最多30张（Pro版500张）。"清除照片信息"默认开启。所有照片并行处理，可ZIP打包下载。非常适合在分享前清理整个相册。' },
      { qEn: 'Can I see what metadata my photo contains before removing it?', qZh: '能在清除前查看照片包含哪些元数据吗？', aEn: 'Most operating systems let you view basic EXIF: right-click → Properties → Details (Windows), or Get Info (Mac). For full metadata inspection, free tools like ExifTool or online EXIF viewers work. CompressFast strips everything automatically — no preview, but also no risk of missing hidden fields.', aZh: '多数操作系统支持查看基本EXIF：右键→属性→详细信息（Windows），或显示简介（Mac）。完整元数据检查可用ExifTool等免费工具或在线EXIF查看器。极速压图自动清除所有——不提供预览，但也确保了不会遗漏任何隐藏字段。' },
      { qEn: 'Does metadata removal work on HEIC/HEIF photos from iPhones?', qZh: '能清除iPhone拍的照片（HEIC格式）的元数据吗？', aEn: 'Yes — CompressFast supports HEIC input. The metadata is stripped during processing, and you can output as JPEG or PNG (both metadata-free) or keep as original format. iPhone photos contain extensive metadata including precise GPS, so stripping is especially important for privacy.', aZh: '可以——极速压图支持HEIC输入。处理过程中元数据被清除，输出可选择JPEG或PNG（均无元数据）或保持原格式。iPhone照片包含大量元数据包括精确GPS，清除对隐私保护尤为重要。' },
      { qEn: 'Is metadata removal reversible?', qZh: '元数据清除可以恢复吗？', aEn: 'No — once metadata is stripped, it cannot be recovered from the output file. If you need the metadata later, keep a copy of the original file. Think of it like shredding a document: permanent and irreversible by design.', aZh: '不能——元数据一旦被清除，无法从输出文件中恢复。如果以后还需要元数据，保留原始文件的副本。就像碎纸机一样：设计上就是永久且不可逆的。' },
    ],
    detailedGuideEn: `Every photo you take with a smartphone or digital camera embeds invisible metadata — a digital fingerprint that tells the story of when, where, and how the photo was captured. This metadata, known as EXIF (Exchangeable Image File Format), includes GPS coordinates precise to within a few meters, the exact camera model and serial number, lens type, exposure settings, and a timestamp down to the second.

    CompressFast's metadata removal tool strips all of this hidden data cleanly and completely:

    1. What gets removed — GPS latitude/longitude/altitude (potentially revealing your home, workplace, or travel patterns), camera make/model/serial number (uniquely identifying your device), exposure details (ISO, aperture, shutter speed, focal length), date/time original, software/editing history, copyright and author fields, thumbnail embedded previews, and all IPTC/XMP metadata. Everything. Gone.

    2. How it works — The stripping happens at the binary level. Your image is decoded, metadata blocks are discarded, and the pixel data is re-encoded without any metadata headers. For JPEG, this means re-encoding at your chosen quality. For PNG, the output is metadata-free by default. The visual pixels are never touched.

    3. Batch workflow — Drop up to 30 photos at once. "Strip Photo Info" is enabled by default (toggle in settings panel). Click compress. Every output file is metadata-free. ZIP download bundles all clean photos.

    4. When to use it — Before posting photos on social media, forums, or any public platform. Before sending photos to clients, contractors, or strangers. Before uploading photos to cloud storage. Before sharing photos in messaging apps. Basically: always remove metadata unless you specifically need to preserve it.

    5. What about file size — Metadata removal typically reduces file size by 1-50KB per photo, depending on how much metadata was embedded. It is not a replacement for compression, but a privacy feature. Combine with JPEG compression at 85% quality for both privacy and size reduction in one step.`,
    detailedGuideZh: `你用手机或数码相机拍的每一张照片都嵌入了不可见的元数据——一种数字指纹，记录着照片拍摄的时间、地点和方式。这种被称为EXIF（可交换图像文件格式）的元数据包含精确到几米以内的GPS坐标、相机型号和序列号、镜头类型、曝光参数以及精确到秒的时间戳。

    极速压图的元数据清除工具干净彻底地剥离所有这些隐藏数据：

    1. 清除内容——GPS经纬度/海拔（可能暴露你的家庭地址、工作地点或行踪轨迹）、相机制造商/型号/序列号（唯一标识你的设备）、曝光详情（ISO、光圈、快门速度、焦距）、原始拍摄时间、软件/编辑历史、版权和作者字段、嵌入的缩略图预览以及所有IPTC/XMP元数据。全部。清空。

    2. 工作原理——清除发生在二进制层面。图片被解码，元数据块被丢弃，像素数据在没有元数据头的情况下重新编码。对JPEG来说，这意味着以你选择的画质重新编码。对PNG来说，输出默认就是无元数据的。视觉像素从未被触碰。

    3. 批量工作流——一次拖入最多30张照片。"清除照片信息"默认开启（可在设置面板切换）。点击压缩。每张输出文件都是无元数据的。ZIP下载打包所有干净的照片。

    4. 使用场景——在社交媒体、论坛或任何公开平台发布照片之前。在向客户、承包商或陌生人发送照片之前。在上传照片到云存储之前。在聊天应用中分享照片之前。简而言之：总是清除元数据，除非你特意需要保留。

    5. 文件大小——元数据清除通常每张照片减少1-50KB，取决于嵌入的元数据量。它不是压缩的替代品，而是隐私功能。结合JPEG压缩85%画质，一步完成隐私保护和体积缩减。`,
    relatedTools: ['compress-jpeg', 'resize-image', 'compress-images'],
  },

  'tinypng-alternative': {
    slug: 'tinypng-alternative',
    titleEn: 'Best TinyPNG Alternative — Free & Private Image Compressor | CompressFast',
    titleZh: 'TinyPNG替代品 — 免费隐私图片压缩工具 | 极速压图',
    descriptionEn: 'Looking for a TinyPNG alternative? CompressFast is free, private (no upload), supports 8 formats, batch 30 images, and offers Pro $24.99 lifetime. No file size limits like TinyPNG.',
    descriptionZh: '寻找TinyPNG替代品？极速压图免费、隐私安全（不上传）、支持8种格式、批量30张、Pro$24.99买断。没有TinyPNG的文件大小限制。',
    keywords: ['tinypng alternative', 'tinypng alternative free', 'tinypng vs compressfast', 'alternative to tinypng', 'compress images without tinypng', 'free tinypng alternative', 'tinypng competitor'],
    heroTitleEn: 'Best TinyPNG Alternative',
    heroTitleZh: 'TinyPNG 最佳替代品',
    heroSubEn: 'More formats, larger files, better privacy, and completely free — no 5MB limit like TinyPNG.',
    heroSubZh: '更多格式、更大文件、更好隐私、完全免费——没有TinyPNG的5MB限制。',
    targetFormat: 'original',
    defaultSettings: { quality: 70, speed: 5, stripMetadata: true },
    benefits: [
      { icon: '📁', titleEn: 'No 5MB File Limit', titleZh: '无5MB限制', descEn: 'TinyPNG limits free users to 5MB per file. CompressFast supports up to 25MB for free (50MB Pro). No artificial restrictions.', descZh: 'TinyPNG免费用户限5MB/张。极速压图免费支持25MB/张（Pro 50MB），无人工限制。' },
      { icon: '🔒', titleEn: 'Files Never Uploaded', titleZh: '文件不上传', descEn: 'TinyPNG uploads your images to their cloud servers. CompressFast processes everything locally — your images never leave your device.', descZh: 'TinyPNG把图片上传到云端服务器。极速压图全部本地处理——图片不离开你的设备。' },
      { icon: '💰', titleEn: 'Free vs $25/Year', titleZh: '免费 vs $25/年', descEn: 'CompressFast free tier beats TinyPNG Pro on file size limits and batch count. Pro $24.99 lifetime vs TinyPNG $25/year subscription.', descZh: '极速压图免费版在文件大小和批量数量上已超过TinyPNG付费版。Pro $24.99买断 vs TinyPNG $25/年订阅。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop Images (No 5MB Cap)', titleZh: '拖入图片（无5MB限制）', descEn: 'Unlike TinyPNG, you can compress files up to 25MB each for free. Drop up to 30 images at once.', descZh: '不同于TinyPNG，每张最高25MB免费压缩。一次拖入最多30张图片。' },
      { step: 2, titleEn: 'Compress with Confidence', titleZh: '安心压缩', descEn: 'Your files stay on your device — no cloud upload. Adjust quality or use presets. All processing is local.', descZh: '文件留在你的设备上——不上传云端。调节画质或使用预设，全本地处理。' },
      { step: 3, titleEn: 'Download & Compare', titleZh: '下载并对比', descEn: 'Compare before/after with the built-in slider. Download individual files or batch ZIP. Quality rating for each result.', descZh: '用内置对比滑块查看压缩前后效果。逐张下载或批量ZIP。每张结果都有画质评级。' },
    ],
    faqs: [
      { qEn: 'Is CompressFast really better than TinyPNG?', qZh: '极速压图真的比TinyPNG好吗？', aEn: 'In key areas: yes. Larger file limits (25MB vs 5MB), true privacy (no upload vs cloud processing), more input formats (8 vs 3), and lifetime pricing ($24.99 vs $25/year). TinyPNG has slightly better default compression quality.', aZh: '关键维度上：是的。文件限制更大（25MB vs 5MB）、真正隐私（不上传 vs 云处理）、格式更多（8种 vs 3种）、定价更优（买断$24.99 vs 年付$25）。TinyPNG在默认压缩品质上略优。' },
      { qEn: 'Why is TinyPNG still so popular?', qZh: '为什么TinyPNG还那么火？', aEn: 'TinyPNG has been around since 2014 and built strong brand recognition. But for privacy-conscious users and those with large files or batch needs, CompressFast is a better choice.', aZh: 'TinyPNG 2014年就上线了，品牌认知度很高。但对重视隐私的用户、需要处理大文件或批量的用户来说，极速压图是更好的选择。' },
      { qEn: 'Can I use CompressFast just like TinyPNG?', qZh: '能像用TinyPNG一样用极速压图吗？', aEn: 'Yes — and more. Same drag-and-drop experience, but with batch ZIP download, format conversion, watermark, resize, and EXIF stripping. Everything TinyPNG does plus features they charge extra for.', aZh: '当然——甚至更好。同样的拖拽体验，外加批量ZIP下载、格式转换、水印、尺寸调整、EXIF清除。TinyPNG有的功能都有，它们收费的功能我们免费。' },
      { qEn: 'Can I switch from TinyPNG to CompressFast without losing quality?', qZh: '从TinyPNG换到极速压图，压缩品质会变差吗？', aEn: 'PNG compression: CompressFast uses oxipng WASM for lossless optimization — often achieves smaller files than TinyPNG for PNG. JPEG compression: TinyPNG has a slight edge in default quality, but CompressFast gives you a quality slider (TinyPNG doesn\'t) so you can match or exceed their results by adjusting. In practice, the differences are negligible for web use.', aZh: 'PNG压缩：极速压图使用oxipng WASM无损优化——PNG文件往往比TinyPNG更小。JPEG压缩：TinyPNG默认品质略优，但极速压图提供画质滑块（TinyPNG没有），你可以调节画质来达到甚至超越它们的效果。实际使用中，网页场景差异可以忽略不计。' },
      { qEn: 'Does CompressFast have an API like TinyPNG?', qZh: '极速压图有像TinyPNG那样的API吗？', aEn: 'Not currently. CompressFast is designed as a browser-based tool for end users, not developers. If you need API-based compression for a build pipeline, TinyPNG or Kraken.io are better fits. For manual batch compression with privacy, CompressFast is the better choice.', aZh: '目前没有。极速压图设计为面向终端用户的浏览器工具，而非面向开发者。如果你需要用于构建流程的API压缩，TinyPNG或Kraken.io更合适。如果你需要手动批量压缩并注重隐私，极速压图是更好的选择。' },
      { qEn: 'What makes CompressFast more private than TinyPNG?', qZh: '极速压图比TinyPNG更隐私体现在哪里？', aEn: 'TinyPNG requires uploading images to their cloud servers for processing — they have access to your files during compression. CompressFast processes everything locally using Web Workers and WebAssembly in your browser. Your files never leave your device. You can verify this by disconnecting your internet after loading the page — everything still works.', aZh: 'TinyPNG需要将图片上传到云端服务器处理——压缩过程中他们能访问你的文件。极速压图使用Web Worker和WebAssembly在浏览器中本地处理一切。你的文件从不离开你的设备。你可以通过加载页面后断网来验证——一切功能照常工作。' },
      { qEn: 'Is CompressFast completely free like the free tier of TinyPNG?', qZh: '极速压图像TinyPNG免费版那样完全免费吗？', aEn: 'Yes — and more generous. CompressFast free: 30 images/batch, 25MB/file, 400/month, all formats. TinyPNG free: 20 images/batch, 5MB/file, 500/month, WebP/PNG/JPEG only. CompressFast Pro ($24.99 lifetime) unlocks 500/batch, 50MB/file, no monthly limits, and AVIF output. TinyPNG Pro is $25/year.', aZh: '是的——而且更大方。极速压图免费版：30张/批、25MB/张、400次/月、全格式。TinyPNG免费版：20张/批、5MB/张、500次/月、仅WebP/PNG/JPEG。极速压图Pro（$24.99买断）解锁500张/批、50MB/张、无月度限制、AVIF输出。TinyPNG Pro是$25/年。' },
      { qEn: 'Can CompressFast compress PDF files like some TinyPNG alternatives?', qZh: '极速压图能像某些TinyPNG替代品那样压缩PDF吗？', aEn: 'No — CompressFast is focused on image formats only (PNG, JPEG, WebP, AVIF, GIF, SVG, BMP, HEIC). For PDF compression, dedicated tools like Smallpdf or ILovePDF are better suited. CompressFast excels at image optimization specifically.', aZh: '不能——极速压图专注于图片格式（PNG、JPEG、WebP、AVIF、GIF、SVG、BMP、HEIC）。PDF压缩更适合用Smallpdf或ILovePDF等专用工具。极速压图在图片优化方面是专长。' },
    ],
    detailedGuideEn: `TinyPNG has been the go-to image compressor for over a decade. It is reliable, well-known, and delivers consistent results. But in 2026, there are compelling reasons to consider alternatives — especially if you care about privacy, work with large files, or want to avoid recurring subscription costs.

    CompressFast is the best TinyPNG alternative for users who want:

    1. True privacy — TinyPNG processes your images on their cloud servers. Your files are uploaded, processed, and (they claim) deleted. But during those seconds, your images exist on a third-party server. CompressFast never uploads anything. All compression runs in your browser via Web Workers and WebAssembly. Disconnect your internet after loading the page — everything still works. This is critical for sensitive documents, client work, medical images, and unreleased product photos.

    2. No file size limits — TinyPNG restricts free users to 5MB per image. A single high-resolution photo from a modern smartphone easily exceeds this. CompressFast supports 25MB per image on the free tier (50MB for Pro). No artificial caps on your creative work.

    3. More format support — TinyPNG handles WebP, PNG, and JPEG. CompressFast handles 8 input formats (PNG, JPEG, WebP, AVIF, GIF, BMP, SVG, HEIC) and 4 output formats (PNG, JPEG, WebP, AVIF). This means format conversion is built-in — turn a GIF into WebP, a HEIC into JPEG, or a PNG into AVIF, all in the same compression step.

    4. Lifetime pricing — TinyPNG Pro costs $25/year, every year. CompressFast Pro is $24.99 once. For occasional users, both free tiers are fine. For regular users, the math favors CompressFast after year one.

    5. Extra features included — EXIF/GPS metadata stripping, image watermarking (text + image), resize with presets, ZIP batch download, before/after comparison slider. TinyPNG charges for some of these features; CompressFast includes them free.

    Areas where TinyPNG still wins: API access for developers, Photoshop/Figma plugins, and slightly more polished default JPEG compression. For everything else — especially privacy, batch work, and cost — CompressFast is the better tool.`,
    detailedGuideZh: `TinyPNG 作为图片压缩工具已经火了十多年。它可靠、知名、效果稳定。但到了 2026 年，有充分的理由考虑替代品——尤其如果你在意隐私、处理大文件、或不想付循环订阅费。

    极速压图是以下用户的最佳 TinyPNG 替代品：

    1. 真正的隐私——TinyPNG 在云端服务器上处理你的图片。你的文件被上传、处理、（他们声称）删除。但那几秒钟内，你的图片存在于第三方服务器上。极速压图从不上传任何东西。所有压缩在浏览器中通过 Web Worker 和 WebAssembly 运行。加载页面后断网——一切照常工作。这对敏感文件、客户工作、医疗影像和未发布的产品照片至关重要。

    2. 无文件大小限制——TinyPNG 限制免费用户每张图片 5MB。现代智能手机的一张高分辨率照片轻易超过这个限制。极速压图免费版支持每张 25MB（Pro 版 50MB）。不给你创作设人工上限。

    3. 更多格式支持——TinyPNG 处理 WebP、PNG 和 JPEG。极速压图处理 8 种输入格式（PNG、JPEG、WebP、AVIF、GIF、BMP、SVG、HEIC）和 4 种输出格式（PNG、JPEG、WebP、AVIF）。这意味着格式转换是内置的——把 GIF 变成 WebP、HEIC 变成 JPEG、PNG 变成 AVIF，全在同一个压缩步骤中完成。

    4. 买断定价——TinyPNG Pro 每年 $25，年复一年。极速压图 Pro 一次性 $24.99。对偶尔使用的用户来说，两个免费版都够用。对经常使用的用户，一年后算账极速压图更划算。

    5. 附加功能免费——EXIF/GPS 元数据清除、图片水印（文字+图片）、尺寸调整预设、ZIP 批量下载、前后对比滑块。TinyPNG 对其中一些功能收费；极速压图免费包含。

    TinyPNG 仍占优的方面：开发者 API 访问、Photoshop/Figma 插件、默认 JPEG 压缩稍更精细。其他方面——特别是隐私、批量处理、成本——极速压图是更好的工具。`,
    relatedTools: ['compress-images', 'compress-png', 'compress-jpeg'],
  },

  'heic-to-jpg': {
    slug: 'heic-to-jpg',
    titleEn: 'Convert HEIC to JPG Online Free — No Upload | CompressFast',
    titleZh: '在线HEIC转JPG — 免费iPhone照片格式转换 | 极速压图',
    descriptionEn: 'Convert HEIC to JPG online for free. iPhone photos to JPEG instantly — no upload, 100% browser-based. Batch convert up to 30 HEIC files at once. Keep original quality, strip EXIF.',
    descriptionZh: '免费在线HEIC转JPG，iPhone照片瞬间转为JPEG格式。无需上传，100%浏览器本地处理。批量转换最多30张HEIC文件，保留原始画质，清除EXIF隐私信息。',
    keywords: ['heic to jpg', 'convert heic to jpg', 'heic to jpg converter', 'heic to jpeg', 'iphone photo to jpg', 'convert heic to jpg online free', 'heic to jpg free', 'change heic to jpg', 'heic photo converter', 'apple heic to jpg'],
    heroTitleEn: 'Convert HEIC to JPG Online',
    heroTitleZh: '在线HEIC转JPG',
    heroSubEn: 'iPhone photos to JPEG in seconds. No upload, batch 30, free forever — works offline too.',
    heroSubZh: 'iPhone照片秒转JPEG。无需上传、批量30张、永久免费——断网也能用。',
    targetFormat: 'jpeg',
    defaultSettings: { quality: 92, outputFormat: 'jpeg', speed: 5, stripMetadata: true },
    benefits: [
      { icon: '📱', titleEn: 'iPhone Photos → Universal JPG', titleZh: 'iPhone照片→通用JPG', descEn: 'Apple HEIC photos only work on Apple devices. Convert to JPG for universal compatibility — Windows, Android, web, everywhere.', descZh: 'Apple的HEIC照片只在苹果设备上能看。转成JPG后通用兼容——Windows、安卓、网页，任何地方都能打开。' },
      { icon: '🔒', titleEn: '100% Private Conversion', titleZh: '100%隐私转换', descEn: 'Your photos never leave your device. Unlike cloud converters, all HEIC decoding happens locally in your browser via Web Workers.', descZh: '你的照片不会离开设备。不同于云端转换器，所有HEIC解码在浏览器本地通过Web Worker完成。' },
      { icon: '📦', titleEn: 'Batch 30 at Once', titleZh: '批量30张同时转换', descEn: 'Convert up to 30 HEIC photos to JPG in one batch. All processed in parallel. ZIP download all results in one click.', descZh: '一次批量转换最多30张HEIC照片为JPG，并行处理。一键ZIP下载全部结果。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload HEIC Photos', titleZh: '上传HEIC照片', descEn: 'Drag iPhone HEIC photos into the upload area, click to browse, or paste from clipboard. Supports up to 25MB per file.', descZh: '将iPhone的HEIC照片拖入上传区、点击选择、或Ctrl+V粘贴。单文件最高支持25MB。' },
      { step: 2, titleEn: 'Choose JPG Quality', titleZh: '选择JPG画质', descEn: 'Set JPG output quality (85-95% recommended for photos). "Strip Photo Info" removes GPS and camera data for privacy.', descZh: '设置JPG输出画质（照片推荐85-95%）。开启"清除照片信息"可删除GPS和相机数据保护隐私。' },
      { step: 3, titleEn: 'Download JPG Files', titleZh: '下载JPG文件', descEn: 'Each HEIC becomes a high-quality .jpg file. Download individually or batch ZIP. Compare before/after sizes.', descZh: '每张HEIC变成高质量.jpg文件。逐张下载或批量ZIP打包，对比前后大小。' },
    ],
    faqs: [
      { qEn: 'What is HEIC and why do iPhones use it?', qZh: '什么是HEIC？为什么iPhone要用它？', aEn: 'HEIC (High Efficiency Image Container) is Apple\'s modern photo format based on HEVC (H.265) compression. It stores photos at roughly half the file size of JPEG with equal or better quality. Apple adopted it as the default iPhone camera format in 2017 with iOS 11 to save storage space. The downside: HEIC is not widely supported outside the Apple ecosystem — Windows PCs, Android devices, most websites, and many apps cannot open HEIC files without conversion.', aZh: 'HEIC（高效图像容器）是Apple基于HEVC（H.265）压缩的现代照片格式。它在同等或更优画质下，文件体积约为JPEG的一半。Apple于2017年iOS 11起将其设为iPhone默认相机格式以节省存储空间。缺点是：HEIC在Apple生态外支持有限——Windows电脑、安卓设备、大多数网站和许多应用都无法直接打开HEIC文件，需要转换。' },
      { qEn: 'Does converting HEIC to JPG lose quality?', qZh: 'HEIC转JPG会损失画质吗？', aEn: 'Minimally, if you use a high quality setting (90%+). HEIC and JPEG are both lossy formats, so each conversion involves some information loss. However, at 90-95% quality, the difference is invisible to the naked eye. For archival purposes, keep the original .heic file and convert a copy to JPG for sharing. CompressFast uses browser-native high-quality HEIC decoding, then re-encodes to JPEG at your chosen quality level.', aZh: '如果用高画质设置（90%+），损失极小。HEIC和JPEG都是有损格式，每次转换都会涉及一些信息损失。但90-95%画质下，肉眼无法分辨差异。用于存档的话，保留原始.heic文件，转一份JPG用于分享。极速压图使用浏览器原生高质量HEIC解码，然后以你选择的画质重新编码为JPEG。' },
      { qEn: 'Is my photo data safe during HEIC conversion?', qZh: 'HEIC转换过程中照片数据安全吗？', aEn: 'Completely safe. All HEIC decoding and JPEG encoding happens locally in your browser using Web Workers. Your photos never leave your device — no upload to any server. You can verify this by disconnecting your internet after loading the page: the conversion still works perfectly. This is critical for personal photos, sensitive documents, and anything you would not want on a third-party server.', aZh: '绝对安全。所有HEIC解码和JPEG编码在浏览器本地通过Web Worker完成。你的照片从不离开设备——不上传任何服务器。你可以通过加载页面后断网来验证：转换仍然正常工作。这对个人照片、敏感文件和任何你不想放在第三方服务器上的内容至关重要。' },
      { qEn: 'Can I batch convert multiple HEIC files at once?', qZh: '能批量转换多个HEIC文件吗？', aEn: 'Yes — convert up to 30 HEIC photos to JPG in a single batch for free (500 with Pro). All files are processed in parallel using multiple Web Workers for maximum speed. Use "Download All" to get a single ZIP file of all converted JPGs. Perfect for converting an entire vacation album or photo shoot.', aZh: '可以——免费版一次批量转换最多30张HEIC为JPG（Pro版500张）。所有文件通过多个Web Worker并行处理，速度极快。点击"下载全部"获取包含所有JPG的单个ZIP文件。非常适合转换整个假期相册或拍摄合集。' },
      { qEn: 'Why can\'t I open HEIC files on my Windows PC?', qZh: '为什么Windows电脑打不开HEIC文件？', aEn: 'Windows does not include built-in HEIC support by default. Microsoft offers a paid HEIC codec ($0.99) in the Microsoft Store, but it only enables viewing — not editing or converting. This is the #1 reason people search for "heic to jpg converter": they need their iPhone photos to work on Windows. CompressFast solves this entirely in the browser — no codec to install, no payment, no upload.', aZh: 'Windows默认不包含HEIC支持。微软在应用商店提供了付费HEIC编解码器（$0.99），但只能查看不能编辑或转换。这是人们搜索"heic转jpg"的首要原因：他们需要iPhone照片在Windows上能用。极速压图完全在浏览器中解决——无需安装编解码器、无需付费、无需上传。' },
      { qEn: 'How long does HEIC to JPG conversion take?', qZh: 'HEIC转JPG需要多长时间？', aEn: 'Typically 1-3 seconds per photo, depending on the image resolution and your device\'s processing power. HEIC files are heavily compressed (that\'s why they\'re small), so the browser needs to decode them fully before re-encoding to JPEG. High-resolution photos (12MP+) may take 2-5 seconds. All processing runs in background Web Workers, so you can continue using the page while conversion happens.', aZh: '通常每张照片1-3秒，取决于图片分辨率和设备处理能力。HEIC文件压缩率高（这也是它们体积小的原因），浏览器需要完全解码后才能重新编码为JPEG。高分辨率照片（1200万像素以上）可能需要2-5秒。所有处理在后台Web Worker中运行，转换过程中你可以继续使用页面。' },
      { qEn: 'What is the difference between HEIC and HEIF?', qZh: 'HEIC和HEIF有什么区别？', aEn: 'HEIF (High Efficiency Image Format) is the container format standard. HEIC is Apple\'s specific implementation of HEIF — the "C" stands for "Container." In practice, they are the same thing: .heic files from iPhones are HEIF images with HEVC compression. CompressFast handles both .heic and .heif extensions identically.', aZh: 'HEIF（高效图像格式）是容器格式标准。HEIC是Apple对HEIF的具体实现——"C"代表容器（Container）。实践中它们是一回事：iPhone的.heic文件就是使用HEVC压缩的HEIF图像。极速压图对.heic和.heif扩展名同等处理。' },
      { qEn: 'Can I preserve HDR or Live Photos when converting HEIC to JPG?', qZh: 'HEIC转JPG能保留HDR或Live Photo吗？', aEn: 'No — JPEG format does not support HDR gain maps, depth data, or the video component of Live Photos. When converting HEIC to JPG, only the still image frame is preserved. HDR tone-mapping is applied during conversion so the photo looks natural, but the dynamic range is reduced to standard (SDR). If you need to preserve HDR or Live Photo features, keep the original .heic file.', aZh: '不能——JPEG格式不支持HDR增益图、深度数据或Live Photo的视频部分。HEIC转JPG时，只保留静态图像帧。转换过程中会应用HDR色调映射使照片看起来自然，但动态范围降低到标准（SDR）。如需保留HDR或Live Photo特性，请保留原始.heic文件。' },
    ],
    detailedGuideEn: `HEIC (High Efficiency Image Container) is Apple's answer to the question: "How do we fit more photos on iPhones without sacrificing quality?" Based on the HEVC (H.265) video compression standard, HEIC stores photos at roughly half the file size of JPEG — a 4MB JPEG photo becomes about 2MB as HEIC, with equivalent or better visual quality. Since iOS 11 (2017), every iPhone has captured photos in HEIC by default.

The problem? HEIC is an Apple-centric format. Windows PCs need a paid codec just to view HEIC files. Android devices can't open them natively. Most websites, social media platforms, and image editors expect JPEG or PNG. If you have ever tried to upload an iPhone photo to a website and been told "unsupported format," you have experienced the HEIC compatibility gap.

CompressFast's HEIC to JPG converter bridges this gap — 100% in your browser, with zero upload:

1. Browser-native HEIC decoding — Modern browsers (Chrome, Firefox, Edge, Safari) include HEIC decoders that run at native speed. CompressFast leverages these built-in decoders to extract full-resolution pixel data from your HEIC files. No plugin, no extension, no codec pack required. The decoding happens in a Web Worker so the main page stays responsive.

2. High-quality JPEG encoding — After decoding, the pixel data is re-encoded to JPEG at your chosen quality level (10-100%). We recommend 90-95% for photos — this produces a JPG that looks indistinguishable from the original HEIC while being about 30-50% larger (due to JPEG's less efficient compression). For web use, 85% provides an excellent size-quality balance.

3. EXIF privacy control — iPhone photos embed extensive metadata: precise GPS coordinates, camera specs, timestamp, and more. Enable "Strip Photo Info" to remove all of this before the JPEG is saved — critical for photos you plan to share online. Disable it to preserve metadata for your own archival use.

4. Batch workflow — Drop 30 HEIC photos at once, select JPEG output, click compress. All files convert in parallel. The result: a ZIP of ready-to-use JPGs that work everywhere — Windows, Android, websites, email attachments, social media, and any photo editing software.

5. Offline capability — Load the page once, then disconnect your internet. The converter still works perfectly because everything runs locally. This is especially useful when traveling or in areas with limited connectivity — convert photos without burning mobile data.

The HEIC to JPG workflow is one of the most common conversion needs: every iPhone user who wants their photos to work outside Apple's ecosystem needs it. With CompressFast, it is free, private, and takes seconds — no software to install, no accounts to create, no files to upload.`,
    detailedGuideZh: `HEIC（高效图像容器）是Apple对"如何在不牺牲画质的前提下让iPhone存更多照片"这个问题的答案。基于HEVC（H.265）视频压缩标准，HEIC以JPEG大约一半的文件体积存储照片——一张4MB的JPEG照片变成HEIC约2MB，画质相当甚至更好。自2017年iOS 11起，每台iPhone都默认以HEIC格式拍摄照片。

问题呢？HEIC是以Apple为中心的格式。Windows电脑需要付费编解码器才能查看HEIC文件。安卓设备无法原生打开。大多数网站、社交媒体平台和图片编辑器期望的是JPEG或PNG。如果你曾尝试将iPhone照片上传到某个网站却被提示"不支持的格式"，你就经历过HEIC兼容性鸿沟。

极速压图的HEIC转JPG转换器弥合了这一鸿沟——100%在浏览器中完成，零上传：

1. 浏览器原生HEIC解码——现代浏览器（Chrome、Firefox、Edge、Safari）内置了以原生速度运行的HEIC解码器。极速压图利用这些内置解码器从HEIC文件中提取全分辨率像素数据。无需插件、无需扩展、无需编解码器包。解码在Web Worker中进行，主页面保持响应流畅。

2. 高质量JPEG编码——解码后，像素数据以你选择的画质水平（10-100%）重新编码为JPEG。照片推荐90-95%——生成的JPG与原始HEIC肉眼无法区分，文件约大30-50%（因JPEG压缩效率较低）。用于网页的话，85%提供了优秀的体积-画质平衡。

3. EXIF隐私控制——iPhone照片嵌入了大量元数据：精确的GPS坐标、相机参数、时间戳等。开启"清除照片信息"在保存JPEG前删除所有这些——对于打算在线分享的照片至关重要。关闭则以保留元数据用于自己的存档。

4. 批量工作流——一次拖入30张HEIC照片，选JPEG输出，点压缩。所有文件并行转换。结果：一个包含即用JPG的ZIP文件，在任何地方都能用——Windows、安卓、网站、邮件附件、社交媒体和任何照片编辑软件。

5. 离线能力——加载页面一次，然后断开网络。转换器仍然完美工作，因为一切在本地运行。这在旅行或网络有限的环境下特别有用——转换照片不消耗手机流量。

HEIC转JPG是最常见的转换需求之一：每个想让照片在Apple生态之外也能使用的iPhone用户都需要它。使用极速压图，免费、隐私、几秒钟完成——无需安装软件、无需注册账号、无需上传文件。`,
    relatedTools: ['heic-to-png', 'compress-jpeg', 'convert-jpg-to-png', 'remove-metadata'],
  },

  'heic-to-png': {
    slug: 'heic-to-png',
    titleEn: 'Convert HEIC to PNG Online Free — No Upload | CompressFast',
    titleZh: '在线HEIC转PNG — 免费iPhone照片无损格式转换 | 极速压图',
    descriptionEn: 'Convert HEIC to PNG online for free. iPhone photos to lossless PNG — no upload, 100% browser-based. Batch convert up to 30 HEIC files at once. Preserve maximum quality with PNG output.',
    descriptionZh: '免费在线HEIC转PNG，iPhone照片转无损PNG格式。无需上传，100%浏览器本地处理。批量转换最多30张HEIC，PNG输出保留最高画质。',
    keywords: ['heic to png', 'convert heic to png', 'heic to png converter', 'heic to png online', 'iphone photo to png', 'convert heic to png free', 'heic to png transparent', 'apple heic to png', 'heif to png'],
    heroTitleEn: 'Convert HEIC to PNG Online',
    heroTitleZh: '在线HEIC转PNG',
    heroSubEn: 'iPhone photos to lossless PNG. No upload, batch 30, free forever — preserve every detail.',
    heroSubZh: 'iPhone照片转无损PNG。无需上传、批量30张、永久免费——保留每一处细节。',
    targetFormat: 'png',
    defaultSettings: { quality: 100, outputFormat: 'png', speed: 5, lossless: true, stripMetadata: true },
    benefits: [
      { icon: '✨', titleEn: 'Lossless PNG Output', titleZh: '无损PNG输出', descEn: 'Convert HEIC to PNG with zero additional quality loss. Oxipng WASM further optimizes the PNG for smaller file size — perfect for editing and archiving.', descZh: 'HEIC转PNG零额外画质损失。Oxipng WASM进一步优化PNG文件大小——非常适合编辑和存档。' },
      { icon: '🖼️', titleEn: 'Transparency Support', titleZh: '透明背景支持', descEn: 'PNG supports alpha channel transparency. Perfect for logos, graphics, and any image that needs a transparent background.', descZh: 'PNG支持alpha通道透明。非常适合Logo、图形和任何需要透明背景的图像。' },
      { icon: '📱', titleEn: 'Edit-Ready Format', titleZh: '可编辑格式', descEn: 'PNG is the standard format for photo editing. No generation loss when saving repeatedly — ideal for Photoshop, GIMP, and design work.', descZh: 'PNG是照片编辑的标准格式。反复保存不会有世代损失——适合Photoshop、GIMP和设计工作。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload HEIC Photos', titleZh: '上传HEIC照片', descEn: 'Drag iPhone HEIC photos into the upload area, click to browse, or Ctrl+V paste. Each file up to 25MB for free.', descZh: '将iPhone HEIC照片拖入上传区、点击选择、或Ctrl+V粘贴。免费每张最高25MB。' },
      { step: 2, titleEn: 'Select PNG Output + Settings', titleZh: '选择PNG输出+设置', descEn: 'Choose PNG as output format. Enable lossless mode for oxipng optimization — same pixels, smaller file. Adjust quality if needed.', descZh: '选PNG为输出格式。开启无损模式使用oxipng优化——像素不变，文件更小。如需可调画质。' },
      { step: 3, titleEn: 'Download PNG Files', titleZh: '下载PNG文件', descEn: 'Each HEIC becomes a lossless .png file. Download individually or batch ZIP. Compare sizes with the built-in slider.', descZh: '每张HEIC变成无损.png文件。逐张下载或批量ZIP。用内置对比滑块查看前后体积。' },
    ],
    faqs: [
      { qEn: 'Is HEIC to PNG conversion really lossless?', qZh: 'HEIC转PNG真的是无损的吗？', aEn: 'PNG is a lossless format — once converted, no further quality degradation occurs when you open, edit, and save the PNG repeatedly. However, the original HEIC source file already has compression from its HEVC encoding. Converting to PNG preserves the current quality perfectly but cannot recover details already lost in the original HEIC compression. Think of it as "lossless from this point forward." For maximum archival quality, enable CompressFast\'s lossless mode which uses oxipng WASM to produce the smallest possible mathematically-lossless PNG.', aZh: 'PNG是无损格式——转换后，反复打开、编辑、保存PNG都不会造成进一步的画质劣化。但原始HEIC文件本身已有HEVC编码的压缩。转PNG完美保留当前画质，但无法恢复原始HEIC压缩中已丢失的细节。可以理解为"从此往后无损"。为最大化存档画质，开启极速压图的无损模式，使用oxipng WASM产出最小的数学上无损的PNG。' },
      { qEn: 'Will the PNG file be larger than the original HEIC?', qZh: 'PNG文件会比原始HEIC大吗？', aEn: 'Almost certainly yes — often 3-5× larger. HEIC uses highly efficient HEVC compression (similar to video compression), while PNG uses lossless DEFLATE compression designed for graphics. A 2MB HEIC photo might become 6-10MB as PNG. This is the fundamental trade-off: PNG gives you lossless quality and universal compatibility at the cost of larger file size. For web use where file size matters, convert HEIC to JPG or WebP instead.', aZh: '几乎肯定会——通常大3-5倍。HEIC使用高效的HEVC压缩（类似视频压缩），而PNG使用为图形设计的无损DEFLATE压缩。一张2MB的HEIC照片转PNG可能变成6-10MB。这是根本性的取舍：PNG提供无损画质和通用兼容性，代价是文件更大。用于网页且在意文件大小的话，建议转JPG或WebP。' },
      { qEn: 'Why convert HEIC to PNG instead of JPG?', qZh: '为什么转PNG而不是JPG？', aEn: 'Choose PNG when: (1) you plan to edit the photo further — PNG does not accumulate generation loss like JPG does. (2) you need transparency — JPG does not support it. (3) you are archiving important photos — PNG provides a stable, lossless format. (4) the image contains text, logos, or sharp edges — JPG creates fuzzy artifacts around these. Choose JPG when: file size matters more than perfect quality, or you are sharing photos online where JPEG is universally accepted.', aZh: '选PNG当：(1) 你打算进一步编辑照片——PNG不会像JPG那样累积世代损失。(2) 你需要透明背景——JPG不支持。(3) 你在存档重要照片——PNG提供稳定无损的格式。(4) 图片包含文字、Logo或锐利边缘——JPG会在这些区域产生模糊伪影。选JPG当：文件大小比完美画质更重要，或你是在线分享照片，JPEG被普遍接受。' },
      { qEn: 'Can I convert Live Photos from HEIC to PNG?', qZh: '能把Live Photo从HEIC转成PNG吗？', aEn: 'HEIC files from Live Photos contain a still image keyframe plus a short video clip. CompressFast extracts and converts only the still image to PNG. The video portion of the Live Photo is not included in the output PNG. If you need to preserve the motion component, keep the original .heic file or export as a video/GIF.', aZh: 'Live Photo的HEIC文件包含一个静态关键帧和一段短视频。极速压图仅提取并转换静态图像为PNG。Live Photo的视频部分不会包含在输出的PNG中。如需保留动态部分，请保留原始.heic文件或导出为视频/GIF。' },
      { qEn: 'Does the conversion work on mobile devices?', qZh: '转换能在手机上用吗？', aEn: 'Yes — CompressFast works fully on mobile browsers (Safari on iPhone, Chrome on Android). You can convert HEIC photos directly on your phone without installing any app. On iPhones, you can even convert photos right in Safari: the HEIC decoder is built into iOS, so conversion is fast and efficient. The responsive UI adapts to your screen size for easy tap-and-convert workflow.', aZh: '可以——极速压图在手机浏览器上完全可用（iPhone上的Safari、安卓上的Chrome）。你可以直接在手机上转换HEIC照片，无需安装任何App。在iPhone上，甚至可以在Safari中直接转换照片：HEIC解码器内置于iOS，转换快速高效。响应式UI适配屏幕尺寸，点击即转换。' },
      { qEn: 'Can I batch convert multiple HEIC files to PNG at once?', qZh: '能批量将多个HEIC转PNG吗？', aEn: 'Yes — convert up to 30 HEIC photos to PNG in a single batch for free (500 with Pro). Each photo is decoded and re-encoded in parallel via Web Workers. Use "Download All" to get a single ZIP file containing all converted PNGs. Perfect for converting an entire photo set for editing or archiving.', aZh: '可以——免费版一次批量转最多30张HEIC为PNG（Pro版500张）。每张照片通过Web Worker并行解码和重编码。点击"下载全部"获取包含所有PNG的单个ZIP文件。非常适合批量转换照片用于编辑或存档。' },
      { qEn: 'What quality settings should I use for HEIC to PNG?', qZh: 'HEIC转PNG应该用什么画质设置？', aEn: 'For PNG output, the quality slider mainly affects compression effort, not visual quality. PNG is lossless — quality settings above 90% produce visually lossless results. For maximum quality preservation, use 100% quality with lossless mode enabled (oxipng WASM). This produces the smallest possible PNG that is pixel-for-pixel identical to the decoded HEIC. For slightly smaller files with imperceptible quality loss, 90-95% works well.', aZh: 'PNG输出时，画质滑块主要影响压缩力度而非视觉质量。PNG是无损的——90%以上画质产出的结果视觉上无损。为最大化画质保留，使用100%画质并开启无损模式（oxipng WASM）。这产出与解码后的HEIC逐像素一致的、体积最小的PNG。为稍小文件且可忽略的画质损失，90-95%效果很好。' },
      { qEn: 'Can I convert HEIC to PNG with transparent background?', qZh: '能把HEIC转成带透明背景的PNG吗？', aEn: 'HEIC photos from iPhone cameras do not contain transparency — they are regular photographs with opaque backgrounds. Converting to PNG preserves the photo as-is. If you need to remove the background from a photo, you would need a separate background removal tool. PNG supports transparency in case your HEIC source has it (e.g., screenshots of UI elements on iOS), and CompressFast preserves it during conversion.', aZh: 'iPhone相机拍摄的HEIC照片不包含透明背景——它们是普通的不透明照片。转PNG保持照片原样。如需去除照片背景，需要另外使用背景移除工具。如果HEIC源文件有透明通道（如iOS上UI元素的截图），PNG支持透明且极速压图在转换中会保留它。' },
    ],
    detailedGuideEn: `HEIC offers incredible compression — iPhone photos at half the size of JPEG with equal quality. But when you need to edit, archive, or ensure maximum compatibility, PNG is the gold standard. It is a lossless format, which means you can open, edit, and save a PNG file hundreds of times without accumulating compression artifacts.

CompressFast's HEIC to PNG converter combines browser-native HEIC decoding with powerful PNG optimization in one seamless workflow:

1. High-fidelity HEIC decoding — The browser's built-in HEIC decoder extracts every pixel from your iPhone photo at full resolution. This step converts the HEVC-compressed image data into raw pixel data — the same uncompressed representation any image editor would work with.

2. PNG encoding with oxipng optimization — The decoded pixels are encoded to PNG format. If lossless mode is enabled, oxipng WASM kicks in to trial-run multiple compression strategies (zlib levels, Zopfli, PNG filter combinations) and selects the smallest result. The output is mathematically lossless — every pixel matches the decoded HEIC exactly, but the file is 20-60% smaller than a naive PNG save.

3. EXIF privacy protection — iPhone HEIC photos contain extensive metadata. Enable "Strip Photo Info" to remove GPS coordinates, camera serial numbers, timestamps, and all other EXIF data before the PNG is saved. Your photo pixels stay identical — only the hidden metadata is removed.

4. Batch processing — Convert up to 30 HEIC photos to PNG at once. Each photo is processed in its own Web Worker thread for maximum parallelism. The result: a ZIP file of optimized PNGs, each file preserving the full quality of the original iPhone photo.

5. When to use HEIC → PNG — (a) Photo editing workflow: convert to PNG, edit in Photoshop/GIMP, save without generation loss. (b) Archival: PNG is a stable, well-documented format that will be readable for decades. HEIC is newer and patent-encumbered. (c) Screenshots and UI: iOS screenshots captured as HEIC benefit from PNG's lossless sharpness — text stays crisp. (d) Printing: professional print services expect PNG or TIFF, not HEIC.

The trade-off is file size: PNGs will be larger than the HEIC originals (typically 3-5×). If file size is your primary concern, use the HEIC to JPG converter instead for a much smaller output at still-excellent quality.`,
    detailedGuideZh: `HEIC提供了令人难以置信的压缩率——iPhone照片在同等画质下体积仅为JPEG的一半。但当需要编辑、存档或确保最大兼容性时，PNG是黄金标准。它是无损格式，意味着你可以反复打开、编辑、保存PNG文件数百次而不会累积压缩失真。

极速压图的HEIC转PNG转换器将浏览器原生HEIC解码与强大的PNG优化结合在一个无缝工作流中：

1. 高保真HEIC解码——浏览器内置HEIC解码器以全分辨率提取iPhone照片的每个像素。这一步将HEVC压缩的图像数据转换为原始像素数据——与任何图像编辑器处理的未压缩表示相同。

2. 含oxipng优化的PNG编码——解码后的像素被编码为PNG格式。如开启无损模式，oxipng WASM会尝试多种压缩策略（zlib级别、Zopfli算法、PNG滤镜组合）并选择最小结果。输出在数学上无损——每个像素与解码后的HEIC完全一致，但文件比朴素PNG保存小20-60%。

3. EXIF隐私保护——iPhone HEIC照片包含大量元数据。开启"清除照片信息"在PNG保存前删除GPS坐标、相机序列号、时间戳等所有EXIF数据。照片像素保持不变——只删除隐藏元数据。

4. 批量处理——一次将最多30张HEIC照片转为PNG。每张照片在独立的Web Worker线程中处理，最大化并行度。结果：一个包含优化PNG的ZIP文件，每张文件保留iPhone照片的完整画质。

5. 何时使用HEIC→PNG——(a) 照片编辑工作流：转PNG后在Photoshop/GIMP中编辑，保存无世代损失。(b) 存档：PNG是稳定、文档完备的格式，未来几十年都可读。HEIC较新且有专利负担。(c) 截图和UI：iOS截图转PNG受益于无损锐度——文字保持清晰。(d) 打印：专业打印服务期望PNG或TIFF，不接受HEIC。

取舍在于文件大小：PNG会比HEIC原文件大（通常3-5倍）。如果文件大小是首要考量，改用HEIC转JPG转换器，在体积小得多的同时画质依然优秀。`,
    relatedTools: ['heic-to-jpg', 'compress-png', 'convert-jpg-to-png', 'webp-to-png'],
  },

  'compress-svg': {
    slug: 'compress-svg',
    titleEn: 'Compress SVG Online Free — Reduce SVG File Size | CompressFast',
    titleZh: '在线SVG压缩 — 免费减小SVG文件体积 | 极速压图',
    descriptionEn: 'Compress SVG files online for free. 100% browser-based optimization — path data minification, color shortening, metadata removal, and whitespace cleanup. Batch support.',
    descriptionZh: '免费在线压缩SVG文件，100%浏览器本地优化——路径数据精简化、颜色代码缩短、元数据清除、空白清理。支持批量处理。',
    keywords: ['compress svg', 'svg compressor', 'compress svg online', 'reduce svg size', 'svg minifier', 'svg optimizer', 'minify svg', 'optimize svg for web', 'free svg compressor'],
    heroTitleEn: 'Compress SVG Files Online',
    heroTitleZh: '在线压缩SVG文件',
    heroSubEn: 'Free, private, lossless. Path data minification + color shortening + metadata removal + structure cleanup — comprehensive optimization in your browser.',
    heroSubZh: '免费、隐私安全、无损。路径坐标精度压缩 + 颜色缩短 + 元数据清除 + 结构清理——浏览器内全面优化。',
    targetFormat: 'original',
    defaultSettings: { quality: 100, outputFormat: 'original', speed: 10, lossless: true },
    benefits: [
      { icon: '✂️', titleEn: 'Lossless Text Optimization', titleZh: '无损文本优化', descEn: 'SVG is text-based XML. We strip comments, whitespace, and editor metadata — your SVG renders exactly the same, just leaner.', descZh: 'SVG是文本格式的XML。我们清除注释、空白和编辑器元数据——渲染效果完全不变，文件更小。' },
      { icon: '🔒', titleEn: '100% Local Processing', titleZh: '100%本地处理', descEn: 'Your SVG source code never leaves your browser. No upload to any server — safe for proprietary icons and logos.', descZh: 'SVG源码不会离开你的浏览器，不上传任何服务器——适合私有的图标和Logo。' },
      { icon: '📦', titleEn: 'Batch SVG Compression', titleZh: '批量SVG压缩', descEn: 'Compress up to 30 SVG files at once for free. ZIP download all results in one click. Ideal for icon sets.', descZh: '免费一次压缩最多30个SVG文件，一键ZIP打包下载，非常适合图标集。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop or Select SVG Files', titleZh: '拖入或选择SVG文件', descEn: 'Drag SVG files into the upload area, click to browse, or paste from clipboard. Multiple files supported.', descZh: '将SVG文件拖入上传区、点击选择、或Ctrl+V粘贴，支持多文件。' },
      { step: 2, titleEn: 'Auto-Optimize', titleZh: '自动优化', descEn: 'CompressFast automatically strips unnecessary data: XML comments, indentation whitespace, editor metadata, and redundant attributes.', descZh: '极速压图自动清除冗余数据：XML注释、缩进空白、编辑器元数据和多余属性。' },
      { step: 3, titleEn: 'Download Optimized SVGs', titleZh: '下载优化后的SVG', descEn: 'Each optimized SVG keeps the .svg extension. Download individually or batch ZIP. Compare before/after sizes.', descZh: '优化后的SVG保持.svg后缀，逐张下载或批量ZIP，对比压缩前后大小。' },
    ],
    faqs: [
      { qEn: 'Does SVG compression change how my image looks?', qZh: 'SVG压缩会改变图像外观吗？', aEn: 'No — SVG compression is lossless. We only remove invisible data: XML comments, whitespace, and editor metadata. Your SVG renders pixel-perfect identical.', aZh: '不会——SVG压缩是完全无损的。我们只删除不可见数据：XML注释、空白和编辑器元数据。你的SVG渲染效果像素级别完全一致。' },
      { qEn: 'Is my SVG source code uploaded to a server?', qZh: '我的SVG源码会被上传到服务器吗？', aEn: 'Never. All optimization happens locally in your browser. Your SVG code stays on your device — safe for proprietary icons, brand logos, and commercial assets.', aZh: '绝不会。所有优化在浏览器本地完成，SVG代码留在你的设备上——适合私有的图标、品牌Logo和商业素材。' },
      { qEn: 'Can I compress multiple SVGs at once?', qZh: '可以同时压缩多个SVG吗？', aEn: 'Yes — compress up to 30 SVGs at once for free (500 with Pro). Perfect for icon sets, illustration packs, and design system assets.', aZh: '可以——免费版一次压缩最多30个SVG（Pro版500个）。非常适合图标集、插画包和设计系统资源。' },
      { qEn: 'How much can SVG files be reduced?', qZh: 'SVG文件能减小多少？', aEn: 'Results vary widely: SVGs from design tools (Illustrator, Figma, Sketch) often contain massive editor metadata and can shrink 50-90%. Hand-coded SVGs are usually already lean — expect 5-20% reduction. Minified SVGs may see little to no reduction. CompressFast shows you the before/after byte count for each file.', aZh: '效果差异很大：设计工具导出的SVG（Illustrator、Figma、Sketch）通常包含大量编辑器元数据，可缩减50-90%。手写的SVG通常已经很精简——预期减少5-20%。已压缩过的SVG可能几乎没有缩减空间。极速压图会显示每张文件的前后字节数。' },
      { qEn: 'What exactly gets removed during SVG compression?', qZh: 'SVG压缩过程中具体会删除什么？', aEn: 'CompressFast performs multi-phase SVG optimization: (1) Structural cleanup — XML comments, DOCTYPE, editor metadata blocks (Illustrator/Figma/Sketch/Inkscape markers), `<title>` and `<desc>` elements. (2) Attribute removal — `version`, `xml:space`, empty `id`/`class`/`data-*`, editor-specific attributes, unused namespace declarations. (3) Numeric precision reduction — path coordinates are rounded to 1 decimal place for ~20-40% size savings on complex paths. (4) Color optimization — `#ffffff` → `#fff`, `rgb(255,255,255)` → `#fff`. (5) Structure cleanup — empty `<g>` groups, empty `<defs>`. Your visible artwork, gradients, and animations are untouched.', aZh: '极速压图执行多阶段SVG优化：(1) 结构清理——XML注释、DOCTYPE、编辑器元数据块（Illustrator/Figma/Sketch/Inkscape标记）、`<title>`和`<desc>`元素。(2) 属性移除——`version`、`xml:space`、空的`id`/`class`/`data-*`、编辑器专属属性、无用的命名空间声明。(3) 数值精度压缩——路径坐标取1位小数，复杂路径可缩减20-40%。(4) 颜色优化——`#ffffff`→`#fff`、`rgb(255,255,255)`→`#fff`。(5) 结构清理——空`<g>`组、空`<defs>`。可见图形、渐变和动画不受任何影响。' },
      { qEn: 'Can compressed SVGs still be edited in Illustrator or Figma?', qZh: '压缩后的SVG还能在Illustrator或Figma中编辑吗？', aEn: 'Yes — compression only removes invisible metadata, not structural vector data. The SVG opens fine in any vector editor. However, editor-specific metadata (like layer names or artboard info) will be gone. If you need to preserve editing metadata, keep the original file and compress a copy for production use.', aZh: '可以——压缩只移除不可见元数据，不会删除结构性矢量数据。SVG在任何矢量编辑器中都能正常打开。但编辑器专属元数据（如图层名称或画板信息）会被清除。如果需要保留编辑元数据，保留原文件，压缩一份副本用于生产环境。' },
      { qEn: 'Is SVG compression the same as SVG minification?', qZh: 'SVG压缩和SVG压缩混淆是一样的吗？', aEn: 'They are similar but not identical. Minification focuses on reducing file size by removing whitespace and shortening names. CompressFast also removes editor metadata and redundant attributes, which minifiers often miss. For maximum size reduction, you can minify first with a dedicated tool (like SVGO), then use CompressFast for metadata cleanup.', aZh: '类似但不完全相同。压缩混淆侧重于通过移除空白和缩短名称来减小文件大小。极速压图还清除了编辑器元数据和多余属性，这些是混淆工具经常遗漏的。要最大化缩减体积，可以先用专用工具（如SVGO）混淆，再用极速压图清理元数据。' },
      { qEn: 'Can I compress an SVG inside a web page without downloading it?', qZh: '能不下载就直接压缩网页中的SVG吗？', aEn: 'You would need to save the SVG file first, then upload it to CompressFast. Most SVGs on websites are already optimized. If you are building a website, the better approach is to optimize your SVGs during the build process using tools like SVGO (as part of your build pipeline) rather than manually compressing each one.', aZh: '你需要先保存SVG文件，然后上传到极速压图。网站上的大多数SVG已经被优化。如果你在构建网站，更好的做法是在构建流程中使用SVGO等工具优化SVG（作为构建管道的一部分），而非手动逐一压缩。' },
    ],
    detailedGuideEn: `SVG (Scalable Vector Graphics) is unique among image formats — it is not a grid of pixels, but a text file containing mathematical descriptions of shapes, paths, and colors. This makes SVG infinitely scalable (no "resolution"), typically very small for simple graphics, and editable with any text editor. But SVGs from design tools like Illustrator, Figma, or Sketch often carry significant bloat.

    CompressFast's SVG compressor strips this bloat without touching your visible artwork:

    1. What gets cleaned — XML comments (designer notes, tool markers), indentation whitespace (tabs, spaces used for formatting), editor metadata blocks (application-specific data from Illustrator, Figma, Sketch, Inkscape), redundant namespace declarations, empty &lt;g&gt; groups, default attribute values (version="1.1", x="0" y="0"), and unnecessary &lt;title&gt;/&lt;desc&gt; elements. Everything visible — paths, shapes, gradients, filters, animations — is preserved exactly.

    2. How much you can save — Editor-exported SVGs: 50-90% reduction is common. A 50KB Illustrator SVG may become 8KB after cleaning. Hand-coded SVGs: 5-20% reduction. Already-optimized SVGs: minimal savings. The before/after comparison shows exact bytes saved.

    3. The privacy advantage for SVG — SVG files contain your actual source code. Uploading proprietary icons or brand logos to a server-based SVG optimizer means sharing your intellectual property with a third party. CompressFast processes everything locally — your vector code never leaves your browser.

    4. Batch optimization for icon sets — Design systems and icon libraries often contain dozens or hundreds of SVG files. CompressFast handles up to 30 at once (500 with Pro). Drop an entire icon folder, download a ZIP of optimized SVGs.

    5. When to use vs dedicated tools — For one-off SVG cleanups, CompressFast is perfect. For build-pipeline optimization of hundreds of SVGs, command-line tools like SVGO integrate better into CI/CD workflows. Use CompressFast for quick manual jobs and SVGO for automated optimization.`,
    detailedGuideZh: `SVG（可缩放矢量图形）在图像格式中独树一帜——它不是像素网格，而是包含形状、路径和色彩数学描述的文本文件。这使得SVG无限可缩放（没有"分辨率"），简单图形通常非常小，且可用任何文本编辑器编辑。但从Illustrator、Figma或Sketch等设计工具导出的SVG往往携带大量冗余。

    极速压图的SVG压缩器清除这些冗余，不触碰可见图形：

    1. 清除内容——XML注释（设计师笔记、工具标记）、缩进空白（用于格式化的制表符和空格）、编辑器元数据块（来自Illustrator、Figma、Sketch、Inkscape的应用专属数据）、多余的命名空间声明、空&lt;g&gt;组、默认属性值（version="1.1"、x="0" y="0"）、不必要的&lt;title&gt;/&lt;desc&gt;元素。所有可见内容——路径、形状、渐变、滤镜、动画——被精确保留。

    2. 能节省多少——编辑器导出的SVG：通常缩减50-90%。一个50KB的Illustrator SVG清理后可能变成8KB。手写的SVG：缩减5-20%。已优化过的SVG：节省空间微小。前后对比显示精确的字节节省量。

    3. SVG的隐私优势——SVG文件包含你的实际源代码。将私有图标或品牌Logo上传到基于服务器的SVG优化器，意味着与第三方分享你的知识产权。极速压图全部本地处理——你的矢量代码永远不离开你的浏览器。

    4. 图标集批量优化——设计系统和图标库通常包含几十甚至几百个SVG文件。极速压图一次处理最多30个（Pro版500个）。拖入整个图标文件夹，下载优化后的SVG ZIP包。

    5. 何时使用vs专用工具——一次性SVG清理，极速压图完美胜任。对数百个SVG的构建管道优化，SVGO等命令行工具能更好地集成到CI/CD工作流中。用极速压图做快速手动处理，用SVGO做自动化优化。`,
    relatedTools: ['compress-images', 'compress-png', 'convert-to-webp'],
  },

  'png-to-jpg': {
    slug: 'png-to-jpg',
    titleEn: 'Convert PNG to JPG Online Free — No Upload | CompressFast',
    titleZh: '在线PNG转JPG — 免费图片格式转换 | 极速压图',
    descriptionEn: 'Convert PNG to JPG online for free. No upload required — 100% browser-based conversion. Batch convert up to 30 PNG images to JPEG at once. Adjustable quality, EXIF-free output.',
    descriptionZh: '免费在线PNG转JPG，无需上传，100%浏览器本地转换。批量转换最多30张PNG为JPEG。可调画质，输出无EXIF隐私信息。',
    keywords: ['png to jpg', 'convert png to jpg', 'png to jpg converter', 'png to jpeg', 'convert png to jpg online free', 'png to jpg free', 'change png to jpg', 'png to jpg high quality', 'png image to jpg'],
    heroTitleEn: 'Convert PNG to JPG Online',
    heroTitleZh: '在线PNG转JPG',
    heroSubEn: 'PNG to JPEG conversion in seconds. No upload, batch 30, free forever — high quality output.',
    heroSubZh: 'PNG秒转JPEG。无需上传、批量30张、永久免费——高质量输出。',
    targetFormat: 'jpeg',
    defaultSettings: { quality: 92, outputFormat: 'jpeg', speed: 5, stripMetadata: true },
    benefits: [
      { icon: '📉', titleEn: 'Drastically Smaller Files', titleZh: '文件大幅减小', descEn: 'PNG files are often 3-10× larger than JPEG at the same resolution. Convert to JPG and reduce file size by 70-90% — perfect for web, email, and sharing.', descZh: 'PNG文件通常是同分辨率JPEG的3-10倍大。转JPG后体积减小70-90%——非常适合网页、邮件和分享。' },
      { icon: '🎯', titleEn: 'Adjustable Quality', titleZh: '可调画质', descEn: 'Control JPG output quality from 10-100%. 85-95% recommended for photos — excellent quality with dramatic size reduction.', descZh: 'JPG输出画质10-100%可调。照片推荐85-95%——画质优秀，体积显著减小。' },
      { icon: '🔒', titleEn: 'Private & Local', titleZh: '隐私本地处理', descEn: 'Your PNG files never leave your device. All conversion happens in your browser via Web Workers — no upload, no server, no risk.', descZh: 'PNG文件不离开你的设备。所有转换在浏览器中通过Web Worker完成——不上传、无服务器、零风险。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload PNG Files', titleZh: '上传PNG文件', descEn: 'Drag PNG images into the upload area, click to browse, or Ctrl+V paste. Up to 30 files at once, 10MB each for free.', descZh: '将PNG图片拖入上传区、点击选择、或Ctrl+V粘贴。免费一次最多30张，每张10MB。' },
      { step: 2, titleEn: 'Choose JPG Quality', titleZh: '选择JPG画质', descEn: 'Adjust the quality slider — 85-95% for photos, 70-85% for web images. Enable "Strip Photo Info" to remove hidden metadata.', descZh: '调节画质滑块——照片85-95%，网页图片70-85%。开启"清除照片信息"删除隐藏元数据。' },
      { step: 3, titleEn: 'Download JPG Files', titleZh: '下载JPG文件', descEn: 'Each PNG becomes a compact .jpg file. Download individually or batch ZIP. Compare before/after sizes instantly.', descZh: '每张PNG变成紧凑的.jpg文件。逐张下载或批量ZIP，即时对比前后大小。' },
    ],
    faqs: [
      { qEn: 'Why convert PNG to JPG?', qZh: '为什么要把PNG转成JPG？', aEn: 'PNG is lossless and great for graphics, but files are large — a single screenshot can be 2-5MB. Converting to JPG reduces file size by 70-90% while maintaining excellent visual quality. This matters for: (1) websites — faster page loads, better SEO, (2) email — many services limit attachments to 25MB, (3) social media — platforms compress uploads anyway, so pre-compressing gives you control, (4) storage — JPG takes a fraction of the space.', aZh: 'PNG无损且适合图形，但文件很大——一张截图就2-5MB。转JPG减小体积70-90%，同时保持优秀的视觉质量。重要场景：(1) 网站——加载更快、SEO更好，(2) 邮件——很多服务限制附件25MB，(3) 社交媒体——平台本身上传也会压缩，提前压缩能掌控画质，(4) 存储——JPG只占零头空间。' },
      { qEn: 'Does converting PNG to JPG lose quality?', qZh: 'PNG转JPG会损失画质吗？', aEn: 'Yes — JPG is a lossy format, so some quality loss occurs during conversion. However, at 90-95% quality, the difference is invisible to the naked eye while file size drops 70-85%. The loss matters most for: text (JPG creates fuzzy edges), sharp graphics like logos, and images you plan to edit repeatedly. For these cases, keep the original PNG. For photos and web images, the trade-off is overwhelmingly worth it.', aZh: '会——JPG是有损格式，转换中会有一定的画质损失。但90-95%画质下，肉眼无法分辨差异，体积却减小70-85%。损失最明显的场景：文字（JPG边缘模糊）、Logo等锐利图形、以及需要反复编辑的图片。这些情况保留原PNG。对于照片和网页图片，这个取舍绝对值得。' },
      { qEn: 'What happens to transparent areas when converting PNG to JPG?', qZh: 'PNG转JPG时透明部分会怎样？', aEn: 'JPEG does not support transparency. Transparent areas in your PNG will be filled with white (#FFFFFF) in the output JPG. CompressFast shows a warning when converting images with transparency to JPEG. If you need to preserve transparency, convert to WebP or keep the file as PNG. If your PNG has no transparency (like most screenshots and photos), this is a non-issue.', aZh: 'JPEG不支持透明。PNG中的透明区域在输出的JPG中会被填充为白色(#FFFFFF)。极速压图在将有透明度的图片转为JPEG时会显示警告。如需保留透明，请转WebP或保持PNG。如果PNG没有透明通道（如大多数截图和照片），这完全不是问题。' },
      { qEn: 'Can I batch convert multiple PNGs to JPG?', qZh: '能批量把多个PNG转成JPG吗？', aEn: 'Yes — convert up to 30 PNGs to JPG at once for free (500 with Pro). All files are processed in parallel via Web Workers. Use "Download All" to get a single ZIP of all converted JPGs. Perfect for converting a folder of screenshots, design exports, or product images.', aZh: '可以——免费版一次批量转换最多30张PNG为JPG（Pro版500张）。所有文件通过Web Worker并行处理。点击"下载全部"获取包含所有JPG的单个ZIP。非常适合批量转换截图文件夹、设计导出或产品图片。' },
      { qEn: 'What is the best quality setting for PNG to JPG conversion?', qZh: 'PNG转JPG用什么画质设置最好？', aEn: '85-92% is the sweet spot — file size drops 70-85% with virtually invisible quality loss. For photographs: 90-95% preserves fine detail. For screenshots and UI images: 80-90% works great — text stays readable. For thumbnails and previews: 70-80% is fine. CompressFast shows you the compressed file size estimate as you adjust the slider.', aZh: '85-92%是最佳区间——体积减小70-85%，画质损失肉眼不可见。照片：90-95%保留精细细节。截图和UI图：80-90%效果很好——文字依然清晰。缩略图和预览图：70-80%即可。极速压图在调节滑块时实时显示压缩后大小估算。' },
      { qEn: 'Can I resize the image while converting PNG to JPG?', qZh: 'PNG转JPG的同时能调整尺寸吗？', aEn: 'Yes — CompressFast combines resize and format conversion in one step. Set target dimensions in pixels or use percentage presets (50%, 75%, 1080p). Resizing before JPG encoding produces dramatically smaller files: a 2000×2000 PNG at 3MB resized to 1200×1200 and converted to JPG at 85% quality can become 150KB — a 95% reduction.', aZh: '可以——极速压图一步完成尺寸调整和格式转换。设置目标像素尺寸或使用百分比预设（50%、75%、1080p）。JPG编码前先调整尺寸可极大减小文件：一张2000×2000、3MB的PNG调到1200×1200并以85%画质转JPG，可能仅150KB——体积减小95%。' },
      { qEn: 'Will I lose EXIF and metadata when converting to JPG?', qZh: '转JPG会丢失EXIF和元数据吗？', aEn: 'You control this. Enable "Strip Photo Info" to remove all metadata (EXIF, GPS, camera info, timestamps) from the output JPG — recommended for privacy when sharing online. Disable it to preserve any metadata that was in the original PNG. Note: PNG files typically contain less metadata than camera JPEGs, so there may not be much to preserve.', aZh: '由你控制。开启"清除照片信息"删除输出JPG中的所有元数据（EXIF、GPS、相机信息、时间戳）——在线分享时推荐开启以保护隐私。关闭则保留原PNG中的元数据。注意：PNG通常比相机JPG包含更少的元数据，可能没什么可保留的。' },
      { qEn: 'Is PNG to JPG conversion free? Are there any limits?', qZh: 'PNG转JPG免费吗？有什么限制？', aEn: 'Completely free. Free tier: up to 30 images per batch (20 for single-format), 10MB per file, 400 compressions per month. Pro ($24.99 lifetime): 500 images per batch, 50MB per file, no monthly limits, AVIF output, custom presets. No watermarks, no registration required for free use.', aZh: '完全免费。免费版：每批最多30张（单格式20张），单文件10MB，每月400次。Pro版（$24.99买断）：每批500张，单文件50MB，无月度限制，支持AVIF输出和自定义预设。无水印，免费使用无需注册。' },
    ],
    detailedGuideEn: `PNG (Portable Network Graphics) is the format of choice for screenshots, logos, UI elements, and any image with text or sharp edges — it is lossless, supports transparency, and produces pixel-perfect output every time. But PNG files are large. A single full-resolution screenshot can easily exceed 3MB. For web use, email attachments, and social media sharing, that size is overkill — JPEG delivers 90% of the visual quality at 10-30% of the file size.

CompressFast's PNG to JPG converter makes this transformation effortless and private:

1. Smart format detection — Upload any PNG (including those mislabeled as .jpg) and CompressFast correctly identifies it by file signature, not extension. The conversion engine handles 8-bit, 24-bit, and 32-bit (RGBA) PNGs correctly, including images with transparency.

2. Transparency handling — Since JPEG does not support alpha channels, transparent areas are filled with white (#FFFFFF). CompressFast warns you when converting PNGs with transparency so you can make an informed choice. For images where transparency matters, consider converting to WebP instead — it supports transparency and is still 25-35% smaller than PNG.

3. Quality-controlled JPEG encoding — The quality slider (10-100%) gives you precise control. At 85-95%, the visual difference from the original PNG is imperceptible while file size drops 70-85%. The browser's native JPEG encoder is used at full quality, producing standard-compliant files that work everywhere.

4. Combined resize + convert — The biggest file size wins come from combining resize with format conversion. A 2000×2000 PNG at 3MB, when resized to 1200×1200 and converted to JPG at 85% quality, can become 120-180KB. That is a 94-96% reduction — from a file too large for most web use to one that loads instantly.

5. Batch workflow — Drop 30 PNGs, select JPEG output, set quality to 90%, click compress. All files convert in parallel. Download a single ZIP of ready-to-use JPGs. Each file is correctly named and stripped of metadata (if enabled).

The PNG→JPG conversion is one of the most common image workflows: every designer who exports PNGs from Figma or Photoshop needs it, every developer who receives oversized screenshots needs it, and every content creator who shares images online needs it. CompressFast makes it free, private, and instant.`,
    detailedGuideZh: `PNG（便携式网络图形）是截图、Logo、UI元素和任何包含文字或锐利边缘的图片的首选格式——它无损、支持透明、每次输出像素完美。但PNG文件很大。一张全分辨率截图轻松超过3MB。对于网页使用、邮件附件和社交媒体分享，这个体积是过度冗余——JPEG以10-30%的文件大小提供90%的视觉质量。

极速压图的PNG转JPG转换器让这一转变轻松且私密：

1. 智能格式检测——上传任意PNG（包括被错误标记为.jpg的PNG），极速压图通过文件签名而非扩展名正确识别。转换引擎正确处理8位、24位和32位（RGBA）PNG，包括带透明的图片。

2. 透明区域处理——由于JPEG不支持alpha通道，透明区域填充为白色(#FFFFFF)。极速压图在转换带透明的PNG时会显示警告，让你做出明智选择。对透明很重要的图片，建议转WebP——支持透明，且仍比PNG小25-35%。

3. 画质控制的JPEG编码——画质滑块（10-100%）给予精确控制。85-95%下，与原PNG的视觉差异无法察觉，文件大小却降低70-85%。使用浏览器原生JPEG编码器全质量编码，产出标准合规、随处可用的文件。

4. 尺寸调整+格式转换组合——最大的体积缩减来自尺寸调整与格式转换的组合。一张2000×2000、3MB的PNG，调到1200×1200并以85%画质转JPG，可变为120-180KB。这是94-96%的缩减——从大多数网页场景无法接受的大文件到即时加载。

5. 批量工作流——拖入30张PNG，选JPEG输出，设画质90%，点压缩。所有文件并行转换。下载一个包含即用JPG的ZIP文件。每张文件正确命名，元数据（如开启）已清除。

PNG→JPG是最常见的图片工作流之一：每位从Figma或Photoshop导出PNG的设计师需要它，每位收到超大截图的开发者需要它，每位在线分享图片的内容创作者需要它。极速压图让它免费、私密、瞬间完成。`,
    relatedTools: ['compress-png', 'compress-jpeg', 'convert-jpg-to-png', 'convert-to-webp'],
  },

  'jpg-to-webp': {
    slug: 'jpg-to-webp',
    titleEn: 'Convert JPG to WebP Online Free — No Upload | CompressFast',
    titleZh: '在线JPG转WebP — 免费图片格式转换 | 极速压图',
    descriptionEn: 'Convert JPG/JPEG to WebP online for free. 25-35% smaller files at the same quality. No upload, 100% browser-based. Batch convert up to 30 JPG images at once. Perfect for web performance optimization.',
    descriptionZh: '免费在线JPG/JPEG转WebP，同等画质体积减小25-35%。无需上传，100%浏览器本地处理。批量转换最多30张JPG。完美用于网页性能优化。',
    keywords: ['jpg to webp', 'convert jpg to webp', 'jpeg to webp', 'jpg to webp converter', 'convert jpg to webp online free', 'jpg to webp free', 'jpeg to webp converter', 'convert jpg to webp wordpress', 'jpg to webp bulk'],
    heroTitleEn: 'Convert JPG to WebP Online',
    heroTitleZh: '在线JPG转WebP',
    heroSubEn: 'Same quality, 25-35% smaller. No upload, batch 30, free forever — modernize your images.',
    heroSubZh: '同等画质、体积小25-35%。无需上传、批量30张、永久免费——现代化你的图片。',
    targetFormat: 'webp',
    defaultSettings: { quality: 80, outputFormat: 'webp', speed: 5, stripMetadata: true },
    benefits: [
      { icon: '📦', titleEn: '25-35% Smaller Files', titleZh: '体积减小25-35%', descEn: 'WebP delivers the same visual quality as JPEG at a significantly smaller file size. Faster websites, lower bandwidth costs, better SEO rankings.', descZh: 'WebP在同等视觉质量下比JPEG体积更小。网站加载更快、带宽成本更低、SEO排名更优。' },
      { icon: '🌐', titleEn: '96% Browser Support', titleZh: '96%浏览器支持', descEn: 'All modern browsers support WebP: Chrome, Firefox, Safari 14+, Edge. Safe for production websites. Use <picture> tag for legacy fallback.', descZh: '所有现代浏览器支持WebP：Chrome、Firefox、Safari 14+、Edge。生产网站可安全使用。用<picture>标签提供降级方案。' },
      { icon: '⚡', titleEn: 'Instant Conversion', titleZh: '即时转换', descEn: 'Browser-native WebP encoder delivers fast, high-quality conversion. No server round-trip — all processing happens locally in milliseconds.', descZh: '浏览器原生WebP编码器提供快速高质量转换。无需服务器往返——所有处理在本地毫秒级完成。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload JPG Files', titleZh: '上传JPG文件', descEn: 'Drag JPEG images into the upload area, click to browse, or Ctrl+V paste. Batch up to 30 files at once.', descZh: '将JPEG图片拖入上传区、点击选择、或Ctrl+V粘贴。一次批量最多30张。' },
      { step: 2, titleEn: 'Set WebP Quality', titleZh: '设置WebP画质', descEn: '80% quality is the recommended default — excellent compression with no visible quality loss. Adjust higher for archival, lower for thumbnails.', descZh: '推荐80%画质——压缩率优秀且无可见质量损失。存档调高，缩略图调低。' },
      { step: 3, titleEn: 'Download WebP Files', titleZh: '下载WebP文件', descEn: 'Each JPG becomes a compact .webp file. Download individually or batch ZIP. Ready to deploy to your website.', descZh: '每张JPG变成紧凑的.webp文件。逐张下载或批量ZIP。准备好部署到你的网站。' },
    ],
    faqs: [
      { qEn: 'Why should I convert JPG to WebP?', qZh: '为什么要把JPG转成WebP？', aEn: 'WebP is Google\'s modern image format that delivers 25-35% smaller file sizes than JPEG at the same visual quality. For a website with 50 product images, switching from JPG to WebP can reduce total image payload from 5MB to 3.5MB — that is faster page loads, better Core Web Vitals scores, and improved SEO (Google uses page speed as a ranking factor). The format is supported by 96%+ of browsers worldwide, including all modern versions of Chrome, Firefox, Safari, and Edge.', aZh: 'WebP是Google的现代图像格式，同等视觉质量下比JPEG体积小25-35%。一个有50张产品图的网站，从JPG换WebP可将图片总负载从5MB降至3.5MB——页面加载更快、Core Web Vitals评分更好、SEO改善（Google将页面速度作为排名因素）。全球96%+浏览器支持WebP，包括所有现代版本的Chrome、Firefox、Safari和Edge。' },
      { qEn: 'Will converting JPG to WebP reduce image quality?', qZh: 'JPG转WebP会降低画质吗？', aEn: 'At the recommended 80% quality setting, the quality difference is invisible to the naked eye. WebP uses more advanced compression techniques than JPEG (better entropy coding, adaptive block partitioning, improved loop filtering), so it achieves better compression at the same perceived quality. For archival purposes, use 90-100% quality. For maximum web performance, 75-85% is ideal.', aZh: '推荐80%画质设置下，肉眼无法分辨画质差异。WebP使用比JPEG更先进的压缩技术（更好的熵编码、自适应块分割、改进的环路滤波），在同等感知画质下实现更优压缩率。存档用途选90-100%，最大化网页性能选75-85%。' },
      { qEn: 'Do all browsers support WebP?', qZh: '所有浏览器都支持WebP吗？', aEn: 'All modern browsers support WebP: Chrome (since v32, 2014), Firefox (v65, 2019), Safari (v14, 2020 for macOS; iOS 14+), Edge (v18, 2018). The only notable holdout is Internet Explorer (all versions). For legacy browser support, use the HTML <picture> element to serve WebP with a JPEG fallback — this is a one-line code change that covers 100% of users.', aZh: '所有现代浏览器支持WebP：Chrome（v32起，2014年）、Firefox（v65，2019年）、Safari（v14，2020年macOS；iOS 14+）、Edge（v18，2018年）。唯一显著不支持的是Internet Explorer（全部版本）。为兼容老旧浏览器，用HTML <picture>元素提供WebP+JPEG降级方案——一行代码改动覆盖100%用户。' },
      { qEn: 'Can I convert JPG to WebP in bulk?', qZh: '能批量把JPG转成WebP吗？', aEn: 'Yes — batch convert up to 30 JPGs to WebP at once for free (500 with Pro). All conversions run in parallel via Web Workers. Use "Download All" to get a single ZIP file. This is ideal for converting an entire WordPress media library, product image catalog, or blog post image folder to WebP.', aZh: '可以——免费版一次批量转最多30张JPG为WebP（Pro版500张）。所有转换通过Web Worker并行运行。点击"下载全部"获取单个ZIP文件。非常适合将整个WordPress媒体库、产品图目录或博客图片文件夹批量转为WebP。' },
      { qEn: 'What quality setting should I use for JPG to WebP?', qZh: 'JPG转WebP应该用什么画质设置？', aEn: '80% is the recommended sweet spot — excellent compression (typically 30-40% smaller than the original JPG) with no visible quality loss. For high-quality photography portfolios: 90%. For e-commerce product images: 80-85%. For blog post images and thumbnails: 75-80%. For maximum compression where some quality loss is acceptable: 60-70%. The live preview lets you judge quality before downloading.', aZh: '推荐80%为甜点值——压缩率优秀（通常比原JPG小30-40%）且无可见画质损失。高质量摄影作品集：90%。电商产品图：80-85%。博客配图和缩略图：75-80%。优先体积可接受部分画质损失：60-70%。实时预览让你在下载前判断画质。' },
      { qEn: 'Does WebP support transparency like PNG?', qZh: 'WebP像PNG一样支持透明吗？', aEn: 'Yes — WebP supports both lossy (VP8-based) and lossless (WebP lossless) modes, both with alpha channel transparency. This makes WebP a true universal replacement for JPEG, PNG, and GIF in a single format. When converting JPG to WebP, transparency is not a factor since JPEG doesn\'t have alpha channels — but if you later convert PNG or GIF to WebP, transparency is fully preserved.', aZh: '是的——WebP同时支持有损（基于VP8）和无损（WebP无损）两种模式，都支持alpha通道透明。这使WebP成为真正可替代JPEG、PNG和GIF的单一通用格式。JPG转WebP时透明不是问题因为JPEG没有alpha通道——但如果之后转PNG或GIF为WebP，透明通道会被完整保留。' },
      { qEn: 'Is the conversion really done in my browser? How can I verify?', qZh: '转换真的是在浏览器里完成的吗？怎么验证？', aEn: 'Yes — 100% browser-side. To verify: (1) Open Chrome DevTools → Network tab, (2) upload a JPG and convert to WebP, (3) observe that no network requests are made during conversion. You can also disconnect your internet after loading the page — the conversion still works perfectly. All processing uses the browser\'s built-in WebP encoder via Canvas API and Web Workers.', aZh: '是的——100%浏览器端。验证方法：(1) 打开Chrome DevTools→Network标签，(2) 上传JPG转WebP，(3) 观察转换过程中没有任何网络请求。你也可以加载页面后断网——转换仍然完美运行。所有处理使用浏览器内置WebP编码器通过Canvas API和Web Worker完成。' },
      { qEn: 'Can I use the converted WebP images in WordPress?', qZh: '转换后的WebP能在WordPress中用吗？', aEn: 'Yes — WordPress 5.8+ supports WebP uploads natively. For older WordPress versions, plugins like "WebP Express" or "Imagify" add WebP support. If your theme or page builder has issues, use the <picture> tag approach: serve WebP to modern browsers with a JPEG fallback for Safari 13 and older. CompressFast\'s bulk conversion is perfect for converting your entire WordPress media library.', aZh: '可以——WordPress 5.8+原生支持WebP上传。较旧版本可通过"WebP Express"或"Imagify"等插件添加WebP支持。如果你的主题或页面构建器有问题，用<picture>标签方式：向现代浏览器提供WebP，为Safari 13及更早版本提供JPEG降级。极速压图的批量转换非常适合转换整个WordPress媒体库。' },
    ],
    detailedGuideEn: `WebP is Google's next-generation image format, designed from the ground up to replace JPEG, PNG, and GIF with a single, more efficient format. It achieves 25-35% smaller file sizes than JPEG at equivalent quality by using more advanced compression techniques: better entropy coding, adaptive block partitioning, improved loop filtering, and support for both lossy and lossless modes in one format.

Converting your JPG images to WebP is one of the highest-ROI optimizations you can make for website performance:

1. Understanding the compression advantage — JPEG uses discrete cosine transform (DCT) with fixed 8×8 blocks. WebP uses adaptive block sizes (4×4 to 16×16) that better match image content. WebP also uses more advanced entropy coding (arithmetic coding vs Huffman) and a superior loop filter that reduces blocking artifacts at low bitrates. The result: same perceived quality at 25-35% smaller files.

2. Quality guidance — At 80% quality, WebP matches JPEG at ~92% quality visually but produces a 30-40% smaller file. This is the recommended default. For photography where every detail matters, 90-95% produces near-lossless results. For maximum web optimization where minor quality loss is acceptable, 65-75% can produce files 50%+ smaller than the original JPG.

3. Website integration — Serve WebP with a picture tag fallback. This one-line change delivers WebP to 96%+ of visitors and falls back to JPEG for the rest. Most CMS platforms (WordPress, Shopify, Webflow) now handle this automatically.

4. Bulk conversion strategy — Convert your entire image library in batches. Start with your highest-traffic pages (homepage, top blog posts, product listings) — these deliver the biggest impact. CompressFast's 30-image batch limit (500 for Pro) makes this practical without any server-side setup.

5. Privacy advantage — Server-based WebP converters require uploading your images to their servers. CompressFast runs the browser's native WebP encoder locally — your files never leave your device. This is critical for unreleased product photos, client work, and any proprietary images.`,
    detailedGuideZh: `WebP 是 Google 的次世代图像格式，从底层设计为用单一、更高效的格式替代 JPEG、PNG 和 GIF。它通过使用更先进的压缩技术——更好的熵编码、自适应块分割、改进的环路滤波，以及单一格式同时支持有损和无损模式——在同等质量下比 JPEG 减小 25-35% 的文件大小。

将 JPG 图片转为 WebP 是你能为网站性能做的投资回报率最高的优化之一：

1. 理解压缩优势——JPEG 使用固定 8×8 块的离散余弦变换（DCT）。WebP 使用自适应块大小（4×4 到 16×16），更好匹配图像内容。WebP 还使用更先进的熵编码（算术编码 vs 哈夫曼编码）和更优的环路滤波器，在低比特率下减少块效应。结果：同等感知画质，文件小 25-35%。

2. 画质指南——80% 画质下，WebP 视觉上匹配约 92% 的 JPEG 画质，但文件小 30-40%。这是推荐默认值。摄影作品每处细节都重要时，90-95% 产出近乎无损的结果。最大化网页优化可接受轻微画质损失时，65-75% 可产出比原 JPG 小 50%+ 的文件。

3. 网站集成——用 picture 标签降级方案提供 WebP。这一行代码向 96%+ 的访客提供 WebP，其余降级到 JPEG。大多数 CMS 平台（WordPress、Shopify、Webflow）现在自动处理此事。

4. 批量转换策略——分批转换整个图片库。从流量最高的页面开始（首页、热门博客文章、产品列表）——这些带来最大影响。极速压图的 30 张批量限制（Pro 版 500 张）让这变得切实可行，无需任何服务器端设置。

5. 隐私优势——基于服务器的 WebP 转换器要求上传图片到它们的服务器。极速压图在本地运行浏览器的原生 WebP 编码器——文件永不离开你的设备。这对未发布的产品照片、客户作品和任何专有图片至关重要。`,
    relatedTools: ['convert-to-webp', 'compress-jpeg', 'png-to-webp', 'png-to-jpg'],
  },

  'png-to-webp': {
    slug: 'png-to-webp',
    titleEn: 'Convert PNG to WebP Online Free — No Upload | CompressFast',
    titleZh: '在线PNG转WebP — 免费图片格式转换 | 极速压图',
    descriptionEn: 'Convert PNG to WebP online for free. 100% browser-based — no upload. Reduce file size by 40-80% while preserving transparency. Batch convert up to 30 PNG images at once.',
    descriptionZh: '免费在线PNG转WebP，100%浏览器本地处理。保留透明通道，体积减小40-80%。批量转换最多30张PNG。',
    keywords: ['png to webp', 'convert png to webp', 'png to webp converter', 'convert png to webp online free', 'png to webp transparent', 'png to webp free', 'png to webp bulk', 'png to webp keep transparency'],
    heroTitleEn: 'Convert PNG to WebP Online',
    heroTitleZh: '在线PNG转WebP',
    heroSubEn: 'Keep transparency, cut file size by 40-80%. No upload, batch 30, free forever.',
    heroSubZh: '保留透明通道，体积减小40-80%。无需上传、批量30张、永久免费。',
    targetFormat: 'webp',
    defaultSettings: { quality: 80, outputFormat: 'webp', speed: 5, stripMetadata: true },
    benefits: [
      { icon: '📉', titleEn: '40-80% Size Reduction', titleZh: '体积减小40-80%', descEn: 'PNG files are lossless but large. WebP preserves transparency while dramatically reducing file size — perfect for web use without quality sacrifice.', descZh: 'PNG无损但体积大。WebP保留透明通道的同时大幅减小文件——网页使用的完美选择，不牺牲画质。' },
      { icon: '🎨', titleEn: 'Transparency Preserved', titleZh: '保留透明通道', descEn: 'Unlike JPEG, WebP fully supports alpha channel transparency. Your logos, icons, and graphics stay transparent — just much smaller.', descZh: '与JPEG不同，WebP完整支持alpha通道透明。Logo、图标和图形保持透明——只是体积大幅减小。' },
      { icon: '⚡', titleEn: 'Lossless Option Available', titleZh: '可选无损模式', descEn: 'Enable lossless WebP mode for mathematically lossless compression. Still 26% smaller than PNG on average, with pixel-perfect output.', descZh: '开启无损WebP模式实现数学上无损的压缩。输出逐像素完美，仍比PNG平均小26%。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload PNG Files', titleZh: '上传PNG文件', descEn: 'Drag PNG images (including those with transparency) into the upload area. Batch up to 30 files. 10MB per file for free.', descZh: '将PNG图片（包括带透明的）拖入上传区。批量最多30张，免费每张10MB。' },
      { step: 2, titleEn: 'Choose WebP Settings', titleZh: '选择WebP设置', descEn: 'Select WebP output. For lossless (pixel-perfect), enable lossless mode. For smallest file size, use quality mode at 75-85%.', descZh: '选WebP输出。无损（逐像素完美）开启无损模式。最小体积使用画质模式75-85%。' },
      { step: 3, titleEn: 'Download WebP Files', titleZh: '下载WebP文件', descEn: 'Each PNG becomes a compact .webp file with transparency intact. Download individually or batch ZIP. Compare sizes with before/after slider.', descZh: '每张PNG变成紧凑的.webp文件，透明通道完整保留。逐张下载或批量ZIP。用前后对比滑块查看体积变化。' },
    ],
    faqs: [
      { qEn: 'Will converting PNG to WebP lose transparency?', qZh: 'PNG转WebP会丢失透明吗？', aEn: 'No — WebP fully supports alpha channel transparency in both lossy and lossless modes. Your transparent PNGs (logos, icons, UI elements) will remain transparent after conversion to WebP. This is a key advantage over JPEG, which does not support transparency at all. CompressFast preserves the alpha channel throughout the conversion process.', aZh: '不会——WebP在有损和无损两种模式下都完整支持alpha通道透明。带透明的PNG（Logo、图标、UI元素）转WebP后保持透明。这是相比JPEG（完全不支持透明）的关键优势。极速压图在整个转换过程中保留alpha通道。' },
      { qEn: 'How much smaller will my PNG files be after converting to WebP?', qZh: 'PNG转WebP后文件能小多少？', aEn: 'Results vary by image type: Photos and complex images: 40-60% reduction at 80% quality. Screenshots and UI: 50-70% reduction. Logos and icons with transparency: 60-80% reduction — this is where WebP really shines vs PNG. Lossless WebP: ~26% smaller than PNG on average (Google benchmark). For maximum reduction, combine resize + conversion: a 2000px logo PNG at 500KB resized to 600px and converted to WebP can become 25KB.', aZh: '效果因图片类型而异：照片和复杂图像：80%画质减小40-60%。截图和UI：减小50-70%。带透明的Logo和图标：减小60-80%——这是WebP相比PNG真正出彩的地方。无损WebP：平均比PNG小约26%（Google基准测试）。最大化缩减：尺寸调整+格式转换组合——一个2000px、500KB的Logo PNG调到600px并转WebP可变成25KB。' },
      { qEn: 'What is the difference between lossy and lossless WebP?', qZh: '有损和无损WebP有什么区别？', aEn: 'Lossy WebP: uses VP8-based compression (similar to WebM video). Adjustable quality 0-100%. For photos and web images. Much smaller files (40-80% reduction vs PNG). Lossless WebP: uses specialized techniques (spatial prediction, color indexing, entropy coding). No quality loss — pixel-perfect. For logos, text, and images that need exact preservation. Still ~26% smaller than PNG on average. CompressFast supports both modes — choose based on whether you need perfect preservation or maximum compression.', aZh: '有损WebP：使用基于VP8的压缩（类似WebM视频）。画质0-100%可调。适合照片和网页图片。文件更小（比PNG减小40-80%）。无损WebP：使用专门技术（空间预测、颜色索引、熵编码）。无画质损失——像素完美。适合Logo、文字和需要精确保留的图片。仍比PNG平均小约26%。极速压图两种模式都支持——根据需要完美保留还是最大化压缩来选择。' },
      { qEn: 'Can I batch convert multiple PNGs to WebP?', qZh: '能批量将多个PNG转成WebP吗？', aEn: 'Yes — convert up to 30 PNGs to WebP at once for free (500 with Pro). All files process in parallel in separate Web Workers. Download a single ZIP with all converted WebP files. Perfect for converting icon sets, design system assets, and website image libraries in bulk.', aZh: '可以——免费版一次批量转最多30张PNG为WebP（Pro版500张）。所有文件在独立Web Worker中并行处理。下载包含所有WebP的单个ZIP。非常适合批量转换图标集、设计系统资源和网站图片库。' },
      { qEn: 'When should I convert PNG to WebP instead of keeping PNG?', qZh: '什么时候该把PNG转WebP而不是保留PNG？', aEn: 'Convert to WebP for web use — your website will load faster, and visitors will not notice any quality difference. Keep as PNG when: (1) you need guaranteed universal compatibility including very old browsers, (2) you are sharing files with people who might not have modern software, (3) the PNG is already very small (< 10KB) — conversion overhead may not be worth it. For most web scenarios in 2026, WebP is the correct choice with a JPEG/PNG <picture> fallback for the last 4% of browsers.', aZh: '转WebP用于网页——网站加载更快，访客不会注意到任何画质差异。保留PNG当：(1) 需要确保包括非常老的浏览器在内的通用兼容性，(2) 与可能没有现代软件的人分享文件，(3) PNG已经非常小（<10KB）——转换开销可能不值得。2026年大多数网页场景，WebP搭配JPEG/PNG <picture>降级覆盖最后4%浏览器，是正确选择。' },
      { qEn: 'Does PNG to WebP conversion work on mobile?', qZh: 'PNG转WebP能在手机上用吗？', aEn: 'Yes — CompressFast works fully on mobile browsers (Safari iOS 14+, Chrome Android). The WebP encoder is built into all modern mobile browsers. You can convert PNG to WebP directly on your phone without installing any app. The responsive UI adapts to your screen size for easy tap-to-convert workflow.', aZh: '可以——极速压图在手机浏览器上完全可用（Safari iOS 14+、Chrome Android）。WebP编码器内置于所有现代手机浏览器。你可以直接在手机上转PNG为WebP，无需安装任何App。响应式UI适配屏幕，点击即可转换。' },
      { qEn: 'Can I use lossless WebP for archival purposes?', qZh: '无损WebP可以用于存档吗？', aEn: 'Yes — lossless WebP is mathematically lossless: every pixel of the decoded image matches the original PNG exactly. It produces files ~26% smaller than PNG on average (Google benchmark). This makes it a viable archival format. However, PNG has been around since 1996 and is universally supported by all software. WebP (2010) is newer and less universally supported in desktop image viewers and legacy software. For maximum long-term archival safety, keep an original PNG copy alongside the WebP version.', aZh: '可以——无损WebP在数学上是无损的：解码后的每个像素都与原PNG完全一致。它平均比PNG小约26%（Google基准测试）。这使其成为可行的存档格式。但PNG自1996年就存在，所有软件都支持。WebP（2010年）较新，桌面图片查看器和老旧软件的支持不够普遍。为最大化长期存档安全，保留一份PNG原件和WebP版本。' },
      { qEn: 'How does PNG→WebP compare to PNG→JPEG for photos?', qZh: '对于照片，PNG→WebP和PNG→JPEG哪个更好？', aEn: 'For photographs: WebP wins for web use — 25-35% smaller than JPEG at the same quality, plus transparency support. JPEG wins only when you need guaranteed compatibility with very old software or devices. For graphics with text: WebP wins decisively — JPEG creates fuzzy artifacts around text and sharp edges, while WebP (especially in lossless mode) keeps everything crisp. For images with transparency: WebP wins by default since JPEG does not support transparency at all. Bottom line: unless you specifically need JPEG for compatibility reasons, WebP is the better output format for PNG conversion in virtually all cases.', aZh: '对于照片：网页使用WebP赢——同等画质比JPEG小25-35%，还支持透明。JPEG仅在需要保证与非常老的软件或设备的兼容性时胜出。对于带文字的图形：WebP决定性胜出——JPEG在文字和锐利边缘周围产生模糊伪影，而WebP（特别是无损模式）保持一切清晰。对于带透明的图片：WebP默认赢，因为JPEG完全不支持透明。结论：除非你因兼容性原因特别需要JPEG，否则几乎在所有情况下WebP都是PNG转换的更优输出格式。' },
    ],
    detailedGuideEn: `PNG is the gold standard for lossless images — screenshots, logos, icons, UI elements, and any image with text or sharp edges. But PNG files are large. A single app screenshot can be 2-4MB. An icon set of 50 files can be 15MB. For web use, this is problematic: every kilobyte counts toward page load time, and Google uses page speed as a direct ranking factor.

Converting PNG to WebP is the single most impactful optimization for websites heavy on graphics and icons:

1. The transparency advantage — This is the killer feature: WebP supports alpha channel transparency in both lossy and lossless modes. Unlike converting PNG to JPEG (where transparent areas become white), converting to WebP preserves every transparent pixel. Your logo on a colored background, your icon overlaid on a hero image, your UI sprite sheet — all stay transparent while the file shrinks by 60-80%.

2. Lossless WebP — For the quality purists: enable lossless mode and the WebP encoder uses spatial prediction, color indexing, and advanced entropy coding to produce a file that is mathematically identical to the original PNG — every pixel matches — but 26% smaller on average. For archival copies, brand assets, and any image where "perfect" is non-negotiable, lossless WebP is the answer.

3. Lossy WebP — For web performance: at 80% quality, lossy WebP produces files 60-80% smaller than the original PNG, with transparency intact. The quality difference is invisible to the naked eye for most images. This is the mode to use for website images, email attachments, and any scenario where file size matters.

4. Batch conversion workflow — Drop 30 PNGs (icons, screenshots, logos), select WebP output, choose lossless or quality mode, click compress. All files convert in parallel. The result: a single ZIP of WebP files ready for your website, with transparency preserved and file sizes cut by 50-80%.

5. The bottom line — If you have a website with PNG images and you care about load time, converting to WebP is the highest-ROI change you can make. It requires no backend changes, no CDN configuration, and no server-side processing. Just convert, upload, and add a one-line <picture> fallback for legacy browsers.`,
    detailedGuideZh: `PNG 是无损图像的黄金标准——截图、Logo、图标、UI 元素以及任何包含文字或锐利边缘的图像。但 PNG 文件很大。一张应用截图就 2-4MB。一个 50 个文件的图标集可能 15MB。这对网页使用是问题：每 KB 都计入页面加载时间，Google 将页面速度作为直接排名因素。

将 PNG 转为 WebP 是对图形和图标密集型网站影响最大的单项优化：

1. 透明优势——这是杀手特性：WebP 在有损和无损两种模式下都支持 alpha 通道透明。与 PNG 转 JPEG（透明区域变白色）不同，转 WebP 保留每一个透明像素。彩色背景上的 Logo、英雄图上叠加的图标、UI 雪碧图——全部保持透明，同时文件缩水 60-80%。

2. 无损 WebP——为画质纯粹主义者：开启无损模式，WebP 编码器使用空间预测、颜色索引和先进的熵编码，产出与原 PNG 数学上完全一致的文件——每个像素都匹配——但平均小 26%。用于存档副本、品牌资产以及任何"完美"不可妥协的图像，无损 WebP 就是答案。

3. 有损 WebP——为网页性能：80% 画质下，有损 WebP 产出比原 PNG 小 60-80% 的文件，透明通道完好。对大多数图像而言，画质差异肉眼不可见。这是网站图片、邮件附件和任何在意文件大小的场景下使用的模式。

4. 批量转换工作流——拖入 30 张 PNG（图标、截图、Logo），选 WebP 输出，选择无损或有损模式，点压缩。所有文件并行转换。结果：一个包含 WebP 文件的 ZIP，透明保留、文件大小缩减 50-80%，准备好用于你的网站。

5. 底线——如果你有一个包含 PNG 图片的网站且在意加载时间，转 WebP 是你能做的投资回报率最高的改变。它不需要后端改动、不需要 CDN 配置、不需要服务器端处理。只需转换、上传，再加一行 <picture> 降级代码覆盖老旧浏览器即可。`,
    relatedTools: ['convert-to-webp', 'compress-png', 'jpg-to-webp', 'png-to-jpg'],
  },

  'svg-to-png': {
    slug: 'svg-to-png',
    titleEn: 'Convert SVG to PNG Online Free — No Upload | CompressFast',
    titleZh: '在线SVG转PNG — 免费矢量转位图 | 极速压图',
    descriptionEn: 'Convert SVG to PNG online for free. Rasterize vector graphics to PNG at any resolution. No upload, 100% browser-based. Batch convert up to 30 SVG files. Set custom output dimensions — perfect for icons, logos, and web graphics.',
    descriptionZh: '免费在线SVG转PNG，矢量图光栅化为任意分辨率PNG。无需上传，100%浏览器本地处理。批量转换最多30个SVG文件。自定义输出尺寸——适合图标、Logo和网页图形。',
    keywords: ['svg to png', 'convert svg to png', 'svg to png converter', 'svg to png online', 'convert svg to png free', 'svg to png high resolution', 'svg to transparent png', 'svg image to png', 'export svg as png'],
    heroTitleEn: 'Convert SVG to PNG Online',
    heroTitleZh: '在线SVG转PNG',
    heroSubEn: 'Vector to raster at any resolution. No upload, batch 30, free forever — crisp PNG output.',
    heroSubZh: '矢量转位图、任意分辨率。无需上传、批量30个、永久免费——清晰PNG输出。',
    targetFormat: 'png',
    defaultSettings: { quality: 100, outputFormat: 'png', speed: 5, lossless: true, stripMetadata: false },
    benefits: [
      { icon: '📐', titleEn: 'Any Output Resolution', titleZh: '任意输出分辨率', descEn: 'Set custom width and height for PNG output. 512px for app icons, 1200px for hero images, or export at 2×/3× for retina displays. Vector scaling means no quality loss at any size.', descZh: '自定义PNG输出宽高。512px做应用图标、1200px做Hero图、或2倍/3倍导出适配Retina屏。矢量缩放意味着任何尺寸都没有画质损失。' },
      { icon: '🎨', titleEn: 'Transparency Preserved', titleZh: '保留透明背景', descEn: 'SVG transparency is fully preserved in the PNG output. Your logo on a transparent background exports perfectly — no white box around it.', descZh: 'SVG透明背景完整保留在PNG输出中。透明背景的Logo完美导出——不会出现白底方块。' },
      { icon: '🔒', titleEn: 'Private Vector Processing', titleZh: '私密矢量处理', descEn: 'Your SVG source code never leaves your browser. Safe for proprietary icons, brand assets, and unreleased design work.', descZh: 'SVG源码不会离开你的浏览器。适合私有图标、品牌资产和未发布的设计稿。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload SVG Files', titleZh: '上传SVG文件', descEn: 'Drag SVG files into the upload area, click to browse, or paste. Batch up to 30 files. Supports .svg and .svgz.', descZh: '将SVG文件拖入上传区、点击选择或粘贴。批量最多30个。支持.svg和.svgz。' },
      { step: 2, titleEn: 'Set PNG Dimensions', titleZh: '设置PNG尺寸', descEn: 'Specify output width and height in pixels. Use the resize controls to set exact dimensions. Keep ratio locked for proportional scaling.', descZh: '指定输出像素宽高。使用尺寸调整控件设置精确尺寸。锁定比例保持等比缩放。' },
      { step: 3, titleEn: 'Download PNG Files', titleZh: '下载PNG文件', descEn: 'Each SVG renders to a crisp .png file at your specified resolution. Download individually or batch ZIP.', descZh: '每个SVG以你指定的分辨率渲染为清晰的.png文件。逐张下载或批量ZIP。' },
    ],
    faqs: [
      { qEn: 'Why convert SVG to PNG instead of using SVG directly?', qZh: '为什么要把SVG转PNG而不是直接用SVG？', aEn: 'SVG is perfect for websites — it is scalable, tiny, and editable. But many platforms and use cases require PNG: (1) social media — Facebook/Twitter/Instagram do not support SVG uploads for profile pictures or posts, (2) app stores — Apple App Store and Google Play require PNG icons, (3) document embedding — Word, PowerPoint, and PDF documents handle PNG more reliably than SVG, (4) email signatures — most email clients strip SVG, (5) printing — professional print services expect raster formats like PNG or TIFF. Converting SVG to PNG at the right resolution bridges this gap.', aZh: 'SVG非常适合网站——可缩放、极小、可编辑。但很多平台和场景需要PNG：(1) 社交媒体——Facebook/Twitter/Instagram不支持SVG上传头像或帖子，(2) 应用商店——Apple App Store和Google Play要求PNG图标，(3) 文档嵌入——Word、PowerPoint、PDF文档处理PNG比SVG更可靠，(4) 邮件签名——大多数邮件客户端会剥离SVG，(5) 打印——专业打印服务期望PNG或TIFF等位图格式。以正确分辨率将SVG转PNG弥合了这一差距。' },
      { qEn: 'Will converting SVG to PNG lose quality?', qZh: 'SVG转PNG会损失画质吗？', aEn: 'At the correct output resolution: no visible quality loss. SVG is a vector format — it describes shapes mathematically and can be rendered at any size without pixelation. When converting to PNG, the SVG is rasterized (drawn as pixels) at your specified dimensions. As long as you set the output size equal to or larger than your intended display size, the result will be crisp and sharp. For retina/HiDPI displays, export at 2× or 3× the display size (e.g., export a 100px icon at 300px for a 3× retina screen).', aZh: '在正确的输出分辨率下：没有可见画质损失。SVG是矢量格式——用数学描述形状，可以任意尺寸渲染而不出现像素化。转PNG时，SVG按你指定的尺寸光栅化（绘制为像素）。只要输出尺寸等于或大于目标显示尺寸，结果就会清晰锐利。对于Retina/HiDPI屏幕，以显示尺寸的2倍或3倍导出（如100px图标以300px导出适配3倍Retina屏）。' },
      { qEn: 'What resolution should I use for SVG to PNG conversion?', qZh: 'SVG转PNG应该用什么分辨率？', aEn: 'It depends on your use case: App icons: 1024×1024 (Apple requires this for App Store submission). Favicon: 32×32, 64×64, or 128×128. Social media profile: 400×400 to 800×800. Website hero/logo: 2× the CSS display size (if displayed at 200px, export at 400px). Print: 300 DPI at the physical print size. General rule: export at 2× the intended display size for retina screens. CompressFast\'s resize controls let you set exact pixel dimensions.', aZh: '取决于用途：应用图标：1024×1024（Apple App Store提交要求）。网站图标：32×32、64×64或128×128。社交媒体头像：400×400到800×800。网站Hero/Logo：CSS显示尺寸的2倍（如显示200px，导出400px）。打印：300 DPI对应物理打印尺寸。通用规则：以目标显示尺寸的2倍导出适配Retina屏。极速压图的尺寸调整控件可设置精确像素尺寸。' },
      { qEn: 'Can I batch convert multiple SVGs to PNG?', qZh: '能批量把多个SVG转成PNG吗？', aEn: 'Yes — convert up to 30 SVGs to PNG at once for free (500 with Pro). All SVGs are rendered at the same specified dimensions. Use "Download All" to get a ZIP of all PNGs. Perfect for converting icon sets, logo variations, or illustration packs from vector to raster format.', aZh: '可以——免费版一次批量转最多30个SVG为PNG（Pro版500个）。所有SVG以相同指定尺寸渲染。点击"下载全部"获取所有PNG的ZIP。非常适合将图标集、Logo变体或插画包从矢量批量转为位图。' },
      { qEn: 'Does the conversion handle complex SVGs with gradients and filters?', qZh: '转换能处理带渐变和滤镜的复杂SVG吗？', aEn: 'Yes — the browser\'s native SVG renderer handles gradients (linear, radial, mesh), filters (blur, drop shadow, color matrix), patterns, clipping paths, masks, and CSS animations (static first frame). However, some advanced SVG features may render differently across browsers: (1) SVG fonts — fall back to system fonts, (2) external CSS — must be inline for conversion, (3) JavaScript-based animations — only the initial state is captured. For best results, ensure your SVG uses inline styles and standard features.', aZh: '可以——浏览器原生SVG渲染器处理渐变（线性、径向、网格）、滤镜（模糊、投影、颜色矩阵）、图案、裁剪路径、蒙版和CSS动画（静态首帧）。但某些高级SVG特性可能跨浏览器渲染不同：(1) SVG字体——回退到系统字体，(2) 外部CSS——必须内联才能转换，(3) 基于JS的动画——只捕获初始状态。为最佳结果，确保SVG使用内联样式和标准特性。' },
      { qEn: 'Will the PNG output have a transparent background?', qZh: '输出的PNG会有透明背景吗？', aEn: 'Yes — if your SVG has no background rectangle, the PNG output will have a transparent background. This is preserved because PNG supports alpha channel transparency. If your SVG has a solid color background (a <rect> filling the viewBox), that background will be rendered in the PNG. To get a transparent PNG, remove any background rectangle from your SVG before conversion.', aZh: '会——如果SVG没有背景矩形，PNG输出将具有透明背景。PNG支持alpha通道透明，透明背景会被保留。如果SVG有纯色背景（填充viewBox的<rect>），该背景会渲染到PNG中。要获得透明PNG，转换前从SVG中删除背景矩形。' },
      { qEn: 'Can I compress the PNG after SVG conversion?', qZh: 'SVG转PNG后能压缩PNG吗？', aEn: 'Yes — the quality slider and lossless mode work during SVG→PNG conversion. Enable lossless mode to apply oxipng WASM optimization: your PNG will be mathematically lossless (pixel-perfect to the rendered SVG) but 20-60% smaller than a naive PNG save. This is especially effective for SVGs with large flat-color areas (logos, icons) where oxipng can aggressively optimize the PNG compression.', aZh: '可以——画质滑块和无损模式在SVG→PNG转换过程中生效。开启无损模式应用oxipng WASM优化：PNG在数学上无损（与渲染的SVG逐像素一致）但比朴素PNG保存小20-60%。这对有大面积纯色的SVG（Logo、图标）特别有效，oxipng可以积极优化PNG压缩。' },
      { qEn: 'Is there a size limit for SVG files?', qZh: 'SVG文件有大小限制吗？', aEn: 'Free users can convert SVG files up to 10MB each. This is generous — most SVGs are 1-100KB. Only extremely complex SVGs with thousands of paths or embedded raster images approach the MB range. If your SVG is very large, consider simplifying it in a vector editor before conversion. The output PNG size depends on your chosen resolution, not the input SVG size.', aZh: '免费用户每个SVG最大10MB。这很宽松——大多数SVG只有1-100KB。只有包含数千条路径或嵌入位图的极其复杂的SVG才会接近MB级别。如果SVG非常大，建议在矢量编辑器中先简化再转换。输出的PNG大小取决于你选择的分辨率，而非输入SVG的大小。' },
    ],
    detailedGuideEn: `SVG (Scalable Vector Graphics) is the ideal format for logos, icons, illustrations, and any graphics defined by shapes rather than pixels. It is infinitely scalable, editable with any text editor, and typically very small. But SVG is not universally supported — many platforms, apps, and workflows require PNG, the ubiquitous raster format.

CompressFast's SVG to PNG converter bridges the vector-to-raster gap entirely in your browser:

1. Resolution control — This is the key advantage of vector graphics: you choose the output resolution. Need a 1024px app icon? Set width to 1024. Need a 64px favicon? Set width to 64. The SVG renders crisply at any size because it is resolution-independent. CompressFast's resize controls let you dial in exact pixel dimensions, with aspect ratio locking to prevent distortion.

2. Browser-native SVG rendering — The SVG is rendered using the browser's own SVG engine — the same one that displays SVGs on web pages. This means excellent standards compliance and consistent rendering. Complex features like gradients, opacity, transforms, and clipping paths are all supported.

3. Transparency preservation — If your SVG has no background (common for logos and icons), the PNG output will have a transparent background. PNG fully supports alpha channel transparency, so your logo stays versatile — place it on any colored background without a white box.

4. PNG optimization — After rendering, enable lossless mode to compress the PNG with oxipng WASM. This produces a pixel-perfect PNG that is 20-60% smaller than a direct save. For web use, you can also apply lossy compression via the quality slider for even smaller files.

5. Common use cases — (a) App store submissions: export SVG icons at 1024×1024 for Apple/Google review. (b) Social media: convert vector logos to PNG for profile pictures and page headers. (c) Document embedding: rasterize SVGs for reliable display in Word, PowerPoint, and PDFs. (d) Email: convert vector graphics to PNG for email client compatibility. (e) Printing: export at 300 DPI resolution for professional print services.

The SVG→PNG workflow is essential for any designer or developer who works with vector graphics and needs raster outputs for platforms that do not support SVG. CompressFast makes it free, private, and resolution-flexible.`,
    detailedGuideZh: `SVG（可缩放矢量图形）是Logo、图标、插画和任何由形状而非像素定义的图形的理想格式。它无限可缩放、可用任何文本编辑器编辑、通常非常小。但SVG并非普遍支持——许多平台、应用和工作流需要PNG，无处不在的位图格式。

极速压图的SVG转PNG转换器完全在浏览器中弥合矢量到位图的差距：

1. 分辨率控制——这是矢量图形的关键优势：你选择输出分辨率。需要1024px应用图标？设宽度1024。需要64px网站图标？设宽度64。SVG以任意尺寸清晰渲染，因为它是分辨率无关的。极速压图的尺寸调整控件可设定精确像素尺寸，宽高比锁定防止变形。

2. 浏览器原生SVG渲染——SVG使用浏览器自己的SVG引擎渲染——与网页上显示SVG的是同一个引擎。这意味着优秀的标准合规性和一致的渲染效果。渐变、透明度、变换和裁剪路径等复杂特性全部支持。

3. 透明保留——如果SVG没有背景（Logo和图标常见），PNG输出将有透明背景。PNG完整支持alpha通道透明，Logo保持多用途——放在任何颜色背景上都不会出现白框。

4. PNG优化——渲染后，开启无损模式使用oxipng WASM压缩PNG。这产出逐像素完美的PNG，比直接保存小20-60%。用于网页还可通过画质滑块应用有损压缩以获取更小文件。

5. 常见用例——(a) 应用商店提交：以1024×1024导出SVG图标供Apple/Google审核。(b) 社交媒体：将矢量Logo转PNG用于头像和页面头图。(c) 文档嵌入：光栅化SVG以便在Word、PowerPoint和PDF中可靠显示。(d) 邮件：将矢量图形转PNG以确保邮件客户端兼容。(e) 打印：以300 DPI分辨率导出供专业打印服务使用。

SVG→PNG工作流对任何使用矢量图形但需要为不支持SVG的平台提供位图输出的设计师或开发者来说都是必不可少的。极速压图让它免费、私密且分辨率灵活。`,
    relatedTools: ['compress-svg', 'compress-png', 'convert-jpg-to-png', 'resize-image'],
  },

  'webp-to-jpg': {
    slug: 'webp-to-jpg',
    titleEn: 'Convert WebP to JPG Online Free — No Upload | CompressFast',
    titleZh: '在线WebP转JPG — 免费WebP格式转换 | 极速压图',
    descriptionEn: 'Convert WebP to JPG online for free. No upload — 100% browser-based. Batch convert up to 30 WebP images to JPEG at once. Perfect for opening WebP files in older software, sharing, and uploading to platforms that require JPEG.',
    descriptionZh: '免费在线WebP转JPG，无需上传，100%浏览器本地转换。批量转换最多30张WebP为JPEG。完美解决WebP图片打不开、不兼容的问题。',
    keywords: ['webp to jpg', 'convert webp to jpg', 'webp to jpg converter', 'webp to jpeg', 'convert webp to jpg online free', 'webp to jpg free', 'change webp to jpg', 'webp to jpg high quality', 'webp image to jpg', 'save webp as jpg'],
    heroTitleEn: 'Convert WebP to JPG Online',
    heroTitleZh: '在线WebP转JPG',
    heroSubEn: 'Turn WebP images into universally-compatible JPEGs. No upload, batch 30, free forever — works offline too.',
    heroSubZh: 'WebP秒转JPEG，兼容所有设备和软件。无需上传、批量30张、永久免费。',
    targetFormat: 'jpeg',
    defaultSettings: { quality: 92, outputFormat: 'jpeg', speed: 5, stripMetadata: true },
    benefits: [
      { icon: '🌍', titleEn: 'Universal Compatibility', titleZh: '通用兼容', descEn: 'WebP is great for the web but many apps, image viewers, and older software cannot open it. Convert to JPG and your images work everywhere — every device, every app, every platform.', descZh: 'WebP在网页上很好用，但很多应用、图片查看器和老旧软件打不开。转成JPG，你的图片在所有设备、所有应用、所有平台上都能打开。' },
      { icon: '📦', titleEn: 'Compact + Compatible', titleZh: '小体积+广兼容', descEn: 'WebP is already small. Converting to JPG at 90% quality keeps excellent visuals while adding universal compatibility. File size stays reasonable — typically 2-5× smaller than a direct-from-PNG JPG.', descZh: 'WebP本身已经很小。以90%画质转JPG保持出色视觉效果的同时获得通用兼容性。文件体积依然合理——通常比PNG直转JPG小2-5倍。' },
      { icon: '🔒', titleEn: 'Private & Local', titleZh: '隐私本地处理', descEn: 'Your WebP files never leave your device. All conversion happens in your browser via Web Workers — no upload to any server, no privacy risk.', descZh: 'WebP文件不离开你的设备。所有转换在浏览器中通过Web Worker完成——不上传任何服务器，无隐私风险。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload WebP Files', titleZh: '上传WebP文件', descEn: 'Drag WebP images into the upload area, click to browse, or Ctrl+V paste. Up to 30 files at once for free.', descZh: '将WebP图片拖入上传区、点击选择、或Ctrl+V粘贴。免费一次最多30张。' },
      { step: 2, titleEn: 'Adjust Quality (Optional)', titleZh: '调整画质（可选）', descEn: 'Default 90% quality produces excellent results. Adjust the slider if you need smaller files or maximum quality output.', descZh: '默认90%画质效果出色。如需更小文件或最高画质输出，调节滑块即可。' },
      { step: 3, titleEn: 'Download as JPG', titleZh: '下载JPG文件', descEn: 'Each WebP becomes a standard .jpg file. Download individually or batch as ZIP. Ready to use anywhere.', descZh: '每张WebP变成标准.jpg文件。逐张下载或批量ZIP。随时随地可用。' },
    ],
    faqs: [
      { qEn: 'Why do I need to convert WebP to JPG?', qZh: '为什么需要把WebP转成JPG？', aEn: 'WebP is a modern image format by Google that offers excellent compression — 25-35% smaller than JPEG at the same quality. However, many applications and platforms still do not support WebP: (1) older photo editing software like Photoshop CS6, (2) some email clients that block WebP attachments, (3) e-commerce platforms like eBay and Etsy that require JPEG, (4) document software like older Word and PowerPoint versions, (5) some social media platforms during upload. Converting to JPG ensures your images work everywhere, not just in modern browsers.', aZh: 'WebP是Google开发的现代图片格式，压缩效果出色——相同画质比JPEG小25-35%。但很多应用和平台仍不支持WebP：(1) 老旧图片编辑软件如Photoshop CS6，(2) 某些邮件客户端屏蔽WebP附件，(3) 电商平台如eBay和Etsy要求JPEG，(4) 文档软件如旧版Word和PowerPoint，(5) 某些社交媒体上传限制。转成JPG确保图片在所有地方都能打开，不止是现代浏览器。' },
      { qEn: 'Does converting WebP to JPG lose quality?', qZh: 'WebP转JPG会损失画质吗？', aEn: 'Yes — both WebP and JPEG are lossy formats, so re-encoding involves generation loss. However, at 90-95% quality, the additional loss is negligible and invisible to the naked eye. WebP\'s advantage is achieving the same quality at a smaller size — so converting a high-quality WebP to JPG at 90% produces a file that looks nearly identical to the original. If you need the best possible quality, use 100% quality setting (though this produces a larger file). For archival purposes, keep the original WebP.', aZh: '会——WebP和JPEG都是有损格式，重新编码会产生代际损失。但90-95%画质下，额外损失微乎其微，肉眼无法察觉。WebP的优势是相同画质体积更小——所以将高质量WebP以90%转JPG，产出文件几乎与原始一致。如需最佳画质，使用100%设置（不过文件会更大）。存档用途建议保留原WebP。' },
      { qEn: 'Can I batch convert multiple WebP files to JPG?', qZh: '能批量把多个WebP转成JPG吗？', aEn: 'Yes — convert up to 30 WebP images to JPG in one batch for free (500 with Pro). All files are processed in parallel via Web Workers for maximum speed. Use "Download All" to get a single ZIP containing all converted JPGs with their original filenames. Perfect for converting an entire folder of downloaded WebP images at once.', aZh: '可以——免费版一次批量转换最多30张WebP为JPG（Pro版500张）。所有文件通过Web Worker并行处理以达到最高速度。点击"下载全部"获取包含所有JPG的单个ZIP，保留原始文件名。非常适合一次性转换整个下载的WebP文件夹。' },
      { qEn: 'What is the best quality setting for WebP to JPG conversion?', qZh: 'WebP转JPG用什么画质设置最好？', aEn: '90% is the recommended default — it produces visually lossless results with reasonable file size. For photos: 85-95% depending on how critical fine detail is. For screenshots and UI: 80-90% works well. For thumbnails: 75-85% is sufficient. The "sweet spot" is typically 88-92% where you get great quality and good compression. CompressFast shows you real-time size estimates as you adjust.', aZh: '推荐默认90%——视觉无损效果，文件大小合理。照片：85-95%，取决于精细细节的重要程度。截图和UI：80-90%效果很好。缩略图：75-85%足够。最佳区间通常是88-92%，画质出色且压缩良好。极速压图在调节时实时显示大小估算。' },
      { qEn: 'Will I lose transparency when converting WebP to JPG?', qZh: 'WebP转JPG会丢失透明吗？', aEn: 'Yes — JPEG does not support transparency. If your WebP has transparent areas (common for logos, icons, and product cutouts), the transparent regions will be filled with white (#FFFFFF) in the output JPG. CompressFast warns you when converting images with transparency. If you need to preserve transparency, convert WebP to PNG instead — use our WebP to PNG converter. For photos and screenshots (which rarely have transparency), this is not an issue.', aZh: '会——JPEG不支持透明。如果WebP有透明区域（Logo、图标、产品抠图常见），透明区域在输出JPG中会被填充为白色(#FFFFFF)。极速压图在转换含透明度的图片时会显示警告。如需保留透明，请将WebP转PNG——使用我们的WebP转PNG工具。对于照片和截图（很少有透明），这完全不是问题。' },
      { qEn: 'Can I resize images while converting WebP to JPG?', qZh: 'WebP转JPG的同时能调整尺寸吗？', aEn: 'Yes — CompressFast combines resize and format conversion in one step. Set target dimensions in pixels or use percentage presets (50%, 75%, 1080p, 720p). Resizing during conversion is especially useful for: (1) product photos for e-commerce platforms that require specific dimensions, (2) email attachments where smaller dimensions = smaller file, (3) social media posts with platform-specific size requirements. The combined resize+convert produces the smallest possible JPG.', aZh: '可以——极速压图一步完成尺寸调整和格式转换。设置目标像素尺寸或使用百分比预设（50%、75%、1080p、720p）。转换同时调整尺寸特别适用于：(1) 电商平台要求特定尺寸的产品图，(2) 邮件附件——尺寸越小文件越小，(3) 社交媒体帖子有平台特定尺寸要求。调整尺寸+转换结合产出最小的JPG。' },
      { qEn: 'Why do websites serve WebP images instead of JPG?', qZh: '为什么网站要提供WebP而不是JPG？', aEn: 'Websites use WebP because it is 25-35% smaller than JPEG at equivalent quality — meaning faster page loads, lower bandwidth costs, and better SEO rankings (Google prioritizes fast sites). Over 96% of browsers now support WebP. However, when you right-click and "Save Image As..." from a website, you often get a .webp file that your local photo viewer cannot open. That is exactly when you need a WebP to JPG converter. CompressFast solves this friction: download WebP from any site, convert to JPG instantly.', aZh: '网站使用WebP因为它比JPEG同等画质小25-35%——意味着更快的页面加载、更低的带宽成本和更好的SEO排名（Google优先快速站点）。超过96%的浏览器现在支持WebP。但当你从网站右键"图片另存为…"时，下载的往往是.webp文件，本地图片查看器打不开。这正是你需要WebP转JPG的时候。极速压图解决这个痛点：从任何网站下载WebP，秒转JPG。' },
      { qEn: 'Is WebP to JPG conversion free? Are there any limits?', qZh: 'WebP转JPG免费吗？有什么限制？', aEn: 'Completely free. Free tier: up to 30 images per batch (20 for single-format), 10MB per file, 400 compressions per month. Pro ($24.99 lifetime): 500 images per batch, 50MB per file, no monthly limits, AVIF output, custom presets, priority support. No account required for free use — just open the site and start converting.', aZh: '完全免费。免费版：每批最多30张（单格式20张），单文件10MB，每月400次。Pro版（$24.99买断）：每批500张，单文件50MB，无月度限制，支持AVIF输出和自定义预设，优先支持。免费使用无需注册——打开网站即可开始转换。' },
    ],
    detailedGuideEn: `WebP is a modern image format developed by Google that delivers superior compression: 25-35% smaller file sizes than JPEG at equivalent visual quality. It supports both lossy and lossless compression, transparency (alpha channel), and even animation — making it a technically superior replacement for JPEG, PNG, and GIF simultaneously. Since 2020, WebP has been supported by all major browsers (Chrome, Firefox, Safari, Edge), and over 96% of web users can view WebP images.

But there is a catch: despite near-universal browser support, WebP files are still difficult to open outside a browser. Windows Photos app needed a codec until recently. Adobe Photoshop only added WebP support in 2022 (version 23.2). Older software, many mobile gallery apps, government portals, e-commerce platforms, and document tools still require JPEG or PNG. When you save an image from the web, you often get a .webp file that your local applications cannot open.

CompressFast's WebP to JPG converter bridges this gap — turning modern, efficient WebP files into universally-compatible JPEGs, instantly and privately:

1. Browser-native decoding — WebP images are decoded by the browser's own WebP decoder, the same one that displays WebP images on websites. This ensures perfect rendering of all WebP features: lossy, lossless, alpha channel, and even animated WebP (first frame). No third-party libraries, no quality surprises.

2. Quality-controlled JPEG encoding — After decoding, the image is re-encoded as JPEG with your chosen quality setting (10-100%). At 88-92%, the visual difference from the original WebP is imperceptible while the file remains reasonably sized. At 100%, you get the highest possible JPEG quality at the cost of a larger file.

3. Transparency handling — Since JPEG lacks alpha channel support, transparent areas in WebP images (transferred from PNG lossless WebP) are filled with white (#FFFFFF). CompressFast detects and warns about transparency before conversion. For images where transparency is critical, our WebP to PNG converter preserves the alpha channel.

4. Combined resize + convert — Many WebP images from the web are high-resolution (2000px+). Resize them during conversion for even smaller output: a 2000px WebP converted to 1200px JPG at 90% quality produces a file ready for immediate use on websites, social media, or email.

5. Batch workflow — Drop up to 30 WebP files, select JPEG output at 90% quality, click compress. All files convert in parallel. Download a ZIP of ready-to-use JPGs, each correctly named and stripped of metadata.

Common scenarios: (a) You saved product photos from a supplier website — they are all .webp and your e-commerce platform requires JPEG. (b) You downloaded images from a Google Doc or Slides export — they came as WebP. (c) You received WebP attachments in email and your image viewer cannot open them. (d) You are preparing images for a platform (social media, marketplace, document) that does not support WebP. In every case, CompressFast converts them in seconds, no upload required.`,
    detailedGuideZh: `WebP是Google开发的现代图片格式，提供卓越的压缩效果：同等视觉质量下比JPEG文件小25-35%。它同时支持有损和无损压缩、透明度（alpha通道）、甚至动画——使其在技术上可以同时替代JPEG、PNG和GIF。自2020年以来，WebP已被所有主流浏览器（Chrome、Firefox、Safari、Edge）支持，超过96%的网页用户可以查看WebP图片。

但有一个致命伤：尽管浏览器几乎普遍支持，WebP文件在浏览器之外仍然难以打开。Windows照片应用直到最近才需要编解码器。Adobe Photoshop在2022年（版本23.2）才添加WebP支持。老旧软件、许多手机相册应用、政府门户、电商平台和文档工具仍然需要JPEG或PNG。当你从网页保存图片时，得到的往往是.webp文件，本地应用打不开。

极速压图的WebP转JPG转换器弥合了这个鸿沟——将现代高效的WebP文件即时、私密地转换为通用兼容的JPEG：

1. 浏览器原生解码——WebP图片由浏览器自己的WebP解码器解码，与网页上显示WebP图片的是同一个引擎。这确保所有WebP特性的完美渲染：有损、无损、alpha通道，甚至动画WebP（首帧）。无需第三方库，画质无意外。

2. 画质可控的JPEG编码——解码后，图片以你选择的画质设置（10-100%）重新编码为JPEG。88-92%画质下，与原WebP的视觉差异肉眼无法察觉，文件大小保持合理。100%设置获得最高JPEG画质，但文件更大。

3. 透明度处理——由于JPEG不支持alpha通道，WebP图片中的透明区域（从PNG无损WebP转移而来）会被填充为白色(#FFFFFF)。极速压图在转换前检测并警告透明度。对于透明度至关重要的图片，我们的WebP转PNG转换器保留alpha通道。

4. 调整尺寸+格式转换一步完成——网页下载的WebP图片很多是高分辨率的（2000px+）。转换时调整尺寸获得更小输出：2000px的WebP调到1200px并以90%画质转JPG，产出的文件即可直接用于网页、社交媒体或邮件。

5. 批量工作流——拖入最多30张WebP，选择90%画质JPEG输出，点击压缩。所有文件并行转换。下载包含即用JPG的ZIP，每个文件命名正确且元数据已清除。

常见场景：(a) 你从供应商网站保存了产品图——全是.webp，但电商平台要求JPEG。(b) 从Google文档或幻灯片导出下载了图片——结果是WebP。(c) 邮件收到WebP附件，图片查看器打不开。(d) 正在为不支持WebP的平台（社交媒体、电商平台、文档）准备图片。所有情况，极速压图秒速转换，无需上传。`,
    relatedTools: ['convert-to-webp', 'webp-to-png', 'compress-jpeg', 'resize-image'],
  },
}

export const TOOL_SLUGS = Object.keys(TOOLS)
