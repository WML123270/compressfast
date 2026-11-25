import type { ToolPageData } from './tool-pages'

/**
 * 图片切割 / 九宫格切图（/tools/split-image）
 * 纯 Canvas 切图 + JSZip 打包，不走主压缩器。
 */

export const SPLIT_IMAGE_TOOL: ToolPageData = {
  slug: 'split-image',
  titleEn: 'Split Image Online — 3×3 Grid & Instagram Grid Maker | CompressFast',
  titleZh: '在线图片切割 — 九宫格切图/朋友圈九宫格 | 极速压图',
  descriptionEn:
    'Split one image into a grid online for free: 3×3 nine-grid, 2×2, or any rows and columns up to 5×5. Optional square crop, JPG/PNG output, and one ZIP download. Everything runs in your browser — the image is never uploaded.',
  descriptionZh:
    '免费在线把一张图片切成多张：九宫格 3×3、2×2 或自定义行列（最多 5×5），可选正方形裁剪，输出 JPG/PNG，一键 ZIP 下载。浏览器本地处理，图片不上传服务器。',
  keywords: [
    '图片切割', '九宫格切图', '朋友圈九宫格', '图片分割', '切图工具', '图片切成九块',
    '九宫格图片生成器', '在线切图', '图片切片',
    'split image', 'image splitter', '3x3 grid maker', 'nine grid photo', 'instagram grid maker',
    'photo splitter', 'split picture online', 'grid image cutter',
  ],
  heroTitleEn: 'Split Image & 3×3 Grid Maker',
  heroTitleZh: '图片切割 / 九宫格切图',
  heroSubEn: 'Slice one photo into a 3×3 grid or any rows and columns. Square crop, JPG/PNG, one ZIP download — all local.',
  heroSubZh: '把一张图切成九宫格或任意行列，可选正方形裁剪，JPG/PNG 输出，一键 ZIP 下载。全程本地处理。',
  targetFormat: 'original',
  benefits: [
    {
      icon: '🎯',
      titleEn: 'Ready for Nine-Grid Posts',
      titleZh: '九宫格一键切',
      descEn: 'Pick 3×3 and upload the numbered tiles in order — they line up perfectly on WeChat Moments, Instagram and Xiaohongshu.',
      descZh: '选 3×3，按 1–9 的文件名顺序上传，朋友圈、Instagram、小红书的九宫格就能严丝合缝拼回原图。',
    },
    {
      icon: '🔒',
      titleEn: 'Never Uploaded',
      titleZh: '图片不上传',
      descEn: 'Decoding, slicing and ZIP packing all happen in your browser. Private photos stay on your device.',
      descZh: '解码、切割和 ZIP 打包全部在浏览器内完成，私人照片不会离开你的设备。',
    },
    {
      icon: '📦',
      titleEn: 'Any Grid, One ZIP',
      titleZh: '任意行列，一键打包',
      descEn: 'From 1×2 to 5×5, with optional square crop. Download every tile as one ZIP, numbered row by row.',
      descZh: '从 1×2 到 5×5 任意行列，可选正方形裁剪；所有切片按行编号打包成一个 ZIP，下载即用。',
    },
  ],
  howTo: [
    {
      step: 1,
      titleEn: 'Upload an image',
      titleZh: '上传图片',
      descEn: 'Drop a JPG, PNG or WebP image. Up to 30MB; nothing is uploaded to a server.',
      descZh: '拖入一张 JPG/PNG/WebP 图片，单张最大 30MB，不会上传到服务器。',
    },
    {
      step: 2,
      titleEn: 'Choose the grid',
      titleZh: '选择切法',
      descEn: 'Pick rows and columns (3×3 for nine-grid), and turn on square crop if the post needs square tiles.',
      descZh: '选择行数和列数（九宫格选 3×3）；如果平台要求方图，打开「正方形裁剪」。',
    },
    {
      step: 3,
      titleEn: 'Download the ZIP',
      titleZh: '下载 ZIP',
      descEn: 'Every tile is exported at original resolution, numbered row by row. Unzip and upload in order.',
      descZh: '所有切片按原始分辨率导出并按行编号，解压后按文件名顺序上传即可。',
    },
  ],
  faqs: [
    {
      qEn: 'How do I post a nine-grid on WeChat Moments or Instagram?',
      qZh: '九宫格怎么发朋友圈 / 小红书？',
      aEn: 'Choose 3×3, download the ZIP, unzip it, and upload the tiles in filename order (row 1: 1-1, 1-2, 1-3; row 2: 2-1 …). The platform lays them out in that order and the original picture reappears across the grid. Turn on square crop if the platform displays square thumbnails.',
      aZh: '选 3×3，下载 ZIP 解压，然后按文件名顺序上传（第一行 1-1、1-2、1-3，第二行 2-1……）。平台按上传顺序排列，九张图就能拼回原图。如果平台显示方形缩略图，建议打开「正方形裁剪」。',
    },
    {
      qEn: 'What does square crop do?',
      qZh: '「正方形裁剪」是做什么的？',
      aEn: 'It first center-crops the image to a square, then splits it. Use it for platforms that show square tiles so the pieces still align. Turn it off to split the original aspect ratio into rectangular tiles.',
      aZh: '先把图片从中心裁成正方形，再等分切割。平台用方形缩略图时打开它，切片才能对齐；关闭则按原图比例切成矩形块。',
    },
    {
      qEn: 'Which grid sizes are supported?',
      qZh: '支持哪些切法？',
      aEn: 'Any rows and columns from 1 to 5, so 1×2, 2×2, 3×3, 4×4, 5×5 and irregular combinations all work. Nine-grid is simply 3×3.',
      aZh: '行、列都可以选 1–5，所以 1×2、2×2、3×3、4×4、5×5 以及不对称组合都支持。九宫格就是 3×3。',
    },
    {
      qEn: 'What formats and file size are supported?',
      qZh: '支持什么格式和大小？',
      aEn: 'JPG, PNG, WebP and BMP input up to 30MB. Output can be JPG or PNG; JPG is smaller, PNG is better for text and graphics.',
      aZh: '支持 JPG、PNG、WebP、BMP 输入，单张最大 30MB。输出可选 JPG 或 PNG；JPG 体积更小，PNG 更适合文字和图形。',
    },
    {
      qEn: 'Are my photos uploaded?',
      qZh: '图片会上传到服务器吗？',
      aEn: 'No. The image is decoded, sliced and zipped entirely in your browser. There is no upload request, and the page works offline once loaded.',
      aZh: '不会。图片的解码、切割和 ZIP 打包全部在浏览器内完成，没有任何上传请求；页面加载后断网也能使用。',
    },
    {
      qEn: 'What are the output files named?',
      qZh: '导出的文件名是什么？',
      aEn: 'Tiles are named by row and column, for example photo-1-1.jpg, photo-1-2.jpg … photo-3-3.jpg. Sorting by filename gives the correct upload order.',
      aZh: '按行、列命名，例如 photo-1-1.jpg、photo-1-2.jpg……photo-3-3.jpg。按文件名排序就是正确的上传顺序。',
    },
  ],
  detailedGuideEn: `A grid post looks like one picture made of nine, but the pieces have to be cut in exactly the right order. This tool slices an image in your browser and numbers every piece, so uploading them in filename order rebuilds the original.

Start by uploading a JPG, PNG or WebP. Choose rows and columns: 3×3 is the classic nine-grid for WeChat Moments, Xiaohongshu and Instagram. If the platform shows square thumbnails, turn on square crop — the tool center-crops to a square first, then divides it, so the tiles align even when the original is not square. Turn it off when you want rectangular pieces that preserve the original aspect ratio.

Every tile is exported at the original resolution, so the grid adds no extra compression loss beyond the JPG/PNG encoding you choose. JPG keeps the ZIP small; PNG is better for screenshots, posters and anything with text. The ZIP contains files named row-column (1-1, 1-2 …), which is also the order most apps display a multi-image post.

A practical tip: leave a little breathing room around the subject before cutting. Apps often crop thumbnails slightly, and a face or logo right at a tile edge can look awkward. If the grid looks misaligned after posting, check that all tiles came from the same ZIP and were uploaded in filename order — mixing sizes or reordering is the usual cause.

Everything is local: the browser decodes the photo, draws each tile to a canvas and zips the results. No server receives the image, no account is needed, and no watermark is added. That makes it suitable for personal photos, client previews and unreleased designs.`,
  detailedGuideZh: `九宫格看起来是一张图拼成九张，但切片顺序错一张就会错位。这个工具在浏览器里把图片切开，并按行列给每张切片编号，按文件名顺序上传就能拼回原图。

先上传一张 JPG、PNG 或 WebP。选择行数和列数：3×3 就是朋友圈、小红书和 Instagram 最常用的九宫格。如果平台显示方形缩略图，打开「正方形裁剪」——工具会先从中心裁成正方形再等分，这样原图不是方图也能对齐；关闭则按原图比例切成矩形块。

每张切片都按原始分辨率导出，除了你选择的 JPG/PNG 编码外不会额外损失画质。JPG 让 ZIP 更小；PNG 更适合截图、海报和带文字的内容。ZIP 内文件按「行-列」命名（1-1、1-2……），这也正是多数应用展示多图时的排列顺序。

实用建议：切图前给主体留一点余量。平台常会轻微裁切缩略图，人脸或 Logo 正好压在切片边缘时容易显得别扭。如果发布后九宫格对不齐，先检查九张图是否来自同一个 ZIP、是否按文件名顺序上传——混用尺寸或打乱顺序是最常见的原因。

全程本地处理：浏览器负责解码、逐块绘制到 canvas，再打包成 ZIP。没有服务器收到图片，不需要账号，也不加水印。个人照片、给客户看的预览图和未发布的设计稿都可以放心处理。`,
  relatedTools: ['crop-image', 'resize-image', 'stitch-images', 'compress-images'],
}
