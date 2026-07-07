import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
}

/** 根据输出格式和原始类型，生成带正确扩展名的输出文件名 */
export function getOutputFileName(
  originalName: string,
  outputFormat: string,
  originalType: string,
): string {
  const baseName = originalName.replace(/\.[^.]+$/, '')

  let ext: string
  if (outputFormat === 'original') {
    ext = MIME_TO_EXT[originalType] || '.png'
  } else if (outputFormat === 'jpeg') {
    ext = '.jpg'
  } else {
    ext = '.' + outputFormat
  }

  return baseName + '_compressed' + ext
}

/** 根据 MIME 类型获取文件扩展名 */
export function getExtensionFromType(mimeType: string): string {
  return MIME_TO_EXT[mimeType] || '.png'
}
