// PDF 工具共用常量（服务端/客户端都可安全引用，勿引入浏览器 API）

export const MAX_PDF_BYTES = 50 * 1024 * 1024

// 合并
export const MAX_MERGE_FILES = 20
export const MAX_MERGE_TOTAL_BYTES = 150 * 1024 * 1024
export const MAX_MERGE_PAGES = 2000

// 拆分
export const MAX_SPLIT_PAGES = 500
export const MAX_SPLIT_OUTPUTS = 200
export const MAX_RANGE_INPUT_LENGTH = 500

// 压缩
export const MAX_COMPRESS_PAGES = 100
export const MAX_CANVAS_PIXELS = 16_777_216 // 16.7MP，约 4096×4096
export const MAX_CANVAS_EDGE = 4096

export const COMPRESS_PRESETS = {
  strong: { dpi: 110, quality: 0.55 },
  balanced: { dpi: 150, quality: 0.7 },
  high: { dpi: 200, quality: 0.82 },
} as const

export type CompressPreset = keyof typeof COMPRESS_PRESETS

// 转图片
export const MAX_PDF_IMAGE_PAGES = 100
export const PDF_IMAGE_EXT = { jpeg: 'jpg', png: 'png' } as const
export type PdfImageFormat = keyof typeof PDF_IMAGE_EXT

// 埋点：PDF 工具白名单（服务端校验，防止任意 key 注入）
export const PDF_TOOL_SLUGS = ['image-to-pdf', 'merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-jpg'] as const
export type PdfTool = (typeof PDF_TOOL_SLUGS)[number]

export const PDF_COMPRESS_MODES = ['lossy', 'lossless'] as const
export type PdfCompressMode = (typeof PDF_COMPRESS_MODES)[number]
