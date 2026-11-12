'use client'

import type { ReactNode } from 'react'
import { FileText, Loader2, X } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { formatFileSize } from '@/lib/compression/utils'

interface PdfFileCardProps {
  file: File
  pageCount?: number | null
  status?: 'loading' | 'ready' | 'error'
  error?: string
  disabled?: boolean
  onRemove: () => void
  actions?: ReactNode
  index?: number
}

export function PdfFileCard({
  file,
  pageCount,
  status = 'ready',
  error,
  disabled = false,
  onRemove,
  actions,
  index,
}: PdfFileCardProps) {
  const { locale } = useT()
  const isZh = locale === 'zh'

  return (
    <div className={`flex items-start gap-2.5 px-3 sm:px-4 py-2.5 min-w-0 ${error ? 'bg-red-50/40' : ''}`}>
      {typeof index === 'number' && (
        <span className="hidden sm:inline-flex items-center justify-center w-5 h-5 rounded-md bg-gray-100 text-[11px] font-semibold text-gray-500 flex-shrink-0 mt-0.5">
          {index + 1}
        </span>
      )}
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex-shrink-0 mt-0.5">
        <FileText className="w-4 h-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
          <span>{formatFileSize(file.size)}</span>
          {status === 'loading' && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {isZh ? '读取中…' : 'Reading…'}
            </span>
          )}
          {status !== 'loading' && typeof pageCount === 'number' && (
            <span>· {isZh ? `${pageCount} 页` : `${pageCount} page${pageCount > 1 ? 's' : ''}`}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1 break-words">{error}</p>}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {actions}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={isZh ? '移除文件' : 'Remove file'}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
