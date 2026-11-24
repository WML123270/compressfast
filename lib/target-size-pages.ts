import type { ToolPageData } from './tool-pages'

/**
 * 目标大小压缩落地页 — compress-to-20kb / 50kb / 100kb / 200kb / 500kb
 *
 * 这些页面复用主压缩器，只把 targetKB 预设好，靠搜索意图（"compress image to 100kb"）
 * 获取长尾流量。内容按目标大小区分使用场景，避免五页内容雷同。
 * hidden: true —— 不在首页工具网格里重复占位，但仍进 sitemap / 动态路由 / 站内互链。
 */

interface TargetCopy {
  kb: number
  titleEn: string
  titleZh: string
  descriptionEn: string
  descriptionZh: string
  keywords: string[]
  heroSubEn: string
  heroSubZh: string
  benefits: ToolPageData['benefits']
  howTo: ToolPageData['howTo']
  faqs: ToolPageData['faqs']
  guideEn: string
  guideZh: string
  relatedTools: string[]
}

function build(c: TargetCopy): ToolPageData {
  return {
    slug: `compress-to-${c.kb}kb`,
    titleEn: c.titleEn,
    titleZh: c.titleZh,
    descriptionEn: c.descriptionEn,
    descriptionZh: c.descriptionZh,
    keywords: c.keywords,
    heroTitleEn: `Compress Image to ${c.kb}KB`,
    heroTitleZh: `把图片压缩到 ${c.kb}KB`,
    heroSubEn: c.heroSubEn,
    heroSubZh: c.heroSubZh,
    targetFormat: 'original',
    hidden: true,
    defaultSettings: {
      targetKB: c.kb,
      quality: 70,
      speed: 3,
      outputFormat: 'original',
      stripMetadata: true,
    },
    benefits: c.benefits,
    howTo: c.howTo,
    faqs: c.faqs,
    detailedGuideEn: c.guideEn,
    detailedGuideZh: c.guideZh,
    relatedTools: c.relatedTools,
  }
}

export const TARGET_SIZE_TOOLS: Record<string, ToolPageData> = {
  'compress-to-20kb': build({
    kb: 20,
    titleEn: 'Compress Image to 20KB Online Free — Exact Target Size | CompressFast',
    titleZh: '图片压缩到20KB — 免费在线精确压缩 | 极速压图',
    descriptionEn:
      'Compress any image to 20KB online for free. The 20KB target is preset — the compressor automatically searches quality and scale in your browser. No upload, batch support.',
    descriptionZh:
      '免费在线把图片压缩到20KB。目标大小已预设，压缩器在浏览器内自动搜索最佳画质与缩放。文件不上传，支持批量。',
    keywords: [
      'compress image to 20kb', 'compress jpg to 20kb', 'compress png to 20kb',
      'reduce image size to 20kb', 'photo compressor 20kb', 'image size reducer 20kb',
      'compress image to exact size',
    ],
    heroSubEn: '20KB is already set as the target — drop your image and the compressor searches for the closest result. Free, local, no upload.',
    heroSubZh: '已预设 20KB 目标——拖入图片，压缩器会自动逼近目标。免费、本地处理、不上传。',
    benefits: [
      { icon: '🎯', titleEn: 'Preset 20KB Target', titleZh: '预设 20KB 目标', descEn: 'The target box already says 20. No more guessing which quality slider value lands at 20KB — the compressor searches for you.', descZh: '目标输入框已填好 20KB，不用再凭感觉拖画质滑块，压缩时自动寻找最接近的结果。' },
      { icon: '🪶', titleEn: 'Built for Tiny Limits', titleZh: '专为小体积限制', descEn: 'Perfect for avatar uploads, email attachments, forum limits and legacy forms that reject anything above 20KB.', descZh: '专为头像上传、邮件附件、论坛限制和老旧表单等「超过 20KB 就不收」的场景准备。' },
      { icon: '🔒', titleEn: '100% Local & Private', titleZh: '完全本地处理', descEn: 'Files are processed in your browser and never uploaded. You can disconnect from the internet and it still works.', descZh: '文件只在浏览器内处理，从不上传；页面加载后断网也能继续使用。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop Your Image', titleZh: '拖入图片', descEn: 'Drop a JPG, PNG or WebP, click to browse, or paste with Ctrl+V. The 20KB target is already set for this page.', descZh: '拖入 JPG、PNG 或 WebP，点击选择或 Ctrl+V 粘贴。本页已自动设好 20KB 目标。' },
      { step: 2, titleEn: 'Click Compress', titleZh: '点击压缩', descEn: 'The tool tries several quality levels and scales, then keeps the result closest to 20KB. It never inflates a small original.', descZh: '工具会尝试多档画质与缩放，保留最接近 20KB 的结果，也不会把原本更小的文件硬撑大。' },
      { step: 3, titleEn: 'Download', titleZh: '下载', descEn: 'Download one file or all as a ZIP. If it still exceeds 20KB, resize the canvas or switch output to JPEG/WebP.', descZh: '下载单张或打包 ZIP。如果仍超过 20KB，可先调整尺寸，或把输出改为 JPEG/WebP。' },
    ],
    faqs: [
      { qEn: 'Can an image really be compressed to exactly 20KB?', qZh: '真的能精确压缩到 20KB 吗？', aEn: 'The compressor aims for the closest result, usually within 10–15%. It will not pad a smaller file up to 20KB — smaller is fine, because upload forms only care that the file is at or below the limit. For very detailed photos, reducing the dimensions is the most reliable way to guarantee 20KB.', aZh: '压缩器会尽量贴近目标，通常误差在 10%–15% 以内。它不会把更小的文件硬凑到 20KB——「不超过 20KB」就满足绝大多数上传要求。对细节很多的照片，先降低尺寸是保证 20KB 最可靠的办法。' },
      { qEn: 'Will a 20KB image look bad?', qZh: '20KB 的图片会很难看吗？', aEn: 'It depends on the dimensions. A 200×200 avatar at 20KB looks perfectly clean. A 4000px photo squeezed into 20KB will lose detail. If quality matters, use the Resize controls first, then let the 20KB target finish the job.', aZh: '取决于尺寸。200×200 的头像压到 20KB 依然清晰；4000 像素的大照片硬压到 20KB 会明显损失细节。在意画质的话，先用「调整尺寸」缩小，再让 20KB 目标收尾。' },
      { qEn: 'Does PNG compression to 20KB work?', qZh: 'PNG 能压缩到 20KB 吗？', aEn: 'Yes. PNG output uses color-bit reduction plus oxipng; screenshots, logos and icons compress very well. Photos are usually smaller as JPEG or WebP. If you need transparent areas, keep PNG or choose WebP.', aZh: '可以。PNG 输出会走减色 + oxipng，截图、Logo 和图标效果很好；照片通常用 JPEG 或 WebP 更小。需要透明背景时保留 PNG 或选择 WebP。' },
      { qEn: 'The result is still over 20KB. What should I do?', qZh: '压缩后还是超过 20KB 怎么办？', aEn: 'Open the Resize section and lower the width or height, or switch the output format to WebP/JPEG. Fewer pixels is the most reliable way to meet a strict size cap. A 600–800px photo almost always fits in 20KB at a usable quality.', aZh: '打开「调整尺寸」降低宽高，或把输出格式改为 WebP/JPEG。像素越少越容易达到严格上限——600–800 像素的照片通常都能在可用画质下压进 20KB。' },
      { qEn: 'Are my images uploaded to a server?', qZh: '图片会上传到服务器吗？', aEn: 'Never. Everything runs in Web Workers inside your browser. No server receives the file, and the page keeps working offline after it loads.', aZh: '不会。全部在浏览器的 Web Worker 中完成，没有任何服务器收到文件；页面加载后断网也能继续使用。' },
      { qEn: 'Is the 20KB compressor free?', qZh: '这个 20KB 压缩工具免费吗？', aEn: 'Yes. Free users can compress up to 30 images per batch. Pro removes batch limits and adds AVIF output — a one-time purchase, not a subscription.', aZh: '免费。免费用户每批最多 30 张。Pro 版解除批量限制并支持 AVIF 输出，一次性买断，不是订阅制。' },
    ],
    guideEn: `20KB is one of the tightest size limits you will meet online. It shows up in avatar uploads, old forum rules, email gateways, school portals and embedded devices. The good news: 20KB is almost always achievable — you just have to attack it in the right order.

The reliable strategy is resize first, format second, target third. A 3000×2000 phone photo has millions of pixels; no encoder can fit that into 20KB without visible damage. But the same photo at 600×400 has only 240,000 pixels, and 20KB is plenty. Open the Resize section, set a sensible width (avatars are often 200–400px, thumbnails 400–800px), then let the preset 20KB target do the rest.

The compressor searches automatically. Internally it tries several quality levels and two scale levels, measures the encoded byte size each time, and keeps the result closest to 20KB. It stops early once it lands within about 10% of the target, so a single image usually finishes in a couple of seconds. If the original is already smaller than 20KB, it will not be inflated.

Format matters at this size. JPEG and WebP are far more efficient for photographs; PNG is better for screenshots, flat graphics and transparency, because PNG keeps edges and text crisp. A transparent logo should stay PNG or WebP so the background does not turn into a white block.

Everything runs locally in your browser: no upload, no queue, no server seeing your file. You can process a batch of 30 images, check the before/after sizes, and download them individually or as one ZIP. If one stubborn image refuses to reach 20KB, lower its dimensions slightly — that is the single most effective lever.`,
    guideZh: `20KB 是网上最苛刻的图片体积限制之一：头像上传、老论坛规则、邮件网关、学校报名系统、嵌入式设备都可能卡在这个数字上。好消息是，20KB 几乎总能做到——关键是用对顺序。

可靠的策略是：先调尺寸，再选格式，最后交给目标大小。一张 3000×2000 的手机照片有几百万像素，再好的编码器也无法在 20KB 里保持清晰；但同一张照片缩到 600×400 只有 24 万像素，20KB 完全够用。打开「调整尺寸」，设置合理宽度（头像常见 200–400 像素，缩略图 400–800 像素），剩下交给预设的 20KB 目标。

压缩器会自动搜索。内部会尝试多档画质和两档缩放，每次都测量编码后的字节数，保留最接近 20KB 的结果；进入目标约 10% 范围就提前停止，单张通常几秒完成。如果原图本来就小于 20KB，不会被硬撑大。

这个体积下格式很关键。照片用 JPEG 和 WebP 效率高得多；截图、扁平图形和需要透明背景的图用 PNG 更合适，因为 PNG 能保持文字和边缘锐利。透明 Logo 建议保留 PNG 或 WebP，否则背景会变成白块。

所有处理都在浏览器本地完成：不上传、不排队、没有服务器能看到你的文件。可以一次处理 30 张，查看压缩前后体积，逐张下载或打包成 ZIP。如果某张图怎么都到不了 20KB，把尺寸再降一点——这是最有效的杠杆。`,
    relatedTools: ['compress-to-50kb', 'compress-to-100kb', 'resize-image', 'convert-to-webp'],
  }),

  'compress-to-50kb': build({
    kb: 50,
    titleEn: 'Compress Image to 50KB Online Free — Preset Target Size | CompressFast',
    titleZh: '图片压缩到50KB — 免费在线精确压缩 | 极速压图',
    descriptionEn:
      'Compress JPG, PNG or WebP to 50KB online for free. The target size is preset and everything runs in your browser — no upload. Ideal for registration forms and photo uploads.',
    descriptionZh:
      '免费在线把 JPG、PNG、WebP 压缩到50KB。目标大小已预设，全程浏览器本地处理、不上传。适合报名表、证件照等上传场景。',
    keywords: [
      'compress image to 50kb', 'compress jpg to 50kb', 'compress photo to 50kb',
      'reduce image size to 50kb', 'image compressor 50kb', 'photo size reducer 50kb',
      'compress png to 50kb',
    ],
    heroSubEn: 'The 50KB target is preset. Drop a photo, let the compressor find the best quality, and download a file that fits the upload limit.',
    heroSubZh: '50KB 目标已预设。拖入照片，压缩器自动寻找最佳画质，下载即可满足上传限制。',
    benefits: [
      { icon: '🎯', titleEn: 'Preset 50KB Target', titleZh: '预设 50KB 目标', descEn: 'No slider guessing. The compressor iterates quality and scale until it lands at or just under 50KB.', descZh: '不用反复试滑块，压缩器自动迭代画质与缩放，落到 50KB 或略低于 50KB。' },
      { icon: '⚖️', titleEn: 'Quality You Can Use', titleZh: '可用画质', descEn: '50KB leaves enough room for clear 600–1000px photos — ideal for registration forms and profile uploads.', descZh: '50KB 足够让 600–1000 像素的照片保持清晰，适合报名表和头像/证件照上传。' },
      { icon: '🔒', titleEn: 'No Upload, No Account', titleZh: '不上传、免注册', descEn: 'Processing happens in your browser. No signup, no file leaves your device, no watermark.', descZh: '全程在浏览器内处理，无需注册，文件不离开设备，也不加水印。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Add Your Photo', titleZh: '添加照片', descEn: 'Drop the file, click to browse, or paste it. JPG, PNG, WebP, HEIC, AVIF and more are supported.', descZh: '拖入文件、点击选择或直接粘贴。支持 JPG、PNG、WebP、HEIC、AVIF 等格式。' },
      { step: 2, titleEn: 'Compress to 50KB', titleZh: '压缩到 50KB', descEn: 'Click Compress All. The preset target drives the encoder — no manual quality tuning required.', descZh: '点击「压缩全部」。预设目标会自动驱动编码器，无需手动调画质。' },
      { step: 3, titleEn: 'Download & Upload', titleZh: '下载并上传', descEn: 'Check the resulting size in the list, then download. If it is still slightly over, switch to WebP or trim the dimensions.', descZh: '在列表里确认压缩后体积再下载。如果仍略超，可改 WebP 或稍微降低尺寸。' },
    ],
    faqs: [
      { qEn: 'Why is 50KB such a common upload limit?', qZh: '为什么 50KB 这么常见？', aEn: '50KB balances storage cost and legibility for small profile photos. Job portals, exam registrations, visa forms and internal HR systems often cap uploads at 50KB because they display the image in a small box anyway.', aZh: '对于小尺寸头像或证件照，50KB 在存储成本和可辨识度之间比较平衡。招聘网站、考试报名、签证表单和内部人事系统常把上限定在 50KB，因为它们本来也只用小尺寸展示。' },
      { qEn: 'Will the photo still be clear at 50KB?', qZh: '50KB 的照片还清晰吗？', aEn: 'For a typical 600–1000px portrait, yes — 50KB is enough to keep facial features and text legible. Very large photos should be resized first; otherwise the compressor has to sacrifice more detail to reach the limit.', aZh: '对于常见的 600–1000 像素证件照/头像，清晰度足够，五官和文字都能辨认。特别大的照片建议先缩小尺寸，否则压缩器为了达到上限会牺牲更多细节。' },
      { qEn: 'Can I choose the output format?', qZh: '可以选输出格式吗？', aEn: 'Yes. By default the original format is kept. For photos, JPEG or WebP usually delivers the best quality at 50KB; PNG is better for screenshots and graphics with text. Transparent images should stay PNG or WebP.', aZh: '可以，默认保持原格式。照片用 JPEG 或 WebP 在 50KB 下画质通常最好；截图和带文字的图形用 PNG 更清晰；需要透明背景则保留 PNG 或 WebP。' },
      { qEn: 'It is still bigger than 50KB after compression. Why?', qZh: '压缩后还是大于 50KB，为什么？', aEn: 'The encoder picks the closest result, but a very large or very detailed image may not reach the target without scaling. Reduce width/height in the Resize section or switch to WebP — either usually closes the gap immediately.', aZh: '编码器会选择最接近的结果，但尺寸特别大或细节特别多的图片，不缩放可能到不了目标。在「调整尺寸」里降低宽高，或改用 WebP，通常立刻就能压到 50KB 以内。' },
      { qEn: 'Does it work on a phone?', qZh: '手机上能用吗？', aEn: 'Yes. The page is responsive and the compression runs on the phone itself. No app install is needed, and the file never leaves the device.', aZh: '可以。页面适配手机，压缩在手机本地完成，无需安装 App，文件不会离开设备。' },
      { qEn: 'Is there a batch limit?', qZh: '有批量限制吗？', aEn: 'Free users can process up to 30 images per batch. The 50KB target applies to every file in the batch, and all results can be downloaded as one ZIP.', aZh: '免费用户每批最多 30 张。50KB 目标会应用到批次里的每张图，所有结果可以打包成一个 ZIP 下载。' },
    ],
    guideEn: `50KB is the sweet spot for portrait and registration uploads. It is small enough for almost any form, yet large enough to keep a 600–1000px photo clear. That is why job portals, exam systems and HR tools so often ask for "a photo under 50KB".

This page pre-fills 50KB as the compression target. You do not need to understand quality sliders: drop the photo, click Compress All, and the encoder tries several quality levels plus two scale levels, keeping whichever result is closest to 50KB. If the original is already under 50KB, it stays untouched.

Three levers decide whether the result looks good. The first is dimensions. A passport-style portrait is usually 295×413 or 358×441 pixels; at that size 50KB is generous and the image will look sharp. The second is format. JPEG and WebP are efficient for faces and photographs; PNG is better for screenshots and text. The third is content — busy backgrounds compress worse than plain ones, so a clean backdrop helps.

A practical workflow for a form upload: check the required pixel dimensions first, use the Resize controls to match them exactly, choose JPEG or WebP, then compress with the 50KB target. The size display tells you the final byte count before you download, so you can confirm it fits before submitting the form.

Privacy is built in. The file is decoded and re-encoded inside your browser using Web Workers — no upload request is made, no account is needed, and no watermark is added. You can process several photos in one batch, compare before/after sizes, and download them individually or as a single ZIP.`,
    guideZh: `50KB 是头像和报名照上传的「甜点区间」：小到几乎所有表单都能接受，又大到足以让 600–1000 像素的人像保持清晰。这也是招聘网站、考试系统和人事工具经常要求「照片小于 50KB」的原因。

本页已经把 50KB 预设为目标大小。你不需要理解画质滑块：拖入照片、点击「压缩全部」，编码器会自动尝试多档画质和两档缩放，保留最接近 50KB 的结果。如果原图本来就小于 50KB，则保持不动。

三个因素决定最终观感。第一是尺寸：标准证件照常见 295×413 或 358×441 像素，这个尺寸下 50KB 很宽裕，画质会很清晰。第二是格式：人脸和照片用 JPEG、WebP 效率高；截图和文字用 PNG 更锐利。第三是画面内容：背景越花越难压，干净背景更容易压小。

实际报名上传可以这样操作：先确认要求的像素尺寸，用「调整尺寸」精确匹配，选择 JPEG 或 WebP，再用 50KB 目标压缩。列表里会显示压缩后的最终字节数，下载前就能确认是否满足表单要求。

隐私是内建的：文件在浏览器里用 Web Worker 解码、再编码，不发起上传请求，不需要账号，也不加水印。可以一次处理多张照片、对比压缩前后体积，逐张下载或打包成 ZIP。`,
    relatedTools: ['compress-to-20kb', 'compress-to-100kb', 'resize-image', 'compress-jpeg'],
  }),

  'compress-to-100kb': build({
    kb: 100,
    titleEn: 'Compress Image to 100KB Online Free — Preset Target | CompressFast',
    titleZh: '图片压缩到100KB — 免费在线精确压缩 | 极速压图',
    descriptionEn:
      'Compress any image to 100KB online for free. The 100KB target is preset and all processing runs locally in your browser — no upload. Great for website uploads, resumes and forms.',
    descriptionZh:
      '免费在线把图片压缩到100KB。目标大小已预设，全部在浏览器本地处理、不上传。适合网站上传、简历照片和各类表单。',
    keywords: [
      'compress image to 100kb', 'compress jpg to 100kb', 'compress photo to 100kb',
      'reduce image size to 100kb', 'image compressor 100kb', 'compress png to 100kb',
      '100kb image converter',
    ],
    heroSubEn: '100KB is preset as the target. Drop an image and the compressor finds the best quality that fits — no upload, no signup.',
    heroSubZh: '已预设 100KB 目标。拖入图片，压缩器自动找到最合适的画质，不上传、免注册。',
    benefits: [
      { icon: '🎯', titleEn: 'Preset 100KB Target', titleZh: '预设 100KB 目标', descEn: 'The most requested size limit, already configured. No trial and error with quality sliders.', descZh: '最常见的上传上限已经配好，不用一档档试画质滑块。' },
      { icon: '🖼️', titleEn: 'Good Quality at 100KB', titleZh: '100KB 画质依然好', descEn: 'At 800–1200px, a 100KB JPEG or WebP is usually indistinguishable from the original on screen.', descZh: '在 800–1200 像素下，100KB 的 JPEG/WebP 在屏幕上通常与原图看不出差别。' },
      { icon: '🔒', titleEn: 'Private by Design', titleZh: '隐私优先', descEn: 'Files never leave your device. Processing is local, works offline, and leaves no server-side copy.', descZh: '文件从不离开设备，本地处理、支持离线，服务器端不会留下任何副本。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop the Image', titleZh: '拖入图片', descEn: 'Drag in a photo, screenshot or graphic — JPG, PNG, WebP, HEIC, AVIF and more are supported.', descZh: '拖入照片、截图或图形，支持 JPG、PNG、WebP、HEIC、AVIF 等常见格式。' },
      { step: 2, titleEn: 'Compress to 100KB', titleZh: '压缩到 100KB', descEn: 'Click Compress All. The preset target drives quality and scale automatically.', descZh: '点击「压缩全部」，预设目标会自动调整画质与缩放。' },
      { step: 3, titleEn: 'Download', titleZh: '下载', descEn: 'Confirm the final size, then download. If needed, switch to WebP for an extra 20–35% reduction.', descZh: '确认最终体积后下载。需要更小时可改 WebP，通常还能再小 20%–35%。' },
    ],
    faqs: [
      { qEn: 'Why do so many sites ask for images under 100KB?', qZh: '为什么很多网站要求图片小于 100KB？', aEn: '100KB is a practical compromise: pages load fast, storage stays cheap, and the image is still detailed enough for a profile photo, product thumbnail or document illustration. It is the most common single limit for web uploads.', aZh: '100KB 是实用折中：页面加载快、存储成本低，同时图片仍足够细腻，能胜任头像、商品缩略图或文档插图。它是网页上传最常见的单一上限。' },
      { qEn: 'Can a 100KB image look original?', qZh: '100KB 的图片能和原图一样吗？', aEn: 'At screen sizes, often yes. An 800–1200px photo encoded as JPEG or WebP at 100KB is usually visually identical. If you keep a 4000px photo, the encoder must discard much more detail; resizing first gives a better-looking 100KB file.', aZh: '在屏幕尺寸下经常可以。800–1200 像素的照片用 JPEG 或 WebP 压到 100KB，视觉上通常与原图一致。如果保持 4000 像素，编码器只能丢弃更多细节；先缩小尺寸得到的 100KB 文件反而更耐看。' },
      { qEn: 'Does this tool hit exactly 100KB?', qZh: '能精确压到 100KB 吗？', aEn: 'It searches for the closest result and normally lands within 10–15% of 100KB. It never pads a smaller original. Upload forms accept anything at or below the cap, so a 92KB or 105KB result is fine in practice.', aZh: '工具会寻找最接近的结果，通常落在 100KB 的 10%–15% 范围内，也不会把更小的原图撑大。上传表单只要求「不超过上限」，所以 92KB 或 105KB 在实际上都没问题。' },
      { qEn: 'Which format should I choose?', qZh: '应该选什么格式？', aEn: 'For photos, JPEG or WebP. For screenshots, logos and text-heavy graphics, PNG keeps edges sharp, while WebP often gives a smaller file with transparency. AVIF (Pro) can go even smaller at the same visual quality.', aZh: '照片选 JPEG 或 WebP；截图、Logo 和文字较多的图形选 PNG 更锐利，需要透明背景时 WebP 往往更小。Pro 版的 AVIF 在相同观感下还能更小。' },
      { qEn: 'Can I compress several images at once?', qZh: '可以批量压缩吗？', aEn: 'Yes — up to 30 images per batch for free. Every image gets the same 100KB target, and you can download all results as one ZIP.', aZh: '可以，免费版每批最多 30 张。每张图都会应用 100KB 目标，全部结果可以打包成一个 ZIP 下载。' },
      { qEn: 'Are my files uploaded?', qZh: '文件会上传吗？', aEn: 'No. The compressor runs inside your browser with Web Workers and WebAssembly. No file is sent to a server, and the page works offline after loading.', aZh: '不会。压缩器通过 Web Worker 和 WebAssembly 在浏览器内运行，文件不会发送到服务器，页面加载后断网也能用。' },
    ],
    guideEn: `100KB is the most common image upload limit on the web — resumes, profile photos, government forms, CMS uploads and email attachments all use it. It is also a comfortable target: at reasonable dimensions, a 100KB image looks just as good as the original.

This page pre-fills 100KB as the compression target. Drop an image and the encoder automatically tries four quality levels and two scale levels, measuring the actual byte size each time. It stops once it is within roughly 10% of the target and keeps the closest result. A small original is never inflated.

The biggest quality lever is dimensions, not the encoder. A 1000×750 photo at 100KB is crisp. A 4000×3000 photo forced to 100KB loses fine texture because there are simply too many pixels for the byte budget. If you can, set the width in the Resize section to the size the destination actually displays — 800px for a blog image, 1200px for a profile or product page — and the 100KB target will have room to preserve detail.

Format is the second lever. JPEG and WebP are built for photographs. PNG is better for screenshots, charts and transparent graphics, but a photographic PNG at 100KB may look softer than the same image as JPEG. WebP is often the best compromise: small files, transparency support and wide browser compatibility. AVIF output is available with Pro for another 20–40% reduction.

The workflow is fast: drop, compress, check the before/after size, download. Batch up to 30 images, each hitting the same target, then grab everything as a ZIP. Nothing is uploaded, no account is required, and files can be processed entirely offline after the page loads.`,
    guideZh: `100KB 是网页上最常见的图片上传上限——简历、头像、政府表单、CMS 后台上传、邮件附件都在用它。它也是一个比较舒服的目标：在合理尺寸下，100KB 的图片观感几乎和原图一样。

本页已预设 100KB 为目标大小。拖入图片后，编码器会自动尝试四档画质和两档缩放，每次测量真实字节数；进入目标约 10% 范围就停止，并保留最接近的结果。原本更小的图片不会被撑大。

影响画质最大的因素不是编码器，而是尺寸。1000×750 的照片压到 100KB 很清晰；4000×3000 的照片硬压到 100KB 会丢失纹理，因为像素数量远超字节预算。如果可以，先在「调整尺寸」里设成目标页面实际展示的宽度——博客配图 800 像素、个人主页或商品页 1200 像素——100KB 就有余量保留细节。

第二个因素是格式。照片用 JPEG 和 WebP；截图、图表和透明图形用 PNG，但照片类 PNG 在 100KB 下往往比 JPEG 更糊。WebP 通常是最佳折中：体积小、支持透明、浏览器兼容性广。Pro 版的 AVIF 输出还能再小 20%–40%。

流程很简单：拖入、压缩、看前后体积、下载。可以一次批量 30 张，每张都按同一目标压缩，最后打包 ZIP。全程不上传、不需要账号，页面加载后断网也能完成处理。`,
    relatedTools: ['compress-to-50kb', 'compress-to-200kb', 'compress-images', 'convert-to-webp'],
  }),

  'compress-to-200kb': build({
    kb: 200,
    titleEn: 'Compress Image to 200KB Online Free — Preset Target Size | CompressFast',
    titleZh: '图片压缩到200KB — 免费在线精确压缩 | 极速压图',
    descriptionEn:
      'Compress images to 200KB online for free. A preset target finds the best quality and scale automatically, entirely in your browser — no upload. Ideal for blogs, listings and newsletters.',
    descriptionZh:
      '免费在线把图片压缩到200KB。预设目标自动寻找最佳画质与缩放，全程浏览器本地处理、不上传。适合博客配图、商品图和邮件配图。',
    keywords: [
      'compress image to 200kb', 'compress jpg to 200kb', 'reduce photo to 200kb',
      'image compressor 200kb', 'compress png to 200kb', 'photo size reducer 200kb',
      'compress image to 200kb online',
    ],
    heroSubEn: '200KB is preset. Drop your image and the compressor balances quality and size automatically — local, private, no upload.',
    heroSubZh: '已预设 200KB。拖入图片，压缩器自动平衡画质与体积——本地处理、隐私安全、不上传。',
    benefits: [
      { icon: '🎯', titleEn: 'Preset 200KB Target', titleZh: '预设 200KB 目标', descEn: 'Skip the guesswork — 200KB is already configured, so you can compress and move on.', descZh: '不用猜——200KB 已经配置好，拖入压缩即可。' },
      { icon: '🖼️', titleEn: 'Near-Original Look', titleZh: '接近原图观感', descEn: '200KB leaves room for detailed 1200–1600px images while keeping pages and emails fast.', descZh: '200KB 足以容纳 1200–1600 像素的细节图，同时让页面和邮件保持轻快。' },
      { icon: '🔒', titleEn: 'Nothing Uploaded', titleZh: '不上传任何文件', descEn: 'All work happens on your device in Web Workers. No server copy, no account, no watermark.', descZh: '全部在你的设备上用 Web Worker 完成，服务器无副本、免账号、无水印。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop an Image', titleZh: '拖入图片', descEn: 'Add a JPG, PNG, WebP or other common format. The 200KB target is already active.', descZh: '添加 JPG、PNG、WebP 或其他常见格式，200KB 目标已自动生效。' },
      { step: 2, titleEn: 'Compress', titleZh: '压缩', descEn: 'Click Compress All. The encoder searches quality and scale to land near 200KB.', descZh: '点击「压缩全部」，编码器会搜索画质与缩放，尽量贴近 200KB。' },
      { step: 3, titleEn: 'Download', titleZh: '下载', descEn: 'Review the final size and download. Batch results can be exported as one ZIP.', descZh: '确认最终体积后下载，批量结果可一键导出 ZIP。' },
    ],
    faqs: [
      { qEn: 'What are typical uses for a 200KB limit?', qZh: '200KB 通常用在哪些地方？', aEn: 'Blog and article images, marketplace listings, newsletter graphics, school assignments and portfolio thumbnails. 200KB keeps pages fast while allowing much more detail than 50KB or 100KB.', aZh: '博客和文章配图、二手交易商品图、邮件通讯配图、课程作业、作品集缩略图。200KB 既能保持页面轻快，又比 50KB/100KB 容纳更多细节。' },
      { qEn: 'Will the image look sharp at 200KB?', qZh: '200KB 的图片会清晰吗？', aEn: 'Usually yes. At 1200–1600px, JPEG or WebP at 200KB is close to visually lossless for most content. Busy textures and gradients compress less efficiently, so very detailed images may show slight softness.', aZh: '通常很清晰。1200–1600 像素的 JPEG/WebP 在 200KB 下，对大多数内容接近视觉无损。纹理复杂、渐变较多的图片压缩效率低一些，可能略有柔化。' },
      { qEn: 'Can I keep PNG transparency?', qZh: '可以保留 PNG 透明背景吗？', aEn: 'Yes — keep PNG or choose WebP. Both support transparency, and WebP usually produces a smaller file at the same visual quality. JPEG will fill transparent areas with a solid color.', aZh: '可以，保留 PNG 或选择 WebP。两者都支持透明，WebP 在相同观感下通常更小。JPEG 会用纯色填充透明区域。' },
      { qEn: 'It did not reach 200KB. Why?', qZh: '没有压到 200KB，是什么原因？', aEn: 'If the original is already below 200KB, it is intentionally left as is. If a huge image cannot reach 200KB, reduce its dimensions or switch the output to WebP/JPEG.', aZh: '如果原图本来小于 200KB，会保持不变。如果大图到不了 200KB，可降低尺寸或把输出改为 WebP/JPEG。' },
      { qEn: 'Can I process a whole folder?', qZh: '可以处理整个文件夹吗？', aEn: 'You can select multiple files at once — up to 30 per batch for free. Each is compressed to the 200KB target and can be downloaded together as a ZIP.', aZh: '可以一次选择多张，免费版每批最多 30 张。每张都按 200KB 目标压缩，可打包成 ZIP 一起下载。' },
      { qEn: 'Is it really free and private?', qZh: '真的免费且隐私安全吗？', aEn: 'Yes. There is no charge and no upload. The compressor runs locally, so even sensitive images never leave your device.', aZh: '是的。不收费，也不上传。压缩在本地完成，敏感图片同样不会离开你的设备。' },
    ],
    guideEn: `200KB is a generous but still useful limit. It is enough for sharp 1200–1600px images, which makes it a natural fit for blog illustrations, marketplace product shots, newsletter banners and portfolio thumbnails. Pages stay fast without looking cheaply compressed.

This page pre-configures 200KB as the target. The compressor tries several quality levels and two scale levels, measures the output each time, and keeps the closest result. Because 200KB is relatively roomy, the encoder usually finds a quality setting where the image looks clean rather than heavily compressed.

Two choices do most of the work. First, dimensions: a 1600×1000 photo at 200KB is a good balance. A 6000px original forced into 200KB will lose texture. Set the Resize width to what the page actually needs — 1200px for a blog hero, 1600px for a marketplace listing — and the quality stays high. Second, format: JPEG and WebP are ideal for photos; PNG or WebP for graphics with transparency or crisp text.

A useful pattern for content work: prepare a batch of images, drop them all at once, compress to the 200KB target, then compare the before/after sizes in the list. If one image misses the target, it is almost always because it is too large in pixels — resize it and compress again. Everything is local, so you can keep working offline and there is no queue.

No account, no watermark, no upload. Files are decoded and re-encoded inside your browser, which also means the tool is safe for client work and unreleased product photos.`,
    guideZh: `200KB 是一个宽裕但依然有用的上限。它足以容纳清晰的 1200–1600 像素图片，因此很适合博客插图、电商/二手商品图、邮件横幅和作品集缩略图——页面保持轻快，又不会显得压缩痕迹很重。

本页已预设 200KB 目标。压缩器会尝试多档画质和两档缩放，每次测量输出字节数，保留最接近的结果。因为 200KB 相对宽裕，编码器通常能找到观感干净、而不是过度压缩的画质档位。

真正起作用的只有两个选择。第一是尺寸：1600×1000 的照片压到 200KB 是很好的平衡；6000 像素的原图硬压到 200KB 会丢失纹理。把「调整尺寸」的宽度设成页面实际需要的值——博客头图 1200 像素、商品图 1600 像素——画质就能保持很高。第二是格式：照片用 JPEG/WebP；带透明背景或锐利文字的图形用 PNG/WebP。

内容工作的实用流程：准备好一批图片，一次性拖入，按 200KB 目标压缩，再在列表里对比前后体积。如果某张没到目标，几乎都是像素尺寸太大——缩小后再压一次即可。全程本地处理，可以离线继续工作，没有排队。

无需账号、不加水印、不上传。文件在浏览器内解码再编码，因此客户项目和未发布的产品图也能放心处理。`,
    relatedTools: ['compress-to-100kb', 'compress-to-500kb', 'resize-image', 'compress-images'],
  }),

  'compress-to-500kb': build({
    kb: 500,
    titleEn: 'Compress Image to 500KB Online Free — Preset Target Size | CompressFast',
    titleZh: '图片压缩到500KB — 免费在线精确压缩 | 极速压图',
    descriptionEn:
      'Compress photos to 500KB online for free with a preset target. High-resolution results with minimal visible loss, processed entirely in your browser — no upload.',
    descriptionZh:
      '免费在线把照片压缩到500KB，目标大小已预设。高分辨率下几乎看不出画质损失，全程浏览器本地处理、不上传。',
    keywords: [
      'compress image to 500kb', 'compress jpg to 500kb', 'reduce photo to 500kb',
      'image compressor 500kb', 'compress png to 500kb', 'high resolution image compressor',
      'compress photo to 500kb online',
    ],
    heroSubEn: '500KB is preset. Keep high resolution with minimal visible loss — the compressor handles the rest locally in your browser.',
    heroSubZh: '已预设 500KB。保持高分辨率、几乎看不出损失，其余交给浏览器本地压缩器。',
    benefits: [
      { icon: '🎯', titleEn: 'Preset 500KB Target', titleZh: '预设 500KB 目标', descEn: 'A generous target for high-resolution photos, already configured so you can compress in one click.', descZh: '为高分辨率照片准备的宽裕目标，已配置好，一键即可压缩。' },
      { icon: '🔍', titleEn: 'Minimal Visible Loss', titleZh: '几乎无损观感', descEn: '500KB allows full-HD images to stay detailed — ideal for e-commerce, portfolios and print previews.', descZh: '500KB 能让全高清图片保留细节，适合电商主图、作品集和打印预览。' },
      { icon: '🔒', titleEn: 'Local & Offline', titleZh: '本地与离线可用', descEn: 'No upload, no server copy. The tool keeps working after the page loads, even without internet.', descZh: '不上传、服务器无副本。页面加载后即使断网也能继续处理。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop High-Res Images', titleZh: '拖入高清图片', descEn: 'Add one or many photos. The 500KB target is already set for this page.', descZh: '添加一张或多张照片，本页已自动设好 500KB 目标。' },
      { step: 2, titleEn: 'Compress', titleZh: '压缩', descEn: 'Click Compress All. The encoder searches quality and scale to stay near 500KB while preserving detail.', descZh: '点击「压缩全部」，编码器在保持细节的同时尽量贴近 500KB。' },
      { step: 3, titleEn: 'Download', titleZh: '下载', descEn: 'Check the final size and download individually or as a ZIP.', descZh: '确认最终体积，逐张下载或打包 ZIP。' },
    ],
    faqs: [
      { qEn: 'When is a 500KB limit used?', qZh: '什么场景会用 500KB 上限？', aEn: 'E-commerce galleries, real-estate listings, portfolio sites, newsletter hero images and print-preview uploads. These need enough resolution to look professional, but still benefit from avoiding multi-megabyte files.', aZh: '电商图库、房产房源、作品集网站、邮件头图和打印预览上传。这些场景需要足够分辨率来显得专业，但也不该使用几 MB 的大文件。' },
      { qEn: 'Can 500KB still be high resolution?', qZh: '500KB 还能保持高分辨率吗？', aEn: 'Yes. A 1920×1080 JPEG or WebP at 500KB is typically very detailed. Even a 2560px image can fit if the content is not extremely busy. The compressor prioritizes the closest result rather than blindly lowering quality.', aZh: '可以。1920×1080 的 JPEG/WebP 在 500KB 下通常非常细腻；内容不是特别复杂时，2560 像素也能容纳。压缩器会优先寻找最接近的结果，而不是一味降低画质。' },
      { qEn: 'Will there be a visible difference?', qZh: '会有肉眼可见的差别吗？', aEn: 'Usually no at normal viewing sizes. At 100% zoom on a large monitor you may find very subtle texture differences in busy areas, but for web and client previews it is effectively indistinguishable.', aZh: '在正常观看尺寸下通常看不出。大屏 100% 放大时，复杂区域可能有极细微的纹理差异，但用于网页和客户预览基本无法分辨。' },
      { qEn: 'Should I use PNG or JPEG/WebP?', qZh: '应该用 PNG 还是 JPEG/WebP？', aEn: 'Photographs: JPEG or WebP. Screenshots, logos, charts and transparency: PNG or WebP. A photographic PNG at 500KB can look softer than a JPEG because PNG is not designed for photo compression.', aZh: '照片用 JPEG 或 WebP；截图、Logo、图表和透明背景用 PNG 或 WebP。照片类 PNG 在 500KB 下可能比 JPEG 更糊，因为 PNG 并不是为照片压缩设计的。' },
      { qEn: 'Can I batch-compress product photos?', qZh: '可以批量压缩商品图吗？', aEn: 'Yes — up to 30 files per batch for free. Every file targets 500KB, and the whole batch can be downloaded as one ZIP.', aZh: '可以，免费版每批最多 30 张。每张都按 500KB 目标压缩，整批结果可打包成一个 ZIP 下载。' },
      { qEn: 'Is anything uploaded?', qZh: '会上传文件吗？', aEn: 'Nothing is uploaded. All decoding, resizing and encoding happen in your browser. That makes the tool suitable for unreleased product shots and private photos.', aZh: '不会上传。解码、缩放和编码都在浏览器内完成，因此未发布的产品图和私人照片也能放心处理。' },
    ],
    guideEn: `500KB is the upper end of everyday web image limits, and the one where quality is easiest to preserve. At this budget a 1920×1080 photo can remain highly detailed, which is why e-commerce galleries, real-estate listings and portfolio sites often settle on it.

The 500KB target is already active on this page. Drop one image or a batch, click Compress All, and the encoder searches quality levels and scale levels for the closest result. Because the target is generous, it usually keeps full resolution and only trims the quality slightly — the opposite of what happens with a 20KB limit.

Resolution is still worth controlling. A 6000px camera original at 500KB will be downscaled internally or lose texture; a 1920px export at 500KB looks clean. If you know the final display size, set it in the Resize section first. For product galleries, 1600–2000px is a good compromise between zoom detail and page speed.

Choose the format for the content. JPEG and WebP are efficient for photographs; WebP usually produces a smaller file at the same visual quality and supports transparency. PNG is the right choice for screenshots, logos and sharp text, but not for photographic content. AVIF output (Pro) can shrink a 500KB JPEG further without visible loss.

Everything happens locally: no upload, no account, no watermark. Batch up to 30 images, compare before/after sizes, and download the set as a ZIP. Even if you disconnect after loading the page, compression continues to work.`,
    guideZh: `500KB 是日常网页图片上限里比较宽裕的一档，也是最容易保住画质的档位。在这个预算下，1920×1080 的照片仍能保留大量细节，所以电商图库、房产房源和作品集网站常把它作为上限。

本页已启用 500KB 目标。拖入一张或一批图片，点击「压缩全部」，编码器会搜索画质档位和缩放档位，取最接近的结果。因为目标宽裕，通常能保持原分辨率、只轻微降低画质——和 20KB 上限的处境正好相反。

分辨率仍然值得控制。6000 像素的相机原图压到 500KB 会被内部缩小或丢失纹理；1920 像素的导出版在 500KB 下看起来很干净。如果知道最终展示尺寸，先在「调整尺寸」里设好。商品图库用 1600–2000 像素，是放大细节和页面速度之间不错的折中。

格式按内容选择。照片用 JPEG 和 WebP；WebP 在相同观感下通常更小，还支持透明。PNG 适合截图、Logo 和锐利文字，但不适合照片。Pro 版的 AVIF 输出还能让 500KB 的 JPEG 再小一截，而观感几乎不变。

所有处理都在本地：不上传、不需要账号、不加水印。可批量 30 张、对比前后体积、打包 ZIP 下载。即使页面加载后断网，压缩仍然可用。`,
    relatedTools: ['compress-to-200kb', 'compress-to-100kb', 'compress-images', 'pdf-to-jpg'],
  }),
}
