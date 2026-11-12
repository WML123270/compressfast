// 拆分页码解析：支持 "1-3,5,8-10"，兼容中文逗号/全角数字/各种破折号

import { MAX_RANGE_INPUT_LENGTH, MAX_SPLIT_OUTPUTS } from './constants'

export interface PageRange {
  start: number
  end: number
}

export interface ParsedRanges {
  ranges: PageRange[]
  pages: number[] // 展平、按首次出现去重
  totalPages: number
}

export type RangeErrorCode =
  | 'empty'
  | 'too-long'
  | 'invalid-token'
  | 'zero'
  | 'reversed'
  | 'out-of-range'
  | 'too-many-outputs'

export type ParseRangesResult =
  | { ok: true; value: ParsedRanges }
  | { ok: false; code: RangeErrorCode; token?: string }

function normalizeRangeInput(input: string): string {
  return input
    .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[，、；]/g, ',')
    .replace(/[–—−－]/g, '-')
}

export function parsePageRanges(
  input: string,
  pageCount: number,
  maxOutputs: number = MAX_SPLIT_OUTPUTS,
): ParseRangesResult {
  if (input.length > MAX_RANGE_INPUT_LENGTH) return { ok: false, code: 'too-long' }

  const normalized = normalizeRangeInput(input)
  const tokens = normalized.split(',').map(t => t.trim()).filter(Boolean)
  if (tokens.length === 0) return { ok: false, code: 'empty' }
  if (tokens.length > maxOutputs) return { ok: false, code: 'too-many-outputs' }

  const ranges: PageRange[] = []
  const pages: number[] = []
  const seen = new Set<number>()

  for (const token of tokens) {
    const single = /^(\d+)$/.exec(token)
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(token)
    if (!single && !range) return { ok: false, code: 'invalid-token', token }

    const start = Number(single ? single[1] : range![1])
    const end = Number(single ? single[1] : range![2])

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
      return { ok: false, code: 'invalid-token', token }
    }
    if (start < 1 || end < 1) return { ok: false, code: 'zero', token }
    if (start > end) return { ok: false, code: 'reversed', token }
    if (end > pageCount) return { ok: false, code: 'out-of-range', token }

    ranges.push({ start, end })
    for (let p = start; p <= end; p++) {
      if (!seen.has(p)) {
        seen.add(p)
        pages.push(p)
      }
    }
  }

  if (ranges.length > maxOutputs) return { ok: false, code: 'too-many-outputs' }

  return { ok: true, value: { ranges, pages, totalPages: pageCount } }
}

export function rangeErrorMessage(
  result: { code: RangeErrorCode; token?: string },
  isZh: boolean,
  pageCount: number,
): string {
  const max = MAX_SPLIT_OUTPUTS
  const zh: Record<RangeErrorCode, string> = {
    empty: '请输入页码，例如 1-3,5,8-10。',
    'too-long': '页码输入过长，请简化后再试。',
    'invalid-token': `无法识别“${result.token ?? ''}”，示例：1-3,5,8-10。`,
    zero: '页码从 1 开始。',
    reversed: `起始页不能大于结束页（${result.token ?? ''}）。`,
    'out-of-range': `页码超出范围，此 PDF 共 ${pageCount} 页。`,
    'too-many-outputs': `最多生成 ${max} 个文件，请减少范围数量。`,
  }
  const en: Record<RangeErrorCode, string> = {
    empty: 'Enter page ranges, for example 1-3,5,8-10.',
    'too-long': 'The range input is too long. Please simplify it.',
    'invalid-token': `Unrecognized range “${result.token ?? ''}”. Example: 1-3,5,8-10.`,
    zero: 'Page numbers start at 1.',
    reversed: `Start page cannot be greater than end page (${result.token ?? ''}).`,
    'out-of-range': `Page out of range — this PDF has ${pageCount} pages.`,
    'too-many-outputs': `At most ${max} files can be generated. Reduce the number of ranges.`,
  }
  return isZh ? zh[result.code] : en[result.code]
}
