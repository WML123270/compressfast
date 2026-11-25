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
  /**
   * 构图参考线（画面高度百分比）：头顶虚线与下巴虚线。
   * 中国常用规格头部约占画面 80%；美国护照要求头部占 50–69%，
   * 因此不能所有尺寸共用同一组参考线。参考线只是通用起点，以官方要求为准。
   */
  guideTop: number
  guideBottom: number
}

export const ID_PHOTO_PRESETS: IdPhotoPreset[] = [
  { key: 'one', labelZh: '一寸', labelEn: '1-inch', sizeZh: '25×35mm', sizeEn: '25×35mm', width: 295, height: 413, guideTop: 0.08, guideBottom: 0.90 },
  { key: 'two', labelZh: '二寸', labelEn: '2-inch', sizeZh: '35×49mm', sizeEn: '35×49mm', width: 413, height: 579, guideTop: 0.08, guideBottom: 0.90 },
  { key: 'small-two', labelZh: '小二寸', labelEn: 'Small 2-inch', sizeZh: '35×45mm', sizeEn: '35×45mm', width: 413, height: 531, guideTop: 0.08, guideBottom: 0.90 },
  { key: 'large-one', labelZh: '大一寸', labelEn: 'Large 1-inch', sizeZh: '33×48mm', sizeEn: '33×48mm', width: 390, height: 567, guideTop: 0.08, guideBottom: 0.90 },
  { key: 'us-passport', labelZh: '美国护照', labelEn: 'US passport', sizeZh: '2×2 英寸', sizeEn: '2×2 in', width: 600, height: 600, guideTop: 0.10, guideBottom: 0.82 },
  { key: 'japan-visa', labelZh: '日本签证', labelEn: 'Japan visa', sizeZh: '45×45mm', sizeEn: '45×45mm', width: 531, height: 531, guideTop: 0.09, guideBottom: 0.86 },
]

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
