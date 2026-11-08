// 背景合成 —— 把透明前景（AI 抠图结果）叠加到纯色 / 图片背景上
// 全程在主线程 canvas 完成，无需重新跑模型；抠图结果本身带 alpha 通道。

export type BackgroundOption =
  | { type: 'transparent' }
  | { type: 'color'; color: string }
  | { type: 'image'; imageFile: File }

/**
 * 将透明前景合成到指定背景上。
 * - transparent：原样返回（保持透明背景）
 * - color：纯色铺底后叠加前景
 * - image：背景图 cover 裁剪铺满前景尺寸后叠加前景
 * 输出尺寸 = 前景（原图）尺寸，导出 PNG。
 */
export async function compositeBackground(
  foregroundBlob: Blob,
  bg: BackgroundOption,
): Promise<Blob> {
  const fg = await createImageBitmap(foregroundBlob)
  const w = fg.width
  const h = fg.height

  if (bg.type === 'transparent') {
    fg.close()
    return foregroundBlob
  }

  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!

  if (bg.type === 'color') {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, w, h)
  } else {
    // 图片背景：cover 缩放（铺满 + 居中裁剪）
    const bgImg = await createImageBitmap(bg.imageFile)
    const iw = bgImg.width
    const ih = bgImg.height
    const scale = Math.max(w / iw, h / ih)
    const dw = iw * scale
    const dh = ih * scale
    ctx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh)
    bgImg.close()
  }

  ctx.drawImage(fg, 0, 0)
  fg.close()
  return canvas.convertToBlob({ type: 'image/png' })
}
