// 证件照合成：透明人像 → 纯色底 → JPG/PNG；以及 6 寸相纸排版。

import type { IdPhotoFormat } from './presets'

/** 把带 alpha 的人像叠到纯色底上，输出指定格式 */
export async function composeOnBackground(
  cutout: Blob,
  bgColor: string,
  format: IdPhotoFormat,
  quality = 0.92,
): Promise<Blob> {
  const bitmap = await createImageBitmap(cutout)
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, bitmap.width, bitmap.height)
    ctx.drawImage(bitmap, 0, 0)
    return await canvas.convertToBlob({
      type: format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality: format === 'jpeg' ? quality : undefined,
    })
  } finally {
    bitmap.close()
  }
}

/** 6 寸相纸：4×6 英寸，300 DPI */
export const SHEET_WIDTH = 1200
export const SHEET_HEIGHT = 1800
const SHEET_MARGIN = 40
const SHEET_GAP = 20

export interface PrintSheetResult {
  blob: Blob
  cols: number
  rows: number
  copies: number
}

/**
 * 把已经合成好的单张证件照排到 6 寸相纸上，带淡灰色裁切线。
 * 自动按纸张计算能放几列几行。
 */
export async function composePrintSheet(photo: Blob): Promise<PrintSheetResult> {
  const bitmap = await createImageBitmap(photo)
  try {
    const pw = bitmap.width
    const ph = bitmap.height
    const cols = Math.max(1, Math.floor((SHEET_WIDTH - SHEET_MARGIN * 2 + SHEET_GAP) / (pw + SHEET_GAP)))
    const rows = Math.max(1, Math.floor((SHEET_HEIGHT - SHEET_MARGIN * 2 + SHEET_GAP) / (ph + SHEET_GAP)))
    const copies = cols * rows

    // 整体居中
    const blockW = cols * pw + (cols - 1) * SHEET_GAP
    const blockH = rows * ph + (rows - 1) * SHEET_GAP
    const startX = Math.round((SHEET_WIDTH - blockW) / 2)
    const startY = Math.round((SHEET_HEIGHT - blockH) / 2)

    const canvas = new OffscreenCanvas(SHEET_WIDTH, SHEET_HEIGHT)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT)

    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 8])

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (pw + SHEET_GAP)
        const y = startY + r * (ph + SHEET_GAP)
        ctx.drawImage(bitmap, x, y)

        // 裁切线画在照片外侧半像素处，避免直接压在人物上
        ctx.strokeRect(x - 0.5, y - 0.5, pw + 1, ph + 1)
      }
    }

    return {
      blob: await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 }),
      cols,
      rows,
      copies,
    }
  } finally {
    bitmap.close()
  }
}
