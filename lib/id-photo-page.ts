import type { ToolPageData } from './tool-pages'

/**
 * 证件照工具页（/tools/id-photo）
 * 与其它轻量工具一样不走主压缩器，由 IdPhotoClient 提供独立 UI。
 */

export const ID_PHOTO_TOOL: ToolPageData = {
  slug: 'id-photo',
  titleEn: 'Passport Photo Maker Online — Free Background Change | CompressFast',
  titleZh: '在线证件照制作 — 免费换底色/一寸二寸 | 极速压图',
  descriptionEn:
    'Make a passport or ID photo online for free. Upload a portrait, cut out the person locally and replace the background with white, blue or red. Common sizes — 1-inch, 2-inch, US passport, Japan visa — at 300 DPI, downloaded as JPG or PNG. The photo never leaves your device.',
  descriptionZh:
    '免费在线制作证件照：上传正脸照片，本地抠出人像并换成白底/蓝底/红底，支持一寸、二寸、小二寸、大一寸、美国护照、日本签证等常用尺寸，300DPI，可下载 JPG/PNG。全程浏览器本地处理，照片不上传服务器。',
  keywords: [
    '证件照', '证件照制作', '证件照换底色', '一寸照片', '二寸照片', '在线证件照',
    '免费证件照', '证件照尺寸', '证件照白底', '证件照蓝底',
    'passport photo maker', 'id photo maker', 'passport photo online', 'change photo background',
    '1 inch photo', '2x2 passport photo', 'visa photo maker', 'id photo size',
  ],
  heroTitleEn: 'Passport & ID Photo Maker',
  heroTitleZh: '在线证件照制作',
  heroSubEn: 'Upload a portrait, replace the background, and download a 300 DPI ID photo in the exact size you need. Everything runs locally — no upload.',
  heroSubZh: '上传正脸照片，一键换底色，按一寸/二寸等标准尺寸导出 300DPI 证件照。全程本地处理，照片不上传。',
  targetFormat: 'original',
  benefits: [
    {
      icon: '🔒',
      titleEn: 'Stays on Your Device',
      titleZh: '照片不上传',
      descEn: 'Face detection and portrait segmentation run in your browser with two small on-device models (1.3MB + 4.4MB). Your photo is never sent to a server.',
      descZh: '人脸检测和人像分割用两个小模型（1.3MB + 4.4MB）在浏览器本地完成，照片不会上传到任何服务器。',
    },
    {
      icon: '📐',
      titleEn: 'Exact Print Sizes',
      titleZh: '标准打印尺寸',
      descEn: 'One-inch, two-inch, US passport, Japan visa and custom sizes (10–60 × 10–80mm) rendered at 300 or 600 DPI — the resolution photo labs expect.',
      descZh: '一寸、二寸、美国护照、日本签证等预设，也支持自定义尺寸（10–60 × 10–80mm），按 300/600DPI 输出。',
    },
    {
      icon: '🖨️',
      titleEn: 'Print Sheet (Pro)',
      titleZh: '排版打印（Pro）',
      descEn: 'Arrange multiple copies on a 6-inch sheet with cut guides, so one print run gives you a stack of photos.',
      descZh: '把多张照片排到 6 寸相纸上并带裁切线，冲印一次就能剪出一叠证件照。',
    },
  ],
  howTo: [
    {
      step: 1,
      titleEn: 'Upload a portrait',
      titleZh: '上传正脸照片',
      descEn: 'Drop a front-facing photo or a selfie. Up to 30MB; JPG, PNG and WebP are supported.',
      descZh: '拖入一张正脸照片或自拍，支持 JPG/PNG/WebP，单张最大 30MB。',
    },
    {
      step: 2,
      titleEn: 'Choose size and background',
      titleZh: '选尺寸和底色',
      descEn: 'The face is detected automatically and the crop is framed for you. Pick a size and background, then drag or zoom if you want to fine-tune.',
      descZh: '上传后自动识别人脸并完成构图；选择尺寸和底色，需要时再拖动、缩放微调。',
    },
    {
      step: 3,
      titleEn: 'Generate and download',
      titleZh: '生成并下载',
      descEn: 'The model cuts out the person and composites the new background. Download JPG or PNG at the exact pixel size.',
      descZh: '模型自动抠出人像并合成新底色，按精确像素尺寸下载 JPG 或 PNG。',
    },
  ],
  faqs: [
    {
      qEn: 'Is the photo uploaded to a server?',
      qZh: '照片会上传到服务器吗？',
      aEn: 'No. The photo is decoded, cropped, segmented and composited entirely inside your browser. The only network request is downloading the 4.4MB portrait model the first time; after that it is cached by the browser.',
      aZh: '不会。照片的解码、裁切、人像分割和合成全部在浏览器内完成。唯一的网络请求是首次下载约 4.4MB 的人像模型，之后会走浏览器缓存。',
    },
    {
      qEn: 'Which ID photo sizes are supported?',
      qZh: '支持哪些证件照尺寸？',
      aEn: 'One-inch 25×35mm (295×413px), two-inch 35×49mm (413×579px), small two-inch 35×45mm (413×531px), large one-inch 33×48mm (390×567px), US passport 2×2in (600×600px) and Japan visa 45×45mm (531×531px), all at 300 DPI. You can also enter a custom size from 10–60mm wide and 10–80mm tall at 300 or 600 DPI.',
      aZh: '一寸 25×35mm（295×413px）、二寸 35×49mm（413×579px）、小二寸 35×45mm（413×531px）、大一寸 33×48mm（390×567px）、美国护照 2×2 英寸（600×600px）、日本签证 45×45mm（531×531px），均为 300DPI。也可以自定义 10–60mm 宽、10–80mm 高，选择 300 或 600DPI。',
    },
    {
      qEn: 'Is it free?',
      qZh: '免费吗？',
      aEn: 'Yes. Generating and downloading a single ID photo is free, with no watermark. The 6-inch print sheet (multiple copies with cut guides) is an optional Pro feature. Every free tool on CompressFast works without an account.',
      aZh: '免费。生成和下载单张证件照完全免费，无水印。6 寸相纸排版（多张 + 裁切线）是可选 Pro 功能。极速压图的所有免费工具都不需要注册账号。',
    },
    {
      qEn: 'Does it center the face automatically?',
      qZh: '上传后会自动识别人脸构图吗？',
      aEn: 'Yes. On upload, a small face detector (about 1.3MB, also running locally) finds the largest front-facing face and frames the crop automatically. If it cannot find a face — or the photo is angled — you can drag and zoom manually. In group photos the largest face is used.',
      aZh: '会。上传后，本地运行的人脸检测模型（约 1.3MB）会找到最大的一张正脸并自动完成取景；找不到人脸或照片角度不理想时，仍可手动拖动、缩放。多人合影会选用最大的一张脸。',
    },
    {
      qEn: 'Why does it download a model?',
      qZh: '为什么要下载模型？',
      aEn: 'Removing the background requires a portrait segmentation model. We use u2netp (about 4.4MB) so the first run is quick even on mobile. A separate 1.3MB face model runs at upload time. Both are stored in the browser cache, so later photos start almost instantly.',
      aZh: '换底色需要人像分割模型。我们选用约 4.4MB 的 u2netp，手机上首次下载也很快；上传时还会下载约 1.3MB 的人脸检测模型。两个模型都会存入浏览器缓存，之后再用几乎秒开。',
    },
    {
      qEn: 'What makes a good source photo?',
      qZh: '原图有什么要求？',
      aEn: 'Use a front-facing photo with even lighting, eyes open and a plain background. Avoid hats, heavy shadows and extreme angles. The crop guides help you place the head correctly, but the source photo still needs to show the face clearly.',
      aZh: '建议用正脸、光线均匀、背景简单的照片，眼睛睁开、少阴影、不要歪头。取景参考线能帮你把头放正，但原图本身要能看清五官。',
    },
    {
      qEn: 'Can I guarantee it will be accepted?',
      qZh: '能保证通过审核吗？',
      aEn: 'No. Size, background color, head ratio and editing rules vary by country, agency and document type. This tool helps you produce a correctly sized image, but always check the official requirements of the office receiving it before submitting.',
      aZh: '不能保证。不同国家、机构和证件类型对尺寸、底色、头部比例和后期处理的要求都不同。本工具帮你做出尺寸正确的照片，提交前请务必核对受理机构的官方要求。',
    },
    {
      qEn: 'What format and DPI is the download?',
      qZh: '下载是什么格式和分辨率？',
      aEn: 'JPG or PNG at 300 DPI, rendered at the exact pixel dimensions of the chosen preset. JPG is the safest choice for online application systems; PNG avoids recompression artifacts if you plan to edit further.',
      aZh: 'JPG 或 PNG，300DPI，按所选预设的精确像素尺寸输出。报名系统通常要求 JPG；如果还要继续编辑，PNG 可以避免二次压缩损失。',
    },
    {
      qEn: 'Can I print several copies on one sheet?',
      qZh: '能一次打印多张吗？',
      aEn: 'Yes. Pro users can generate a 6-inch (4×6 inch, 300 DPI) sheet with as many copies as fit, plus light cut guides. Print it at a photo lab or on a home printer, then cut along the lines.',
      aZh: '可以。Pro 用户可生成 6 寸相纸（4×6 英寸，300DPI）排版图，自动放入尽可能多的张数并带淡色裁切线，冲印或家用打印后沿线剪开即可。',
    },
  ],
  detailedGuideEn: `An ID photo looks simple until you need one: the size must be exact, the background must be the right color, and the head has to sit within a narrow band of the frame. Most online services solve this by asking you to upload the photo to their server. This tool takes the opposite approach — the portrait is cut out and composited on your own device.

The workflow is three steps. Upload a front-facing photo. A small face detector runs locally and frames the crop automatically: it finds the largest face and zooms so the head sits between the dashed guides. Choose a size preset — one-inch (25×35mm), two-inch (35×49mm), small two-inch, large one-inch, US passport 2×2in or Japan visa 45×45mm — or enter a custom size and DPI (300/600). Then pick a background color. If the detection misses the face, or you want a different crop, drag and zoom manually; the guides show where the head top and chin should sit. Then press Generate.

On the first run, the browser downloads a 1.3MB face model and a 4.4MB portrait segmentation model (u2netp), then caches both. The model produces a soft alpha mask around the person, which is used to composite the subject onto a solid white, blue, red or custom background. The output is rendered at 300 DPI in the exact pixel size of the preset: for example, a one-inch photo is 295×413 pixels. You can download JPG or PNG and change the background color without re-running the model.

A few practical notes. Official rules differ: some agencies require a white background, others blue or red; head height and margins also vary. The guides are a general starting point, not a guarantee of acceptance. Use a photo with even lighting and no strong colored light, keep the face centered and look straight at the camera. Avoid heavy filters — they can alter skin tone and are often rejected. If the source photo has a busy background, the model still works, but hair edges will look cleaner when the background contrasts with the hair.

For printing, Pro users can lay multiple copies onto a 6-inch sheet with cut guides. Photo labs usually print on 4×6 inch paper at 300 DPI, which is exactly the sheet this tool generates, so the physical size matches the digital one. After printing, cut along the light gray lines.

Privacy and speed are the reason this runs locally. The photo is never uploaded, there is no account, no queue and no watermark. Once the model is cached, generating another size or background takes only a couple of seconds. If you need a transparent PNG instead of a solid background, the AI background remover is the companion tool; if you need to shrink the final file for an upload form, run it through the compressor afterward.`,
  detailedGuideZh: `证件照看起来简单，真正要做的时候却处处是坑：尺寸必须精确、底色必须符合要求、头部还要落在规定的比例范围内。多数在线服务的做法是把照片上传到服务器处理；这个工具反过来，抠图和换底全部在你的设备上完成。

流程只有三步。先上传一张正脸照片，本地的人脸检测模型会自动找到最大的一张脸并完成取景，让头部落在参考线之间；再选择尺寸预设——一寸（25×35mm）、二寸（35×49mm）、小二寸、大一寸、美国护照 2×2 英寸或日本签证 45×45mm——也可以自定义尺寸和 300/600DPI，然后选底色。如果没检测到人脸，或想要不同的构图，仍可手动拖动、缩放，参考线会提示头顶和下巴的位置。最后点「生成证件照」。

首次使用时，浏览器会下载约 1.3MB 的人脸检测模型和约 4.4MB 的人像分割模型（u2netp），并缓存。模型输出人像周围的柔和蒙版，用它把人物合成到白、蓝、红或自定义纯色背景上。输出按 300DPI 和预设的精确像素尺寸渲染：例如一寸照就是 295×413 像素。可以下载 JPG 或 PNG；生成后换底色不需要重新跑模型，几乎瞬间完成。

几点实用建议。各地要求并不统一：有的机构要白底，有的要蓝底或红底，头部高度和留白比例也各不相同。参考线只是通用起点，不保证一定通过审核。原图尽量光线均匀、不要有强烈色光，人脸居中、正视镜头；不要用重滤镜，滤镜会改变肤色，容易被退回。原图背景杂乱也能处理，但头发与背景颜色反差大时，发丝边缘会更干净。

需要冲印时，Pro 用户可以把多张照片排到 6 寸相纸上并带裁切线。冲印店常用的 4×6 英寸相纸正好对应本工具生成的 1200×1800 像素画布，打印出来的物理尺寸和数字尺寸一致，沿线剪开即可。

本地处理带来的是隐私和速度：照片不上传、不需要账号、不排队、不加水印。模型缓存后，换尺寸或换底色通常只需一两秒。如果你需要的是透明背景而不是纯色底，可以配合 AI 抠图工具；如果最终文件太大、上传表单有体积限制，再用压缩工具压一下即可。`,
  relatedTools: ['crop-image', 'compress-images', 'resize-image', 'image-to-pdf'],
}
