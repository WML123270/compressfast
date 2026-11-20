// 本地 AI 运行环境检测
// Worker 里依赖 OffscreenCanvas / WebAssembly / createImageBitmap，
// 老浏览器（如 iOS 16.4 以下的 Safari）直接跑会抛出难以理解的错误，
// 提前检测并给出明确提示。

export function detectAiSupportIssue(): string | null {
  if (typeof window === 'undefined') return null
  if (typeof Worker === 'undefined') return 'Worker is not available'
  if (typeof WebAssembly === 'undefined') return 'WebAssembly is not available'
  if (typeof OffscreenCanvas === 'undefined') return 'OffscreenCanvas is not available'
  if (typeof createImageBitmap === 'undefined') return 'createImageBitmap is not available'
  try {
    // eslint-disable-next-line no-new
    new OffscreenCanvas(1, 1)
  } catch {
    return 'OffscreenCanvas cannot be created'
  }
  return null
}
