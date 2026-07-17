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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
    relatedTools: ['convert-to-webp', 'convert-jpg-to-png', 'compress-png'],
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

  'compress-svg': {
    slug: 'compress-svg',
    titleEn: 'Compress SVG Online Free — Reduce SVG File Size | CompressFast',
    titleZh: '在线SVG压缩 — 免费减小SVG文件体积 | 极速压图',
    descriptionEn: 'Compress SVG files online for free. 100% browser-based text optimization — remove comments, whitespace, and metadata without changing how your SVG looks. Batch support.',
    descriptionZh: '免费在线压缩SVG文件，100%浏览器本地文本优化——清除注释、空白和元数据，不改变SVG外观。支持批量处理。',
    keywords: ['compress svg', 'svg compressor', 'compress svg online', 'reduce svg size', 'svg minifier', 'svg optimizer', 'minify svg', 'optimize svg for web', 'free svg compressor'],
    heroTitleEn: 'Compress SVG Files Online',
    heroTitleZh: '在线压缩SVG文件',
    heroSubEn: 'Free, private, lossless. Remove bloat from your SVGs — text-based optimization right in your browser.',
    heroSubZh: '免费、隐私安全、无损。清除SVG中的冗余内容——浏览器内文本级优化。',
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
    ],
    relatedTools: ['compress-images', 'compress-png', 'convert-to-webp'],
  },
}

export const TOOL_SLUGS = Object.keys(TOOLS)
