import type { ToolPageData } from './tool-pages'

/**
 * 轻量本地工具页：图片模糊/马赛克、PNG→ICO、图片→Base64。
 * 三个工具都有独立的 Canvas 客户端（不走主压缩器），内容互不复用，各自打一组长尾词。
 */

function build(c: Omit<ToolPageData, 'targetFormat' | 'defaultSettings'>): ToolPageData {
  return { ...c, targetFormat: 'original' }
}

export const UTILITY_TOOLS: Record<string, ToolPageData> = {
  'blur-image': build({
    slug: 'blur-image',
    titleEn: 'Blur or Pixelate Image Online Free — Mosaic & Privacy Tool | CompressFast',
    titleZh: '在线图片模糊与马赛克 — 免费本地打码 | 极速压图',
    descriptionEn:
      'Blur or pixelate images online for free. Hide faces, text and sensitive details with adjustable strength. 100% browser-based — images are never uploaded.',
    descriptionZh:
      '免费在线模糊或马赛克处理图片，可调强度，适合遮挡人脸、文字和敏感信息。100% 浏览器本地处理，图片不上传。',
    keywords: [
      'blur image online', 'pixelate image', 'image mosaic', 'blur photo online',
      'censor image', 'blur face online', 'pixelate picture free', 'mosaic image converter',
    ],
    heroTitleEn: 'Blur or Pixelate Images',
    heroTitleZh: '图片模糊 / 马赛克',
    heroSubEn: 'Hide faces, text and private details in seconds. Adjustable blur and mosaic, processed locally in your browser.',
    heroSubZh: '几秒内遮挡人脸、文字和隐私信息。可调模糊与马赛克强度，浏览器本地处理。',
    benefits: [
      { icon: '🎚️', titleEn: 'Adjustable Strength', titleZh: '强度可调', descEn: 'Slide from a subtle blur to a heavy mosaic. Preview updates instantly before you download.', descZh: '从轻微模糊到强力马赛克自由调节，下载前实时预览效果。' },
      { icon: '🔒', titleEn: 'Never Uploaded', titleZh: '图片不上传', descEn: 'Decoding, pixel processing and export all happen on your device. Sensitive photos stay private.', descZh: '解码、像素处理和导出都在你的设备上完成，敏感照片不会离开本机。' },
      { icon: '🖼️', titleEn: 'Works With Many Formats', titleZh: '多格式支持', descEn: 'PNG, JPG, WebP, GIF, BMP, SVG and AVIF in; PNG, JPG or WebP out.', descZh: '支持 PNG、JPG、WebP、GIF、BMP、SVG、AVIF 输入，可导出 PNG、JPG 或 WebP。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Drop Your Image', titleZh: '拖入图片', descEn: 'Drag a photo in, click to browse, or paste from the clipboard. Up to 30MB.', descZh: '拖入照片、点击选择或直接粘贴，单张最大 30MB。' },
      { step: 2, titleEn: 'Choose Blur or Mosaic', titleZh: '选择模糊或马赛克', descEn: 'Pick an effect and adjust the strength slider until the private parts are fully hidden.', descZh: '选择效果并拖动强度滑块，直到敏感内容被完全遮挡。' },
      { step: 3, titleEn: 'Download', titleZh: '下载', descEn: 'Export as PNG, JPG or WebP. Everything is rendered locally — no upload request is made.', descZh: '导出为 PNG、JPG 或 WebP。全部本地渲染，不会发起上传请求。' },
    ],
    faqs: [
      { qEn: 'Is blurring really enough to protect privacy?', qZh: '模糊处理真的能保护隐私吗？', aEn: 'Only if it is strong enough. Light blur can sometimes be partially reversed by AI tools, especially text. For faces, ID numbers and addresses use a strong mosaic (large pixel blocks) and crop out anything you do not need. When in doubt, cover the area completely rather than relying on a mild blur.', aZh: '前提是强度足够。轻微模糊有时会被 AI 部分还原，尤其是文字。人脸、证件号、地址建议用大块马赛克，并把不需要的部分直接裁掉。拿不准时宁可完全盖住，也不要只做轻微模糊。' },
      { qEn: 'Can I blur only part of the image?', qZh: '可以只模糊图片的局部吗？', aEn: 'This tool currently applies the effect to the whole image. To mask one area, first use the Crop Image tool to cut out that region, blur it, and then stitch or overlay it back if needed. Whole-image blur is ideal for turning a busy background into a soft backdrop.', aZh: '目前工具会对整张图片统一处理。只遮挡某一块时，先用「裁剪图片」把该区域截出来、打码，再按需拼回去。整图模糊也很适合把杂乱的背景虚化成柔和底图。' },
      { qEn: 'Should I use blur or mosaic?', qZh: '应该用模糊还是马赛克？', aEn: 'Blur looks more natural and is right for backgrounds or artistic effects. Mosaic hides information more aggressively because it destroys detail in whole blocks — use it for faces, text and anything that must not be read.', aZh: '模糊更自然，适合背景虚化或艺术效果；马赛克按块破坏细节，遮盖信息更彻底，适合人脸、文字等不能泄露的内容。' },
      { qEn: 'Does it keep transparent backgrounds?', qZh: '会保留透明背景吗？', aEn: 'Yes for PNG and WebP output. JPG does not support transparency and will fill transparent areas with white.', aZh: '导出 PNG 或 WebP 会保留透明背景；JPG 不支持透明，会用白色填充透明区域。' },
      { qEn: 'Are my photos uploaded to a server?', qZh: '照片会上传到服务器吗？', aEn: 'Never. The image is decoded and processed with Canvas inside your browser. There is no upload request, and the page works offline once loaded.', aZh: '不会。图片在浏览器内用 Canvas 解码和处理，没有任何上传请求；页面加载后断网也能使用。' },
      { qEn: 'Is it free?', qZh: '免费吗？', aEn: 'Yes, completely free with no watermark. You can process one image at a time and download the result immediately.', aZh: '完全免费，无水印。一次处理一张图片并立即下载结果。' },
    ],
    detailedGuideEn: `Blurring is the quickest way to share a screenshot, receipt or photo without exposing private details. This tool gives you two effects and a strength slider, and everything runs on your own device.

Blur softens the whole image with a Gaussian-style filter. It is the better choice for backgrounds, mood shots and anything where you want the result to still look natural. Mosaic works differently: it reduces the image to large color blocks, which destroys text and facial detail much more reliably. If the goal is privacy rather than aesthetics, mosaic is usually the safer option.

Strength matters more than people expect. A blur radius that looks convincing on your monitor at 50% zoom can still leave letter shapes readable at 100%. Turn the strength up until the sensitive area is a uniform smudge, not a recognizable outline. For faces and ID numbers, use a large pixel size — the blockier the better.

A practical workflow for screenshots: crop out the parts you do not need first, then blur or mosaic what remains, then compress the result. Cropping removes information entirely, which is stronger than any filter. Our Crop Image and Compress tools are one click away in the related tools below.

Everything is local. The file is decoded by your browser, processed with Canvas, and exported by your browser. No server receives the photo, no account is required, and no watermark is added. That makes the tool suitable for medical documents, invoices, chat screenshots and other material you would not upload to a random website.`,
    detailedGuideZh: `分享截图、票据或照片时，模糊处理是最快的脱敏方式。这个工具提供两种效果和一根强度滑块，所有处理都在你自己的设备上完成。

模糊会用类似高斯的滤镜柔化整张图，适合虚化背景、营造氛围，结果看起来更自然。马赛克则把画面压缩成一个个色块，对文字和人脸细节的破坏更彻底。如果目的是隐私而不是美观，马赛克通常更安全。

强度比很多人想象的更重要。在 50% 缩放下看起来完全糊掉的模糊，放大到 100% 时可能仍能辨认出字母轮廓。把强度调到敏感区域变成一片均匀的色块，而不是还能看出形状。人脸和证件号建议用较大的马赛克块，越块状越安全。

截图脱敏的实用流程：先把不需要的部分裁掉，再对剩下的内容模糊或打码，最后压缩体积。裁剪是直接删除信息，比任何滤镜都更彻底。下方的相关工具里可以直接打开「裁剪图片」和「压缩图片」。

全程本地处理：浏览器负责解码、Canvas 负责处理、浏览器负责导出，没有任何服务器收到照片，不需要账号，也不加水印。医疗单据、发票、聊天截图等不适合上传到陌生网站的材料，都可以放心处理。`,
    relatedTools: ['crop-image', 'compress-images', 'resize-image', 'image-to-base64'],
  }),

  'png-to-ico': build({
    slug: 'png-to-ico',
    titleEn: 'PNG to ICO Converter — Free Favicon Generator | CompressFast',
    titleZh: 'PNG 转 ICO — 免费在线 Favicon 生成器 | 极速压图',
    descriptionEn:
      'Convert PNG, JPG or WebP to a multi-size .ico favicon online for free. Choose 16–256px and download one favicon.ico. Runs locally in your browser — no upload.',
    descriptionZh:
      '免费在线把 PNG/JPG/WebP 转成多尺寸 .ico 图标，可选 16–256px，一次下载 favicon.ico。浏览器本地处理，不上传。',
    keywords: [
      'png to ico', 'convert png to ico', 'favicon generator', 'ico converter',
      'png to favicon', 'create favicon ico online', 'image to ico', 'favicon maker',
    ],
    heroTitleEn: 'PNG to ICO — Favicon Generator',
    heroTitleZh: 'PNG 转 ICO — Favicon 生成器',
    heroSubEn: 'Turn a square image into a multi-size favicon.ico (16–256px) right in your browser. No upload, no signup.',
    heroSubZh: '在浏览器里把正方形图片转成多尺寸 favicon.ico（16–256px），不上传、免注册。',
    benefits: [
      { icon: '🧩', titleEn: 'One Multi-Size ICO', titleZh: '一个文件多尺寸', descEn: 'Pack 16, 32, 48, 64, 128 and 256px into a single favicon.ico — no extra files to manage.', descZh: '把 16/32/48/64/128/256px 打包进一个 favicon.ico，不用管理多个文件。' },
      { icon: '👀', titleEn: 'Live Favicon Preview', titleZh: '实时预览', descEn: 'See how the icon looks at 32×32 in a browser-tab mock before you download.', descZh: '下载前先在模拟标签页里看看 32×32 的实际效果。' },
      { icon: '🔒', titleEn: 'Local & Private', titleZh: '本地与隐私', descEn: 'Resizing and ICO packing happen in your browser. Your logo never touches a server.', descZh: '缩放和 ICO 打包都在浏览器内完成，Logo 不会经过任何服务器。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload a Square Image', titleZh: '上传正方形图片', descEn: 'Drop a PNG, JPG, WebP or SVG. 256×256 or larger is ideal; non-square images are center-cropped.', descZh: '拖入 PNG、JPG、WebP 或 SVG。建议 256×256 以上；非正方形会按中心裁切。' },
      { step: 2, titleEn: 'Pick the Sizes', titleZh: '选择尺寸', descEn: 'Keep 16/32/48 for tabs and 256 for HiDPI screens. Add 64 or 128 if you want extra coverage.', descZh: '保留 16/32/48 用于标签页、256 用于高分屏；需要时可加 64 或 128。' },
      { step: 3, titleEn: 'Download favicon.ico', titleZh: '下载 favicon.ico', descEn: 'Put the file at your site root and reference it with a link tag — browsers also request /favicon.ico automatically.', descZh: '把文件放到网站根目录并用 link 标签引用；浏览器也会自动请求 /favicon.ico。' },
    ],
    faqs: [
      { qEn: 'Which sizes should I include?', qZh: '应该包含哪些尺寸？', aEn: '16, 32 and 48px cover browser tabs, bookmarks and the address bar. 256px is used by Windows shortcuts and HiDPI displays. Including all of them costs only a few KB and avoids blurry icons on some devices.', aZh: '16、32、48px 覆盖浏览器标签页、书签和地址栏；256px 用于 Windows 快捷方式和高分屏。全部包含只多几 KB，可以避免某些设备上图标发虚。' },
      { qEn: 'Does it accept JPG, WebP or SVG?', qZh: '支持 JPG、WebP 或 SVG 吗？', aEn: 'Yes. PNG gives the cleanest result for logos with sharp edges or transparency, but JPG, WebP and SVG also work. Transparent PNG is recommended so the icon looks right on both light and dark browser themes.', aZh: '支持。带锐利边缘或透明背景的 Logo 用 PNG 效果最好，JPG、WebP、SVG 也可以。建议用透明 PNG，这样在浅色和深色浏览器主题下都好看。' },
      { qEn: 'What happens to non-square images?', qZh: '非正方形图片会怎样？', aEn: 'They are center-cropped to a square before resizing, so the middle of the image becomes the icon. For a logo with text, prepare a square source first, otherwise the edges may be cut off.', aZh: '会先按中心裁成正方形再缩放，图标取的是图片中间部分。带文字的 Logo 建议先准备正方形源图，否则两侧可能被裁掉。' },
      { qEn: 'Where do I put favicon.ico?', qZh: 'favicon.ico 放在哪里？', aEn: 'Put it in your website root (for example https://example.com/favicon.ico). Browsers request that path automatically. You can also add a link tag in the head for explicit control.', aZh: '放到网站根目录（例如 https://example.com/favicon.ico），浏览器会自动请求这个路径。也可以在 head 里加 link 标签显式指定。' },
      { qEn: 'Why did my favicon not update?', qZh: '为什么图标没有更新？', aEn: 'Browsers and operating systems cache favicons aggressively. Hard-refresh the page, open it in a private window, or add a version query such as /favicon.ico?v=2. Some systems refresh the icon only after a restart.', aZh: '浏览器和操作系统会强力缓存 favicon。强制刷新、用无痕窗口打开，或在地址后加版本参数（如 /favicon.ico?v=2）。部分系统需要重启后才会更新。' },
      { qEn: 'Is the generated ICO file valid?', qZh: '生成的是真正的 ICO 文件吗？', aEn: 'Yes — it follows the ICO container format with one PNG-compressed entry per size. Modern browsers and Windows Vista and later support PNG-based icons; older legacy tools may not.', aZh: '是真正的 ICO：按 ICO 容器格式写入，每个尺寸内嵌一张 PNG。现代浏览器和 Windows Vista 以后都支持 PNG 图标；非常老的旧工具可能不支持。' },
    ],
    detailedGuideEn: `A favicon is the tiny icon in the browser tab, bookmark list and address bar. It is easy to overlook, but a missing or blurry icon makes a site look unfinished. The standard way to ship one is a single favicon.ico that contains several sizes, and this tool builds exactly that from any square image.

Start with a square source, ideally 256×256 or larger. A logo with a transparent background is better than a white square, because browsers can show tabs in dark mode. If your source is not square, the tool center-crops it before resizing — check the preview to make sure nothing important is cut off.

The ICO format can contain multiple images. 16 and 32px are used in tabs and bookmarks, 48px in some Windows views, and 256px by HiDPI screens and shortcuts. Packing them together means one file works everywhere. The browser picks the closest size automatically, so you do not need separate favicon-16.png and favicon-32.png files.

After downloading, place favicon.ico in your site root. Browsers request /favicon.ico by default, so that alone is often enough. For explicit control, add a link tag in the head of your HTML. Remember that favicons are cached aggressively: after replacing one, test in a private window or add a version query before assuming it failed.

Everything happens locally in your browser. The image is resized with Canvas, each size is encoded as PNG, and the ICO container is assembled in JavaScript. No upload, no account, no watermark.`,
    detailedGuideZh: `Favicon 是浏览器标签页、书签和地址栏里的那个小图标。它很容易被忽略，但缺失或模糊的图标会让网站显得没做完。标准做法是用一个包含多个尺寸的 favicon.ico，这个工具可以把任意正方形图片直接打包成这样的文件。

先准备一张正方形源图，最好 256×256 以上。透明背景的 Logo 比白底方块更好，因为浏览器标签页可能是深色模式。如果源图不是正方形，工具会先按中心裁切再缩放——看一眼预览，确认重要部分没有被裁掉。

ICO 格式可以包含多张图片：16 和 32px 用于标签页和书签，48px 用于部分 Windows 视图，256px 用于高分屏和快捷方式。把它们打进一个文件，就能到处通用。浏览器会自动选择最接近的尺寸，不需要再单独维护 favicon-16.png、favicon-32.png。

下载后把 favicon.ico 放到网站根目录。浏览器默认会请求 /favicon.ico，通常这样就够了；想显式控制可以在 HTML 的 head 里加 link 标签。注意 favicon 的缓存非常顽固：替换后先用无痕窗口测试，或在地址后加版本参数，别急着以为没生效。

全程在浏览器本地完成：用 Canvas 缩放、逐尺寸编码成 PNG、再用 JavaScript 组装 ICO 容器。不上传、不需要账号、不加水印。`,
    relatedTools: ['compress-png', 'crop-image', 'resize-image', 'convert-jpg-to-png'],
  }),

  'image-to-base64': build({
    slug: 'image-to-base64',
    titleEn: 'Image to Base64 Converter — Data URI Generator | CompressFast',
    titleZh: '图片转 Base64 — 在线 Data URI 生成器 | 极速压图',
    descriptionEn:
      'Convert images to Base64 Data URI, HTML or CSS snippets online for free. Copy-ready output generated locally in your browser — files are never uploaded.',
    descriptionZh:
      '免费在线把图片转成 Base64 Data URI、HTML 或 CSS 片段，一键复制。纯浏览器本地处理，文件不上传。',
    keywords: [
      'image to base64', 'base64 image converter', 'data uri generator', 'convert image to base64',
      'png to base64', 'base64 encoder online', 'css background image base64', 'base64 image html',
    ],
    heroTitleEn: 'Image to Base64 Converter',
    heroTitleZh: '图片转 Base64',
    heroSubEn: 'Get a copy-ready Data URI, Base64 string, HTML or CSS snippet — all generated locally in your browser.',
    heroSubZh: '一键生成可复制的 Data URI、Base64 字符串、HTML 或 CSS 片段，全部在浏览器本地完成。',
    benefits: [
      { icon: '📋', titleEn: 'Four Output Formats', titleZh: '四种输出格式', descEn: 'Switch between raw Base64, a full Data URI, an HTML img tag and a CSS background rule.', descZh: '可在纯 Base64、完整 Data URI、HTML img 标签和 CSS background 之间切换。' },
      { icon: '⚡', titleEn: 'Instant & Offline', titleZh: '即时与离线', descEn: 'Encoding happens in milliseconds with FileReader. Once loaded, the page works without internet.', descZh: 'FileReader 毫秒级完成编码；页面加载后断网也能使用。' },
      { icon: '🔒', titleEn: 'Files Stay Local', titleZh: '文件留在本地', descEn: 'Nothing is uploaded. Even private screenshots can be encoded safely on your device.', descZh: '不会上传任何文件，私人截图也可以在自己的设备上安全编码。' },
    ],
    howTo: [
      { step: 1, titleEn: 'Upload an Image', titleZh: '上传图片', descEn: 'Drop a PNG, JPG, WebP, GIF or SVG up to 5MB. Small icons work best.', descZh: '拖入 PNG、JPG、WebP、GIF 或 SVG，最大 5MB。小图标最合适。' },
      { step: 2, titleEn: 'Choose the Output', titleZh: '选择输出格式', descEn: 'Pick Data URI for inline use, raw Base64 for APIs, HTML for an img tag, or CSS for a background.', descZh: '内联用 Data URI、接口用纯 Base64、img 标签用 HTML、背景图用 CSS。' },
      { step: 3, titleEn: 'Copy', titleZh: '复制', descEn: 'Click Copy and paste the string into your HTML, CSS, Markdown or code.', descZh: '点击复制，粘贴到 HTML、CSS、Markdown 或代码中。' },
    ],
    faqs: [
      { qEn: 'What is a Data URI?', qZh: '什么是 Data URI？', aEn: 'A Data URI embeds a file directly in a string: data:image/png;base64,iVBOR... The browser decodes it like a normal image URL, so it can be used in an img tag or CSS without a separate file request.', aZh: 'Data URI 把文件直接编码进字符串：data:image/png;base64,iVBOR…。浏览器会像普通图片地址一样解析，因此可以放进 img 标签或 CSS，不需要额外请求文件。' },
      { qEn: 'Why is Base64 larger than the original?', qZh: '为什么 Base64 比原文件大？', aEn: 'Base64 represents every 3 bytes with 4 ASCII characters, which adds about 33% overhead. A 30KB icon becomes roughly 40KB of text. That is why Base64 suits small assets, not large photos.', aZh: 'Base64 用 4 个 ASCII 字符表示每 3 个字节，体积会增加约 33%。30KB 的图标会变成大约 40KB 的文本。所以 Base64 适合小资源，不适合大照片。' },
      { qEn: 'When should I use Base64 instead of a URL?', qZh: '什么时候该用 Base64 而不是 URL？', aEn: 'Use it for tiny icons, email signatures, single-file HTML demos, offline documentation and CSS where one extra request matters. Avoid it for large images or assets reused across many pages, because it bloats every HTML/CSS file that includes it and cannot be cached separately.', aZh: '适合小图标、邮件签名、单文件 HTML 演示、离线文档，以及在意额外请求的 CSS。大图片、或在多个页面复用的资源不要用，因为它会撑大每个引用它的 HTML/CSS，还无法单独缓存。' },
      { qEn: 'Does it support SVG?', qZh: '支持 SVG 吗？', aEn: 'Yes. SVG is encoded as data:image/svg+xml;base64,... and works in img tags and CSS. For inline SVG you can also paste the raw SVG markup, which is usually smaller than Base64.', aZh: '支持。SVG 会编码成 data:image/svg+xml;base64,…，可用于 img 和 CSS。如果想直接内联，也可以粘贴原始 SVG 标记，通常比 Base64 更小。' },
      { qEn: 'Are my images uploaded?', qZh: '图片会上传吗？', aEn: 'No. The file is read with FileReader inside your browser and never sent anywhere. The page works offline after loading.', aZh: '不会。文件在浏览器内用 FileReader 读取，不会发送到任何地方；页面加载后断网也能用。' },
      { qEn: 'Is there a file size limit?', qZh: '有文件大小限制吗？', aEn: 'This tool accepts up to 5MB per image. Larger files produce enormous text strings that slow down editors and HTML pages, so they are better served as normal image URLs.', aZh: '单张最大 5MB。更大的文件会生成超长文本，拖慢编辑器和 HTML 页面，更适合用普通图片 URL。' },
    ],
    detailedGuideEn: `Base64 encoding turns an image into plain text. That sounds odd, but it is genuinely useful when you need an image to live inside another text file — an HTML page, a CSS stylesheet, an email signature or a Markdown document.

The most common form is a Data URI: a string that starts with data:image/png;base64, followed by the encoded bytes. Browsers understand it anywhere a URL is accepted, so you can write <img src="data:..."> or background-image: url("data:...") without shipping a separate image file. This tool also gives you the raw Base64 string (for APIs and JSON) and ready-made HTML/CSS snippets.

The trade-off is size. Base64 uses four characters to represent every three bytes, adding roughly 33%. A small 10KB icon becomes about 13KB of text, which is fine. A 1MB photo becomes 1.3MB embedded in your HTML, which is not: it cannot be cached separately, it delays first render, and it makes the file painful to edit. Keep Base64 for icons, logos, tiny backgrounds and single-file demos.

One practical trick: compress or resize the image first, then encode it. A 64×64 PNG icon is usually under 5KB, and its Data URI fits comfortably in a stylesheet. If you need a favicon-style asset, the PNG to ICO tool is the better fit.

Everything runs locally. The file is read with FileReader, encoded in memory and shown for copying. Nothing is uploaded, so even a private screenshot can be converted safely.`,
    detailedGuideZh: `Base64 编码把图片变成一段纯文本。听起来奇怪，但当你需要让图片「住进」另一个文本文件时——HTML 页面、CSS 样式表、邮件签名或 Markdown 文档——它非常有用。

最常见的形式是 Data URI：以 data:image/png;base64, 开头，后面跟着编码后的字节。浏览器在任何接受 URL 的地方都能识别它，所以可以直接写 <img src="data:…"> 或 background-image: url("data:…")，不用额外带一个图片文件。这个工具还会给出纯 Base64 字符串（用于接口和 JSON）以及现成的 HTML/CSS 片段。

代价是体积。Base64 用 4 个字符表示每 3 个字节，体积增加约 33%。10KB 的小图标变成约 13KB 文本，没问题；1MB 的照片变成 1.3MB 塞进 HTML 就不合适了——它无法单独缓存、拖慢首屏渲染，文件也会变得难以编辑。Base64 留给图标、Logo、小背景和单文件演示。

一个实用技巧：先压缩或缩小图片，再编码。64×64 的 PNG 图标通常不到 5KB，Data URI 放进样式表毫无压力。如果要做网站图标，用「PNG 转 ICO」工具更合适。

全程本地运行：用 FileReader 读取文件、在内存中编码、展示出来供复制。不会上传任何内容，私人截图也能安全转换。`,
    relatedTools: ['png-to-ico', 'compress-png', 'convert-to-webp', 'blur-image'],
  }),
}
