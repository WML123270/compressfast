'use client'

import { useRef, useState } from 'react'
import { FileText, Plus, Upload } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { isPdfFile } from '@/lib/pdf/file-utils'

interface PdfDropzoneProps {
  multiple?: boolean
  compact?: boolean
  compactLabel?: string
  disabled?: boolean
  hint?: string
  onFiles: (files: File[]) => void
}

export function PdfDropzone({
  multiple = false,
  compact = false,
  compactLabel,
  disabled = false,
  hint,
  onFiles,
}: PdfDropzoneProps) {
  const { locale } = useT()
  const isZh = locale === 'zh'
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [note, setNote] = useState('')

  const accept = (files: File[]) => {
    if (disabled) return
    const pdfs = files.filter(isPdfFile)
    const rejected = files.length - pdfs.length
    setNote(
      rejected > 0
        ? isZh
          ? `已忽略 ${rejected} 个非 PDF 文件`
          : `${rejected} non-PDF file${rejected > 1 ? 's' : ''} ignored`
        : '',
    )
    if (pdfs.length > 0) onFiles(multiple ? pdfs : pdfs.slice(0, 1))
  }

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    accept(Array.from(e.dataTransfer.files ?? []))
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) accept(files)
          e.target.value = ''
        }}
      />

      {compact ? (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={e => {
            e.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed text-xs font-medium transition-colors disabled:opacity-50 ${
            dragging
              ? 'border-cyan-400 bg-cyan-500/10 text-cyan-700'
              : 'border-gray-300 text-gray-600 hover:border-cyan-300 hover:text-cyan-700'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {compactLabel ?? (isZh ? '继续添加 PDF' : 'Add more PDFs')}
        </button>
      ) : (
        <div
          onClick={openPicker}
          onDragOver={e => {
            e.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openPicker()
            }
          }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : dragging
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-gray-300 bg-white/50 hover:border-cyan-300'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600">
              <Upload className="w-6 h-6" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">
                {isZh ? '拖入 PDF，或点击选择文件' : 'Drop PDFs here, or click to browse'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {hint ?? (isZh ? '支持 .pdf，文件不会上传到服务器' : 'PDF files only — nothing is uploaded')}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold">
              <FileText className="w-3.5 h-3.5" />
              {isZh ? '选择 PDF' : 'Select PDF'}
            </span>
          </div>
        </div>
      )}

      {note && <p className="text-xs text-amber-600">{note}</p>}
    </div>
  )
}
