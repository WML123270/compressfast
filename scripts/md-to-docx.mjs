/**
 * Markdown → Word（.docx）排版脚本
 *
 * 用法：
 *   node scripts/md-to-docx.mjs <input.md> <output.docx>
 *
 * 支持：标题、段落、粗体、行内代码、链接、列表、复选框、表格、
 *       代码块、引用块、水平分隔线；A4 页眉页脚、页码、Word 导航大纲。
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
  ExternalHyperlink,
  PageNumber,
  Header,
  Footer,
  LineRuleType,
  TableLayoutType,
  TabStopType,
} from 'docx'

const input = process.argv[2]
const output = process.argv[3]

if (!input || !output) {
  console.error('用法: node scripts/md-to-docx.mjs <input.md> <output.docx>')
  process.exit(1)
}

const FONT = {
  ascii: 'Microsoft YaHei',
  eastAsia: 'Microsoft YaHei',
  hAnsi: 'Microsoft YaHei',
}
const CODE_FONT = {
  ascii: 'Consolas',
  eastAsia: 'Microsoft YaHei',
  hAnsi: 'Consolas',
}
const ACCENT = '0B6E99'
const ACCENT_DARK = '1F4E79'
const GRAY = '666666'
const LIGHT_GRAY = '888888'
const TABLE_BORDER = 'C9D1D9'
const CODE_BG = 'F6F8FA'

const md = fs.readFileSync(input, 'utf8')
const lines = md.replace(/\r\n/g, '\n').split('\n')

// ─── 解析封面信息（首个 H1 + 后面的引用块）────────────────────────────
let coverTitle = ''
let coverSubtitle = ''
const coverNotes = []
let contentStart = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (i === 0 && line.startsWith('# ')) {
    const full = line.slice(2).trim()
    const idx = full.indexOf('：')
    if (idx > 0) {
      coverTitle = full.slice(0, idx).trim()
      coverSubtitle = full.slice(idx + 1).trim()
    } else {
      coverTitle = full
    }
  } else if (line.startsWith('> ')) {
    coverNotes.push(line.slice(2).trim())
  } else if (line.startsWith('## ')) {
    contentStart = i
    break
  }
}

if (!coverTitle) coverTitle = '海外收款完整教程'
if (!coverSubtitle) coverSubtitle = 'Creem 实战版'

// ─── 行内格式 ─────────────────────────────────────────────────────────
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<>"')]+|\*[^*]+\*)/g

function textRun(text, opts = {}) {
  return new TextRun({
    text,
    font: opts.code ? CODE_FONT : FONT,
    size: opts.size ?? 21,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color,
    underline: opts.underline,
    shading: opts.shading,
  })
}

function inlineRuns(text, baseSize = 21, inherited = {}) {
  const children = []
  let last = 0
  let match
  // 每次递归都新建正则，避免共享 lastIndex 导致死循环/OOM
  const re = new RegExp(INLINE_RE.source, INLINE_RE.flags)

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      children.push(textRun(text.slice(last, match.index), { size: baseSize, ...inherited }))
    }
    const token = match[0]

    if (token.startsWith('**') && token.endsWith('**')) {
      // 粗体里可能嵌套行内代码，递归解析，避免把反引号原样输出
      children.push(...inlineRuns(token.slice(2, -2), baseSize, { ...inherited, bold: true }))
    } else if (token.startsWith('`') && token.endsWith('`')) {
      children.push(
        textRun(token.slice(1, -1), {
          size: Math.max(16, baseSize - 2),
          code: true,
          bold: inherited.bold,
          italics: inherited.italics,
          shading: { type: ShadingType.CLEAR, fill: CODE_BG },
        }),
      )
    } else if (token.startsWith('[')) {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (m) {
        children.push(
          new ExternalHyperlink({
            link: m[2],
            children: [
              new TextRun({
                text: m[1],
                font: FONT,
                size: baseSize,
                bold: inherited.bold,
                italics: inherited.italics,
                color: '0563C1',
                underline: { type: 'single' },
              }),
            ],
          }),
        )
      } else {
        children.push(textRun(token, { size: baseSize, ...inherited }))
      }
    } else if (token.startsWith('http')) {
      const trailing = token.match(/[.,;:]+$/)?.[0] ?? ''
      const url = trailing ? token.slice(0, -trailing.length) : token
      children.push(
        new ExternalHyperlink({
          link: url,
          children: [
            new TextRun({
              text: url,
              font: FONT,
              size: baseSize,
              bold: inherited.bold,
              italics: inherited.italics,
              color: '0563C1',
              underline: { type: 'single' },
            }),
          ],
        }),
      )
      if (trailing) children.push(textRun(trailing, { size: baseSize, ...inherited }))
    } else if (token.startsWith('*') && token.endsWith('*')) {
      children.push(...inlineRuns(token.slice(1, -1), baseSize, { ...inherited, italics: true }))
    } else {
      children.push(textRun(token, { size: baseSize, ...inherited }))
    }

    last = match.index + token.length
  }

  if (last < text.length) children.push(textRun(text.slice(last), { size: baseSize, ...inherited }))
  return children.length ? children : [textRun('', { size: baseSize })]
}

// ─── 块级构建 ─────────────────────────────────────────────────────────
const children = []
let pendingParagraph = []

function flushParagraph() {
  if (!pendingParagraph.length) return
  let text = pendingParagraph.join(' ').replace(/\s+/g, ' ').trim()
  pendingParagraph = []
  if (!text) return
  children.push(
    new Paragraph({
      children: inlineRuns(text),
      spacing: { after: 130, line: 300, lineRule: LineRuleType.AUTO },
    }),
  )
}

function heading(text, level) {
  const styles = {
    1: { size: 32, color: ACCENT, before: 260, after: 150, outline: 0, border: true },
    2: { size: 26, color: ACCENT_DARK, before: 220, after: 100, outline: 1 },
    3: { size: 23, color: '333333', before: 180, after: 80, outline: 2 },
    4: { size: 21, color: '333333', before: 150, after: 60, outline: 3 },
  }
  const s = styles[level] ?? styles[3]
  return new Paragraph({
    children: inlineRuns(text, s.size),
    // Markdown 的一级章节是 ##，每章从新页开始
    pageBreakBefore: level === 2 ? true : undefined,
    spacing: { before: s.before, after: s.after, line: 280, lineRule: LineRuleType.AUTO },
    outlineLevel: s.outline,
    keepNext: true,
    border: s.border
      ? {
          bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 4 },
        }
      : undefined,
  })
}

function quoteBlock(text) {
  return new Paragraph({
    children: inlineRuns(text, 20),
    spacing: { before: 100, after: 120, line: 280, lineRule: LineRuleType.AUTO },
    indent: { left: 360 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 8 },
    },
    shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
  })
}

function codeBlock(codeLines) {
  const paragraphs = codeLines.map(line =>
    new Paragraph({
      children: [textRun(line || ' ', { size: 17, code: true })],
      spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO },
    }),
  )
  const cell = new TableCell({
    children: paragraphs,
    shading: { type: ShadingType.CLEAR, fill: CODE_BG },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
  return new Table({
    rows: [new TableRow({ children: [cell] })],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [9500],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
      left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT },
      right: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
  })
}

function tableBlock(rawRows) {
  const rows = rawRows
    .map(r =>
      r
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(c => c.trim()),
    )
    .filter(cells => !cells.every(c => /^:?-{2,}:?$/.test(c)))

  if (!rows.length) return null
  const colCount = Math.max(...rows.map(r => r.length))
  rows.forEach(r => {
    while (r.length < colCount) r.push('')
  })

  const weights = Array.from({ length: colCount }, (_, i) =>
    Math.max(4, ...rows.map(r => (r[i] || '').length)),
  )
  let widths = weights.map(w => Math.max(900, Math.round((w / weights.reduce((a, b) => a + b, 0)) * 9500)))
  const widthSum = widths.reduce((a, b) => a + b, 0)
  widths = widths.map(w => Math.round((w / widthSum) * 9500))

  const tableRows = rows.map((cells, rowIndex) => {
    const isHeader = rowIndex === 0
    return new TableRow({
      tableHeader: isHeader,
      cantSplit: false,
      children: cells.map((cell, i) =>
        new TableCell({
          children: [
            new Paragraph({
              children: inlineRuns(cell || ' ', 19),
              spacing: { before: 20, after: 20, line: 240, lineRule: LineRuleType.AUTO },
            }),
          ],
          shading: isHeader
            ? { type: ShadingType.CLEAR, fill: 'E8F4FA' }
            : undefined,
          width: { size: widths[i], type: WidthType.DXA },
          margins: { top: 70, bottom: 70, left: 100, right: 100 },
        }),
      ),
    })
  })

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: TABLE_BORDER },
    },
  })
}

function bulletParagraph(content, level = 0, checkbox = null) {
  if (checkbox !== null) {
    return new Paragraph({
      children: [textRun(checkbox ? '☑ ' : '☐ ', { size: 21 }), ...inlineRuns(content)],
      spacing: { after: 50, line: 280, lineRule: LineRuleType.AUTO },
      indent: { left: 360 + level * 360, hanging: 240 },
    })
  }
  return new Paragraph({
    children: inlineRuns(content),
    bullet: { level: Math.min(level, 3) },
    spacing: { after: 50, line: 280, lineRule: LineRuleType.AUTO },
  })
}

function numberedParagraph(num, content) {
  return new Paragraph({
    children: [textRun(`${num}. `, { size: 21 }), ...inlineRuns(content)],
    spacing: { after: 50, line: 280, lineRule: LineRuleType.AUTO },
    indent: { left: 420, hanging: 300 },
  })
}

// ─── 主循环 ───────────────────────────────────────────────────────────
let i = contentStart
while (i < lines.length) {
  const line = lines[i]
  const trimmed = line.trim()

  // 代码块
  if (trimmed.startsWith('```')) {
    flushParagraph()
    const codeLines = []
    i++
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      codeLines.push(lines[i].replace(/\t/g, '  '))
      i++
    }
    if (i < lines.length) i++
    children.push(codeBlock(codeLines))
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }))
    continue
  }

  // 表格
  if (trimmed.startsWith('|')) {
    flushParagraph()
    const rawRows = []
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      rawRows.push(lines[i])
      i++
    }
    const table = tableBlock(rawRows)
    if (table) {
      children.push(table)
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }))
    }
    continue
  }

  // 标题
  const headingMatch = /^(#{1,4})\s+(.*)$/.exec(trimmed)
  if (headingMatch) {
    flushParagraph()
    const level = headingMatch[1].length
    if (level === 1 && skipFirstH1) {
      skipFirstH1 = false
      i++
      continue
    }
    children.push(heading(headingMatch[2], level))
    i++
    continue
  }

  // 水平分隔线
  if (/^---+$/.test(trimmed)) {
    flushParagraph()
    i++
    continue
  }

  // 引用块
  if (trimmed.startsWith('>')) {
    flushParagraph()
    const quoteLines = []
    while (i < lines.length && lines[i].trim().startsWith('>')) {
      quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
      i++
    }
    children.push(quoteBlock(quoteLines.join(' ').replace(/\s+/g, ' ').trim()))
    continue
  }

  // 复选框列表
  const checkboxMatch = /^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line)
  if (checkboxMatch) {
    flushParagraph()
    const level = Math.min(2, Math.floor(checkboxMatch[1].length / 2))
    children.push(bulletParagraph(checkboxMatch[3], level, checkboxMatch[2].toLowerCase() === 'x'))
    i++
    continue
  }

  // 无序列表（支持 2 空格缩进）
  const bulletMatch = /^(\s*)[-*]\s+(.*)$/.exec(line)
  if (bulletMatch) {
    flushParagraph()
    const level = Math.min(2, Math.floor(bulletMatch[1].length / 2))
    children.push(bulletParagraph(bulletMatch[2], level))
    i++
    continue
  }

  // 有序列表
  const numberMatch = /^(\s*)(\d+)\.\s+(.*)$/.exec(line)
  if (numberMatch) {
    flushParagraph()
    children.push(numberedParagraph(numberMatch[2], numberMatch[3]))
    i++
    continue
  }

  // 空行
  if (!trimmed) {
    flushParagraph()
    i++
    continue
  }

  // 普通段落
  pendingParagraph.push(trimmed)
  i++
}
flushParagraph()

// ─── 封面 ─────────────────────────────────────────────────────────────
const cover = [
  new Paragraph({ children: [], spacing: { before: 1200 } }),
  new Paragraph({
    children: [
      new TextRun({
        text: coverTitle,
        font: FONT,
        size: 60,
        bold: true,
        color: ACCENT,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: coverSubtitle,
        font: FONT,
        size: 30,
        bold: true,
        color: '333333',
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
  }),
  new Paragraph({
    children: [],
    spacing: { after: 260 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 2 },
    },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: '基于真实项目接入经验整理',
        font: FONT,
        size: 22,
        color: GRAY,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 140 },
  }),
  ...coverNotes.map(
    note =>
      new Paragraph({
        children: [new TextRun({ text: note, font: FONT, size: 19, color: GRAY })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 70 },
      }),
  ),
]

// ─── 文档 ─────────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'CompressFast',
  title: coverTitle,
  description: coverSubtitle,
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 21, color: '222222' },
        paragraph: { spacing: { after: 120, line: 300, lineRule: LineRuleType.AUTO } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: 9500 }],
              children: [
                new TextRun({
                  text: '从 0 到第一笔美元 · 海外收款教程',
                  font: FONT,
                  size: 16,
                  color: LIGHT_GRAY,
                }),
                new TextRun({ text: '\t' }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT,
                  size: 16,
                  color: LIGHT_GRAY,
                }),
              ],
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' },
              },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Creem 实战版 · 2026-11',
                  font: FONT,
                  size: 16,
                  color: LIGHT_GRAY,
                }),
              ],
            }),
          ],
        }),
      },
      children: [...cover, ...children],
    },
  ],
})

const buffer = await Packer.toBuffer(doc)
fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, buffer)
console.log(`✓ Word 已生成: ${output}`)
console.log(`  大小: ${(buffer.length / 1024).toFixed(1)} KB`)
