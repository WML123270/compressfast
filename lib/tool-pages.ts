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
    lossless?: boolean
    stripMetadata?: boolean
  }
  benefits: { icon: string; titleEn: string; titleZh: string; descEn: string; descZh: string }[]
  howTo: { step: number; titleEn: string; titleZh: string; descEn: string; descZh: string }[]
  faqs: { qEn: string; qZh: string; aEn: string; aZh: string }[]
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
    ],
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
    ],
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
    ],
    relatedTools: ['compress-png', 'compress-jpeg', 'compress-images'],
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
    ],
    relatedTools: ['compress-png', 'compress-jpeg', 'convert-to-webp'],
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
    ],
    relatedTools: ['compress-images', 'compress-png', 'compress-jpeg'],
  },
}

export const TOOL_SLUGS = Object.keys(TOOLS)
