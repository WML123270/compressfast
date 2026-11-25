// 证件照尺寸预设（300 DPI 对应的像素尺寸）
// 只列常用规格；各地/各国受理机构要求不同，页面需提示以官方要求为准。

export interface IdPhotoPreset {
  key: string
  labelZh: string
  labelEn: string
  sizeZh: string
  sizeEn: string
  width: number
  height: number
  /** 输出 DPI（标准尺寸为 300，自定义可选 600） */
  dpi: number
  /**
   * 构图参考线（画面高度百分比）：头顶虚线与下巴虚线。
   * 中国常用规格头部约占画面 80%；美国护照要求头部占 50–69%，
   * 因此不能所有尺寸共用同一组参考线。参考线只是通用起点，以官方要求为准。
   */
  guideTop: number
  guideBottom: number
}

export const ID_PHOTO_PRESETS: IdPhotoPreset[] = [
  { key: 'one', labelZh: '一寸', labelEn: '1-inch', sizeZh: '25×35mm', sizeEn: '25×35mm', width: 295, height: 413, dpi: 300, guideTop: 0.08, guideBottom: 0.90 },
  { key: 'two', labelZh: '二寸', labelEn: '2-inch', sizeZh: '35×49mm', sizeEn: '35×49mm', width: 413, height: 579, dpi: 300, guideTop: 0.08, guideBottom: 0.90 },
  { key: 'small-two', labelZh: '小二寸', labelEn: 'Small 2-inch', sizeZh: '35×45mm', sizeEn: '35×45mm', width: 413, height: 531, dpi: 300, guideTop: 0.08, guideBottom: 0.90 },
  { key: 'large-one', labelZh: '大一寸', labelEn: 'Large 1-inch', sizeZh: '33×48mm', sizeEn: '33×48mm', width: 390, height: 567, dpi: 300, guideTop: 0.08, guideBottom: 0.90 },
  { key: 'us-passport', labelZh: '美国护照', labelEn: 'US passport', sizeZh: '2×2 英寸', sizeEn: '2×2 in', width: 600, height: 600, dpi: 300, guideTop: 0.10, guideBottom: 0.82 },
  { key: 'japan-visa', labelZh: '日本签证', labelEn: 'Japan visa', sizeZh: '45×45mm', sizeEn: '45×45mm', width: 531, height: 531, dpi: 300, guideTop: 0.09, guideBottom: 0.86 },
]

// ─── 自定义尺寸 ───
// 上限按 600DPI 控制画布大小：60×80mm → 1417×1890px，移动端内存安全。
export const CUSTOM_MIN_MM = 10
export const CUSTOM_MAX_W_MM = 60
export const CUSTOM_MAX_H_MM = 80
export const CUSTOM_DPIS = [300, 600] as const

export function clampMm(value: number, max: number): number {
  if (!Number.isFinite(value)) return CUSTOM_MIN_MM
  return Math.min(max, Math.max(CUSTOM_MIN_MM, Math.round(value)))
}

export function mmToPx(mm: number, dpi: number): number {
  return Math.max(1, Math.round((mm / 25.4) * dpi))
}

/** 由 mm + DPI 生成一个与标准预设同结构的自定义尺寸（参考线用通用比例） */
export function makeCustomPreset(widthMm: number, heightMm: number, dpi: number): IdPhotoPreset {
  const w = clampMm(widthMm, CUSTOM_MAX_W_MM)
  const h = clampMm(heightMm, CUSTOM_MAX_H_MM)
  const d = dpi === 600 ? 600 : 300
  return {
    key: 'custom',
    labelZh: '自定义',
    labelEn: 'Custom',
    sizeZh: `${w}×${h}mm`,
    sizeEn: `${w}×${h}mm`,
    width: mmToPx(w, d),
    height: mmToPx(h, d),
    dpi: d,
    guideTop: 0.08,
    guideBottom: 0.90,
  }
}

export const DEFAULT_PRESET_KEY = 'one'

export function getPreset(key: string): IdPhotoPreset {
  return ID_PHOTO_PRESETS.find((p) => p.key === key) || ID_PHOTO_PRESETS[0]
}

export const BG_COLORS = [
  { key: 'white', color: '#FFFFFF', zh: '白底', en: 'White' },
  { key: 'blue', color: '#438EDB', zh: '蓝底', en: 'Blue' },
  { key: 'red', color: '#FF0000', zh: '红底', en: 'Red' },
  { key: 'gray', color: '#E8E8E8', zh: '灰底', en: 'Gray' },
] as const

export type IdPhotoFormat = 'jpeg' | 'png'

export const MAX_FILE_BYTES = 30 * 1024 * 1024
/** u2netp.onnx 实际大小，用于文案与进度兜底 */
export const MODEL_SIZE_MB = 4.4
